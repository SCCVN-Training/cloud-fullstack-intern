import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, asc, desc
from typing import List, Optional, Tuple

from app.modules.skills.models import Skill

# Allow-list mapping API-facing sort keys -> actual SQLAlchemy order_by
# clauses. Never build ORDER BY from raw user input directly (SQL
# injection / arbitrary column exposure risk) — always go through this map.
_SORT_MAP = {
    "newest": desc(Skill.created_at),
    "oldest": asc(Skill.created_at),
    "price_asc": asc(Skill.price),
    "price_desc": desc(Skill.price),
    "rating": desc(Skill.rating),
    "popular": desc(Skill.review_count),
    "title_asc": asc(Skill.title),
}

class SkillRepository:
    
    @classmethod
    async def get_by_id(cls, db: AsyncSession, skill_id: uuid.UUID) -> Optional[Skill]:
        stmt = select(Skill).where(Skill.id == skill_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    @classmethod
    async def get_all(
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
    ) -> Tuple[int, List[Skill]]:

        # Base query
        stmt = select(Skill)
        count_stmt = select(func.count()).select_from(Skill)

        if instructor_id is not None:
            stmt = stmt.where(Skill.instructor_id == instructor_id)
            count_stmt = count_stmt.where(Skill.instructor_id == instructor_id)

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

        if min_rating is not None:
            stmt = stmt.where(Skill.rating >= min_rating)
            count_stmt = count_stmt.where(Skill.rating >= min_rating)

        if min_price is not None:
            stmt = stmt.where(Skill.price >= min_price)
            count_stmt = count_stmt.where(Skill.price >= min_price)

        if max_price is not None:
            stmt = stmt.where(Skill.price <= max_price)
            count_stmt = count_stmt.where(Skill.price <= max_price)

        # Sorting — default to newest first so results are stable/predictable
        order_clause = _SORT_MAP.get(sort, _SORT_MAP["newest"])
        stmt = stmt.order_by(order_clause)

        # Get total count
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        # Get paginated data
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        skills = result.scalars().all()
        
        return total, list(skills)

    @classmethod
    async def get_distinct_categories(cls, db: AsyncSession) -> List[str]:
        stmt = select(Skill.category).distinct().order_by(Skill.category)
        result = await db.execute(stmt)
        return [row[0] for row in result.all()]

    @classmethod
    async def create(cls, db: AsyncSession, skill: Skill) -> Skill:
        db.add(skill)
        await db.commit()
        await db.refresh(skill)
        
        stmt = select(Skill).where(Skill.id == skill.id)
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
