import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.reviews.service import ReviewService
from app.modules.reviews.schema import ReviewCreate, ReviewItem, ReviewSummary

# Read: reviews received by a user, shown on their profile
user_reviews_router = APIRouter(prefix="/users/{reviewee_id}/reviews", tags=["Reviews"])

# Write: leaving a review is scoped to a specific completed booking, not
# an open "review anyone's profile" action — see ReviewService for the
# authorization rules this enforces.
booking_reviews_router = APIRouter(prefix="/bookings/{booking_id}/reviews", tags=["Reviews"])

# GET REVIEWS FOR A USER (public to any authenticated user)
@user_reviews_router.get("", response_model=ReviewSummary, status_code=status.HTTP_200_OK)
async def get_reviews(
    reviewee_id: uuid.UUID,
    limit: int | None = Query(default=10, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ReviewService.get_reviews_for_user(db, reviewee_id, limit, offset)


# CREATE A REVIEW (only the learner on a completed booking, once)
@booking_reviews_router.post("", response_model=ReviewItem, status_code=status.HTTP_201_CREATED)
async def create_review(
    booking_id: uuid.UUID,
    review_data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ReviewService.create_review(db, booking_id, review_data, current_user)
