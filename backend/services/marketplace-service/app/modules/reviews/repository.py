import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.reviews.models import Review
from app.modules.bookings.models import Booking


class ReviewRepository:
    # Total review count for a user — kept as a separate cheap COUNT query
    # rather than len(list) so it stays correct even if items are paginated.
    @staticmethod
    async def count_for_reviewee(db: AsyncSession, reviewee_id: uuid.UUID) -> int:
        result = await db.execute(
            select(func.count(Review.id)).where(Review.reviewee_id == reviewee_id)
        )
        return result.scalar_one()

    # Reviews for a user, newest first. Previously this JOINed User and
    # Profile directly to pull in the reviewer's name/avatar in one
    # query — that's no longer possible (those tables live in
    # identity-service's schema now). This returns bare Review rows;
    # ReviewService decorates each with reviewer display data via
    # IdentityClient instead. limit=None returns all.
    @staticmethod
    async def list_for_reviewee(
        db: AsyncSession,
        reviewee_id: uuid.UUID,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[Review]:
        stmt = (
            select(Review)
            .where(Review.reviewee_id == reviewee_id)
            .order_by(Review.created_at.desc())
            .offset(offset)
        )
        if limit is not None:
            stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    # Enforces "one review per booking" at the application layer too
    # (the DB unique constraint on booking_id is the hard backstop).
    @staticmethod
    async def get_by_booking_id(db: AsyncSession, booking_id: uuid.UUID) -> Review | None:
        result = await db.execute(select(Review).where(Review.booking_id == booking_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, review: Review) -> Review:
        db.add(review)
        await db.commit()
        await db.refresh(review)
        return review

    # Reviews for a skill, newest first — a learner reviews the mentor on
    # a specific booking, and a booking is for a specific skill, so this
    # joins through Booking the same way get_average_rating_for_skill
    # does (keep both join conditions in sync if either changes).
    @staticmethod
    async def get_by_skill_id(
        db: AsyncSession,
        skill_id: uuid.UUID,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[Review]:
        stmt = (
            select(Review)
            .join(Booking, Review.booking_id == Booking.id)
            .where(Booking.skill_id == skill_id)
            .order_by(Review.created_at.desc())
            .offset(offset)
        )
        if limit is not None:
            stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def count_by_skill_id(db: AsyncSession, skill_id: uuid.UUID) -> int:
        result = await db.execute(
            select(func.count(Review.id))
            .select_from(Review)
            .join(Booking, Review.booking_id == Booking.id)
            .where(Booking.skill_id == skill_id)
        )
        return result.scalar_one()

    # Aggregates in SQL rather than pulling every review into Python —
    # joins through Booking since Review has no direct skill_id column
    # (a review is booking-scoped; the booking is what ties it to a
    # skill). Returns (0.0, 0) for a skill with no reviews yet.
    @staticmethod
    async def get_average_rating_for_skill(
        db: AsyncSession, skill_id: uuid.UUID
    ) -> tuple[float, int]:
        result = await db.execute(
            select(func.avg(Review.rating), func.count(Review.id))
            .select_from(Review)
            .join(Booking, Review.booking_id == Booking.id)
            .where(Booking.skill_id == skill_id)
        )
        avg_rating, count = result.one()
        return (float(avg_rating) if avg_rating is not None else 0.0, count or 0)
