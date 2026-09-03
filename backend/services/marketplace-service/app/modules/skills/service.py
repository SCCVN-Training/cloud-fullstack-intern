import uuid
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.skills.models import Skill
from app.modules.skills.schema import SkillCreate, SkillResponse, SkillUpdate, SkillListResponse
from app.modules.skills.repository import SkillRepository
from app.core.dependencies import CurrentUser
from app.clients.identity_client import IdentityClient

class SkillService:
    # Pricing rule: a session tops out at 45 minutes / 100 coins, and
    # price scales linearly with duration below that — a 30-min session
    # can't be priced above ~67 coins, etc. Kept as one shared formula so
    # create and update enforce (and the frontend mirrors) the same cap.
    MAX_DURATION_MINUTES = 45
    MAX_PRICE = 100

    @classmethod
    def max_price_for_duration(cls, duration_minutes: int) -> int:
        return round(cls.MAX_PRICE * duration_minutes / cls.MAX_DURATION_MINUTES)

    @classmethod
    def _validate_duration(cls, duration_minutes: int) -> None:
        if duration_minutes <= 0 or duration_minutes > cls.MAX_DURATION_MINUTES:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Session duration must be between 1 and {cls.MAX_DURATION_MINUTES} minutes",
            )

    # Resolves the price to actually store: if the client didn't supply
    # one, it's computed from duration (the "system calculates it"
    # requirement — price is derived, not client-authoritative); if they
    # did, it's checked against the duration's cap rather than trusted
    # outright.
    @classmethod
    def _resolve_price(cls, duration_minutes: int, provided_price: Optional[int]) -> int:
        cap = cls.max_price_for_duration(duration_minutes)
        if provided_price is None:
            return cap
        if provided_price < 0 or provided_price > cap:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Price must be between 0 and {cap} coins for a {duration_minutes}-minute session",
            )
        return provided_price


    @classmethod
    async def _format_skill_response(cls, skill: Skill) -> SkillResponse:
        # Cross-service call: skill.instructor_id is just a UUID here (no
        # FK, see models.py) — instructor display data lives in
        # identity-service, fetched over REST. This is the deliberate
        # synchronous-communication example for the assignment; see
        # IdentityClient's docstring for the failure-mode discussion.
        instructor = await IdentityClient.get_public_profile(skill.instructor_id)

        skill_dict = {
            c.name: getattr(skill, c.name) for c in skill.__table__.columns
        }
        skill_dict["id"] = str(skill.id)
        skill_dict["instructor_id"] = skill.instructor_id
        skill_dict["instructor_name"] = instructor["user_name"]
        skill_dict["instructor_title"] = instructor["title"] or "Mentor"
        skill_dict["instructor_bio"] = instructor["bio"] or "No bio provided."
        skill_dict["instructor_avatar"] = instructor["avatar_url"] or "https://ui-avatars.com/api/?name=User"
        
        return SkillResponse(**skill_dict)

    @classmethod
    async def get_all_skills(
        cls, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        min_rating: Optional[float] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        sort: Optional[str] = None,
        instructor_id: Optional[uuid.UUID] = None,
    ) -> SkillListResponse:
        total, skills = await SkillRepository.get_all(
            db, skip, limit, search, category, min_rating, min_price, max_price, sort, instructor_id
        )
        
        # Format all skills. Note: this fires one identity-service call
        # per skill in the page (N calls for a page of N) — fine at this
        # project's scale (page sizes of ~6-20), but the honest
        # trade-off to flag in your deck: a production version would
        # batch this into a single POST /internal/users/bulk-public call
        # instead of N round trips.
        response_skills = []
        for skill in skills:
            formatted_skill = await cls._format_skill_response(skill)
            response_skills.append(formatted_skill)
            
        return SkillListResponse(total=total, skills=response_skills)

    @classmethod
    async def get_categories(cls, db: AsyncSession) -> List[str]:
        return await SkillRepository.get_distinct_categories(db)

    @classmethod
    async def get_skill_by_id(cls, db: AsyncSession, skill_id: uuid.UUID) -> SkillResponse:
        skill = await SkillRepository.get_by_id(db, skill_id)
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found"
            )
        return await cls._format_skill_response(skill)

    @classmethod
    async def create_skill(
        cls, 
        db: AsyncSession, 
        skill_in: SkillCreate, 
        current_user: CurrentUser
    ) -> SkillResponse:
        # Ensure user can only create skills for themselves, or allow admin to create for others
        if skill_in.instructor_id != current_user.id and current_user.role.value != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )

        skill_data = skill_in.model_dump(exclude_unset=True)
        cls._validate_duration(skill_data["duration"])
        provided_price = skill_data["price"] if "price" in skill_in.model_fields_set else None
        skill_data["price"] = cls._resolve_price(skill_data["duration"], provided_price)

        new_skill = Skill(**skill_data)
        created_skill = await SkillRepository.create(db, new_skill)
        return await cls._format_skill_response(created_skill)

    @classmethod
    async def update_skill(
        cls,
        db: AsyncSession,
        skill_id: uuid.UUID,
        skill_in: SkillUpdate,
        current_user: CurrentUser,
    ) -> SkillResponse:
        skill = await SkillRepository.get_by_id(db, skill_id)
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")

        if skill.instructor_id != current_user.id and current_user.role.value != "ADMIN":
            raise HTTPException(status_code=403, detail="Not enough permissions")

        update_data = skill_in.model_dump(exclude_unset=True)
        new_duration = update_data.get("duration", skill.duration)
        cls._validate_duration(new_duration)

        # Recompute price whenever duration or price is part of this
        # PATCH, so price never silently drifts out of sync with
        # duration — but leave it untouched if this update doesn't touch
        # either (e.g. only the title changed).
        if "duration" in update_data or "price" in update_data:
            update_data["price"] = cls._resolve_price(new_duration, update_data.get("price"))

        for field, value in update_data.items():
            setattr(skill, field, value)

        updated_skill = await SkillRepository.update(db, skill)
        return await cls._format_skill_response(updated_skill)

    @classmethod
    async def delete_skill(
        cls, 
        db: AsyncSession, 
        skill_id: uuid.UUID, 
        current_user: CurrentUser
    ) -> None:
        skill = await SkillRepository.get_by_id(db, skill_id)
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        if skill.instructor_id != current_user.id and current_user.role.value != "ADMIN":
            raise HTTPException(status_code=403, detail="Not enough permissions")
            
        await SkillRepository.delete(db, skill)
