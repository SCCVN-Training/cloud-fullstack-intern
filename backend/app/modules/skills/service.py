import uuid
from typing import List, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.skills.models import Skill
from app.modules.skills.schema import SkillCreate, SkillResponse, SkillUpdate, SkillListResponse
from app.modules.skills.repository import SkillRepository
from app.modules.users.models import User
from app.modules.profiles.repository import ProfileRepository

class SkillService:
    
    @classmethod
    async def _format_skill_response(cls, db: AsyncSession, skill: Skill) -> SkillResponse:
        # Fetch the instructor's profile to get avatar, user name, etc.
        # This could be optimized with eager loading in a real-world scenario
        instructor_profile = await ProfileRepository.get_by_user_id(db, skill.instructor_id)
        
        name = "Unknown Instructor"
        title = "Mentor"
        bio = ""
        avatar = "https://ui-avatars.com/api/?name=User"
        
        if instructor_profile:
            bio = instructor_profile.bio or "No bio provided."
            if instructor_profile.avatar_url:
                avatar = instructor_profile.avatar_url
            if instructor_profile.skills_taught:
                title = "Expert in " + ", ".join(instructor_profile.skills_taught[:2])

        # Convert to dictionary and inject instructor fields to match SkillResponse
        skill_dict = {
            c.name: getattr(skill, c.name) for c in skill.__table__.columns
        }
        skill_dict["id"] = str(skill.id)
        skill_dict["instructor_id"] = skill.instructor_id
        skill_dict["instructor_name"] = name
        skill_dict["instructor_title"] = title
        skill_dict["instructor_bio"] = bio
        skill_dict["instructor_avatar"] = avatar
        
        return SkillResponse(**skill_dict)

    @classmethod
    async def get_all_skills(
        cls, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None
    ) -> SkillListResponse:
        total, skills = await SkillRepository.get_all(db, skip, limit, search, category)
        
        # Format all skills
        response_skills = []
        for skill in skills:
            formatted_skill = await cls._format_skill_response(db, skill)
            response_skills.append(formatted_skill)
            
        return SkillListResponse(total=total, skills=response_skills)

    @classmethod
    async def get_skill_by_id(cls, db: AsyncSession, skill_id: uuid.UUID) -> SkillResponse:
        skill = await SkillRepository.get_by_id(db, skill_id)
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skill not found"
            )
        return await cls._format_skill_response(db, skill)

    @classmethod
    async def create_skill(
        cls, 
        db: AsyncSession, 
        skill_in: SkillCreate, 
        current_user: User
    ) -> SkillResponse:
        # Ensure user can only create skills for themselves, or allow admin to create for others
        if skill_in.instructor_id != current_user.id and current_user.role.value != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
            
        new_skill = Skill(**skill_in.model_dump(exclude_unset=True))
        created_skill = await SkillRepository.create(db, new_skill)
        return await cls._format_skill_response(db, created_skill)
        
    @classmethod
    async def delete_skill(
        cls, 
        db: AsyncSession, 
        skill_id: uuid.UUID, 
        current_user: User
    ) -> None:
        skill = await SkillRepository.get_by_id(db, skill_id)
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        if skill.instructor_id != current_user.id and current_user.role.value != "ADMIN":
            raise HTTPException(status_code=403, detail="Not enough permissions")
            
        await SkillRepository.delete(db, skill)
