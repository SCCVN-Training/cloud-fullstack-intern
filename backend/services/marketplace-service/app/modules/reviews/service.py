import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.models import BookingStatus
from app.modules.reviews.models import Review
from app.modules.reviews.repository import ReviewRepository
from app.modules.reviews.schema import ReviewCreate, ReviewItem, ReviewSummary
from app.core.dependencies import CurrentUser
from app.clients.identity_client import IdentityClient
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
        # Real existence check against identity-service (see
        # IdentityClient.user_exists's docstring for why this is a
        # separate call from the display-data fetch below).
        if not await IdentityClient.user_exists(reviewee_id):
            raise UserNotFoundException("User not found")

        total = await ReviewRepository.count_for_reviewee(db, reviewee_id)
        reviews = await ReviewRepository.list_for_reviewee(db, reviewee_id, limit, offset)

        # Previously this came from a single SQL JOIN against User/Profile
        # (see repository.py's old list_for_reviewee). That join is no
        # longer possible across services, so each reviewer's display
        # data is now a separate cross-service call. Same N-calls-per-page
        # trade-off as SkillService — fine at this scale, worth batching
        # in a real system.
        items = []
        for review in reviews:
            reviewer = await IdentityClient.get_public_profile(review.reviewer_id)
            items.append(
                ReviewItem(
                    id=review.id,
                    booking_id=review.booking_id,
                    reviewer_id=review.reviewer_id,
                    reviewer_name=reviewer["user_name"],
                    reviewer_avatar_url=reviewer["avatar_url"],
                    rating=review.rating,
                    knowledge_rating=review.knowledge_rating,
                    communication_rating=review.communication_rating,
                    video_audio_rating=review.video_audio_rating,
                    feedback=review.feedback,
                    created_at=review.created_at,
                )
            )

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
        current_user: CurrentUser,
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

        # current_user (from the JWT) has no user_name — that lives in
        # identity-service, not the token claims — so fetch it for the
        # response the same way any other reviewer would be displayed.
        reviewer = await IdentityClient.get_public_profile(current_user.id)

        return ReviewItem(
            id=review.id,
            booking_id=review.booking_id,
            reviewer_id=review.reviewer_id,
            reviewer_name=reviewer["user_name"],
            reviewer_avatar_url=reviewer["avatar_url"],
            rating=review.rating,
            knowledge_rating=review.knowledge_rating,
            communication_rating=review.communication_rating,
            video_audio_rating=review.video_audio_rating,
            feedback=review.feedback,
            created_at=review.created_at,
        )
