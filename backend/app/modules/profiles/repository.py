import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.profiles.models import Profile


# Repository is responsible for all database operations related to the Profile model
class ProfileRepository:
    # Find a profile by its owning user's ID
    @staticmethod
    async def get_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> Profile | None:
        result = await db.execute(
            select(Profile).where(Profile.user_id == user_id)
        )
        return result.scalar_one_or_none()

    # CREATE — called once, right after a user registers
    @staticmethod
    async def create(db: AsyncSession, profile: Profile) -> Profile:
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile

    # UPDATE
    @staticmethod
    async def update(db: AsyncSession, profile: Profile, updates: dict) -> Profile:
        for field, value in updates.items():
            setattr(profile, field, value)

        await db.commit()
        await db.refresh(profile)
        return profile
