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
    ) -> SkillListResponse:
        total, skills = await SkillRepository.get_all(
            db, skip, limit, search, category, min_rating, min_price, max_price, sort
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
            
        new_skill = Skill(**skill_in.model_dump(exclude_unset=True))
        created_skill = await SkillRepository.create(db, new_skill)
        return await cls._format_skill_response(created_skill)
        
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
