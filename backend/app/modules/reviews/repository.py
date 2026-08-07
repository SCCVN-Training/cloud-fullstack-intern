import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.reviews.models import Review
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
    # and avatar joined in from their Profile. limit=None returns all.
    @staticmethod
    async def list_for_reviewee(
        db: AsyncSession,
        reviewee_id: uuid.UUID,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[tuple[Review, str | None, str | None]]:
        stmt = (
            select(Review, Profile.full_name, Profile.avatar_url)
            .join(Profile, Profile.user_id == Review.reviewer_id)
            .where(Review.reviewee_id == reviewee_id)
            .order_by(Review.created_at.desc())
            .offset(offset)
        )
        if limit is not None:
            stmt = stmt.limit(limit)

        result = await db.execute(stmt)
        return result.all()

    @staticmethod
    async def create(db: AsyncSession, review: Review) -> Review:
        db.add(review)
        await db.commit()
        await db.refresh(review)
        return review
