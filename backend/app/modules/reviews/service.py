import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.reviews.models import Review
from app.modules.reviews.repository import ReviewRepository
from app.modules.reviews.schema import ReviewCreate, ReviewItem, ReviewSummary
from app.core.exceptions import UserNotFoundException, ForbiddenException

# Reviews shown inline on a profile are capped by default — a full,
# paginated list is available via limit/offset for a dedicated
# "all reviews" view later.
DEFAULT_REVIEW_LIMIT = 10


class ReviewService:
    # GET /users/{reviewee_id}/reviews
    @staticmethod
    async def get_reviews_for_user(
        db: AsyncSession,
        reviewee_id: uuid.UUID,
        limit: int | None = DEFAULT_REVIEW_LIMIT,
        offset: int = 0,
    ) -> ReviewSummary:
        reviewee = await UserRepository.get_by_id(db, reviewee_id)
        if reviewee is None:
            raise UserNotFoundException("User not found")

        total = await ReviewRepository.count_for_reviewee(db, reviewee_id)
        rows = await ReviewRepository.list_for_reviewee(db, reviewee_id, limit, offset)

        items = [
            ReviewItem(
                id=review.id,
                reviewer_id=review.reviewer_id,
                reviewer_name=reviewer_name,
                reviewer_avatar_url=reviewer_avatar_url,
                rating=review.rating,
                comment=review.comment,
                created_at=review.created_at,
            )
            for review, reviewer_name, reviewer_avatar_url in rows
        ]

        return ReviewSummary(total=total, items=items)

    # POST /users/{reviewee_id}/reviews — any authenticated user may leave
    # a review, except on their own profile.
    @staticmethod
    async def create_review(
        db: AsyncSession,
        reviewee_id: uuid.UUID,
        review_data: ReviewCreate,
        current_user: User,
    ) -> ReviewItem:
        if current_user.id == reviewee_id:
            raise ForbiddenException("You cannot review yourself")

        reviewee = await UserRepository.get_by_id(db, reviewee_id)
        if reviewee is None:
            raise UserNotFoundException("User not found")

        review = Review(
            reviewer_id=current_user.id,
            reviewee_id=reviewee_id,
            rating=review_data.rating,
            comment=review_data.comment,
        )
        review = await ReviewRepository.create(db, review)

        return ReviewItem(
            id=review.id,
            reviewer_id=review.reviewer_id,
            reviewer_name=current_user.user_name,
            reviewer_avatar_url=None,
            rating=review.rating,
            comment=review.comment,
            created_at=review.created_at,
        )
