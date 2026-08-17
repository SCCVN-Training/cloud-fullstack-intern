import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.models import BookingStatus
from app.modules.reviews.models import Review
from app.modules.reviews.repository import ReviewRepository
from app.modules.reviews.schema import ReviewCreate, ReviewItem, ReviewSummary
from app.core.exceptions import (
    UserNotFoundException,
    ForbiddenException,
    BookingNotFoundException,
    ReviewAlreadyExistsException,
)

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
                booking_id=review.booking_id,
                reviewer_id=review.reviewer_id,
                reviewer_name=reviewer_name,
                reviewer_avatar_url=reviewer_avatar_url,
                rating=review.rating,
                knowledge_rating=review.knowledge_rating,
                communication_rating=review.communication_rating,
                video_audio_rating=review.video_audio_rating,
                feedback=review.feedback,
                created_at=review.created_at,
            )
            for review, reviewer_name, reviewer_avatar_url in rows
        ]

        return ReviewSummary(total=total, items=items)

    # POST /bookings/{booking_id}/reviews — only the learner on that
    # booking may review it, only once the session is COMPLETED, and only
    # once per booking (the learner reviews the mentor; matches the ERD's
    # zero-or-one BOOKINGS--REVIEWS cardinality).
    @staticmethod
    async def create_review(
        db: AsyncSession,
        booking_id: uuid.UUID,
        review_data: ReviewCreate,
        current_user: User,
    ) -> ReviewItem:
        booking = await BookingRepository.get_by_id(db, booking_id)
        if booking is None:
            raise BookingNotFoundException("Booking not found")

        if booking.learner_id != current_user.id:
            raise ForbiddenException("Only the learner on this booking can leave a review")

        if booking.status != BookingStatus.COMPLETED:
            raise ForbiddenException("You can only review a completed booking")

        existing = await ReviewRepository.get_by_booking_id(db, booking_id)
        if existing is not None:
            raise ReviewAlreadyExistsException("This booking has already been reviewed")

        review = Review(
            booking_id=booking_id,
            reviewer_id=current_user.id,
            reviewee_id=booking.mentor_id,
            rating=review_data.rating,
            knowledge_rating=review_data.knowledge_rating,
            communication_rating=review_data.communication_rating,
            video_audio_rating=review_data.video_audio_rating,
            feedback=review_data.feedback,
        )
        review = await ReviewRepository.create(db, review)

        return ReviewItem(
            id=review.id,
            booking_id=review.booking_id,
            reviewer_id=review.reviewer_id,
            reviewer_name=current_user.user_name,
            reviewer_avatar_url=None,
            rating=review.rating,
            knowledge_rating=review.knowledge_rating,
            communication_rating=review.communication_rating,
            video_audio_rating=review.video_audio_rating,
            feedback=review.feedback,
            created_at=review.created_at,
        )
