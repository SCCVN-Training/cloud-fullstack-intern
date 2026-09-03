import uuid
from typing import List, Literal, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, CurrentUser
from app.core.rate_limit import limiter
from app.modules.skills.schema import SkillCreate, SkillUpdate, SkillResponse, SkillListResponse
from app.modules.skills.service import SkillService

router = APIRouter(prefix="/skills", tags=["Skills"])

SortOption = Literal[
    "newest", "oldest", "price_asc", "price_desc", "rating", "popular", "title_asc"
]

# Browse/search is public and cheap-but-hammerable (every keystroke can
# trigger a query) — cap it well above normal human usage but low enough
# to blunt a scraping/DoS burst from a single IP.
@router.get("", response_model=SkillListResponse, status_code=status.HTTP_200_OK)
@limiter.limit("60/minute")
async def list_skills(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by title or description"),
    category: Optional[str] = Query(None, description="Filter by category"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum average rating"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price (inclusive)"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price (inclusive)"),
    sort: Optional[SortOption] = Query("newest", description="Sort order"),
    instructor_id: Optional[uuid.UUID] = Query(None, description="Filter to one instructor's skills"),
    db: AsyncSession = Depends(get_db),
) -> SkillListResponse:
    """Get a paginated, filterable, sortable list of available skills."""
    if min_price is not None and max_price is not None and min_price > max_price:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="min_price cannot be greater than max_price",
        )
    return await SkillService.get_all_skills(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        category=category,
        min_rating=min_rating,
        min_price=min_price,
        max_price=max_price,
        sort=sort,
        instructor_id=instructor_id,
    )

@router.get("/categories", response_model=List[str], status_code=status.HTTP_200_OK)
@limiter.limit("60/minute")
async def list_categories(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> List[str]:
    """Distinct category values, for populating the browse-page filter dropdown."""
    return await SkillService.get_categories(db)

@router.get("/{skill_id}", response_model=SkillResponse, status_code=status.HTTP_200_OK)
@limiter.limit("60/minute")
async def get_skill(
    request: Request,
    skill_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> SkillResponse:
    """Get detailed information about a specific skill."""
    return await SkillService.get_skill_by_id(db, skill_id)

@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(
    skill: SkillCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> SkillResponse:
    """Create a new skill offering."""
    return await SkillService.create_skill(db, skill, current_user)

@router.patch("/{skill_id}", response_model=SkillResponse, status_code=status.HTTP_200_OK)
async def update_skill(
    skill_id: uuid.UUID,
    skill: SkillUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> SkillResponse:
    """Update an existing skill (owner or admin only)."""
    return await SkillService.update_skill(db, skill_id, skill, current_user)

@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(
    skill_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Delete a skill."""
    await SkillService.delete_skill(db, skill_id, current_user)
