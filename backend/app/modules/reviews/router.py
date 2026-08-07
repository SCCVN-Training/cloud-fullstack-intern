import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.reviews.service import ReviewService
from app.modules.reviews.schema import ReviewCreate, ReviewItem, ReviewSummary

router = APIRouter(prefix="/users/{reviewee_id}/reviews", tags=["Reviews"])


# GET REVIEWS FOR A USER (public to any authenticated user)
@router.get("", response_model=ReviewSummary, status_code=status.HTTP_200_OK)
async def get_reviews(
    reviewee_id: uuid.UUID,
    limit: int | None = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ReviewService.get_reviews_for_user(db, reviewee_id, limit, offset)


# CREATE A REVIEW (any authenticated user, except reviewing themselves)
@router.post("", response_model=ReviewItem, status_code=status.HTTP_201_CREATED)
async def create_review(
    reviewee_id: uuid.UUID,
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ReviewService.create_review(db, reviewee_id, review_data, current_user)
