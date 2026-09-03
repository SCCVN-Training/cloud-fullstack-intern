import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.models import BookingStatus
from app.modules.reviews.models import Review
from app.modules.reviews.repository import ReviewRepository
from app.modules.reviews.schema import ReviewCreate, ReviewItem, ReviewSummary
from app.modules.skills.repository import SkillRepository
from app.core.dependencies import CurrentUser
from app.clients.identity_client import IdentityClient
from app.core.exceptions import (
    UserNotFoundException,
    ForbiddenException,
    BookingNotFoundException,
    ReviewAlreadyExistsException,
)
from fastapi import HTTPException, status

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

    # GET /skills/{skill_id}/reviews — reviews left on bookings for this
    # skill, most recent first. Mirrors get_reviews_for_user above; the
    # only real difference is the repository query joins through Booking
    # to scope by skill instead of filtering Review.reviewee_id directly.
    @staticmethod
    async def get_reviews_for_skill(
        db: AsyncSession,
        skill_id: uuid.UUID,
        limit: int | None = DEFAULT_REVIEW_LIMIT,
        offset: int = 0,
    ) -> ReviewSummary:
        skill = await SkillRepository.get_by_id(db, skill_id)
        if skill is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

        total = await ReviewRepository.count_by_skill_id(db, skill_id)
        reviews = await ReviewRepository.get_by_skill_id(db, skill_id, limit, offset)

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

        # Roll the new review into the skill's displayed rating right
        # away, in the same request, so it's never stale by the time this
        # response comes back — not wrapped in the same DB transaction as
        # the review insert above (this codebase's repositories each
        # commit their own unit of work; see charge_for_booking/
        # credit_for_booking for the same "visibility over a shared
        # transaction" trade-off), but functionally in sync before this
        # request returns.
        skill = await SkillRepository.get_by_id(db, booking.skill_id)
        if skill is not None:
            avg_rating, review_count = await ReviewRepository.get_average_rating_for_skill(
                db, booking.skill_id
            )
            skill.rating = round(avg_rating, 2)
            skill.review_count = review_count
            await SkillRepository.update(db, skill)

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
