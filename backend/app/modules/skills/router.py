import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.skills.schema import SkillCreate, SkillResponse, SkillListResponse
from app.modules.skills.service import SkillService

router = APIRouter(prefix="/skills", tags=["Skills"])

@router.get("", response_model=SkillListResponse, status_code=status.HTTP_200_OK)
async def list_skills(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by title or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: AsyncSession = Depends(get_db),
) -> SkillListResponse:
    """Get a list of all available skills for the catalog."""
    return await SkillService.get_all_skills(
        db=db, 
        skip=skip, 
        limit=limit, 
        search=search, 
        category=category
    )

@router.get("/{skill_id}", response_model=SkillResponse, status_code=status.HTTP_200_OK)
async def get_skill(
    skill_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Get detailed information about a specific skill."""
    return await SkillService.get_skill_by_id(db, skill_id)

@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill: SkillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SkillResponse:
    """Create a new skill offering."""
    return await SkillService.create_skill(db, skill, current_user)

@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a skill."""
    await SkillService.delete_skill(db, skill_id, current_user)
