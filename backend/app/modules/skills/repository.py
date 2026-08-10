import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional, Tuple

from app.modules.skills.models import Skill

class SkillRepository:
    
    @classmethod
    async def get_by_id(cls, db: AsyncSession, skill_id: uuid.UUID) -> Optional[Skill]:
        stmt = select(Skill).where(Skill.id == skill_id).options(selectinload(Skill.instructor))
        result = await db.execute(stmt)
        return result.scalars().first()

    @classmethod
    async def get_all(
        cls, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 20, 
        search: Optional[str] = None,
        category: Optional[str] = None
    ) -> Tuple[int, List[Skill]]:
        
        # Base query
        stmt = select(Skill).options(selectinload(Skill.instructor))
        count_stmt = select(func.count()).select_from(Skill)
        
        # Apply filters
        if search:
            search_filter = or_(
                Skill.title.ilike(f"%{search}%"),
                Skill.description.ilike(f"%{search}%")
            )
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.where(search_filter)
            
        if category:
            stmt = stmt.where(Skill.category == category)
            count_stmt = count_stmt.where(Skill.category == category)
            
        # Get total count
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Get paginated data
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        skills = result.scalars().all()
        
        return total, list(skills)

    @classmethod
    async def create(cls, db: AsyncSession, skill: Skill) -> Skill:
        db.add(skill)
        await db.commit()
        await db.refresh(skill)
        
        # Load the instructor relation to avoid DetachedInstanceError on schema dump
        stmt = select(Skill).where(Skill.id == skill.id).options(selectinload(Skill.instructor))
        result = await db.execute(stmt)
        return result.scalars().first()

    @classmethod
    async def update(cls, db: AsyncSession, skill: Skill) -> Skill:
        await db.commit()
        await db.refresh(skill)
        return skill

    @classmethod
    async def delete(cls, db: AsyncSession, skill: Skill) -> None:
        await db.delete(skill)
        await db.commit()
