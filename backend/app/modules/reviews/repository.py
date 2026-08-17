import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.reviews.models import Review
from app.modules.users.models import User
from app.modules.profiles.models import Profile


class ReviewRepository:
    # Total review count for a user — kept as a separate cheap COUNT query
    # rather than len(list) so it stays correct even if items are paginated.
    @staticmethod
    async def count_for_reviewee(db: AsyncSession, reviewee_id: uuid.UUID) -> int:
        result = await db.execute(
            select(func.count(Review.id)).where(Review.reviewee_id == reviewee_id)
        )
        return result.scalar_one()

    # Reviews for a user, newest first, with the reviewer's display name
    # (from User.user_name) and avatar (from their Profile) joined in.
    # limit=None returns all.
    @staticmethod
    async def list_for_reviewee(
        db: AsyncSession,
        reviewee_id: uuid.UUID,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[tuple[Review, str | None, str | None]]:
        stmt = (
            select(Review, User.user_name, Profile.avatar_url)
            .join(User, User.id == Review.reviewer_id)
            .outerjoin(Profile, Profile.user_id == Review.reviewer_id)
            .where(Review.reviewee_id == reviewee_id)
            .order_by(Review.created_at.desc())
            .offset(offset)
        )
        if limit is not None:
            stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        return result.all()

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
