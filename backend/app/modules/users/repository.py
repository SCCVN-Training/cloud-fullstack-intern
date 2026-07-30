from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User

# Repository is responsible for all database operations related to the User model
class UserRepository:
    # Find a user using an email
    @staticmethod
    async def get_by_email(
        db: AsyncSession,
        email: str
    ) -> User | None:
        result = await db.execute(
            select(User).where(
                User.email == email
            )
        )
        return result.scalar_one_or_none()

    # Find a user using an ID
    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        user_id
    ) -> User | None:
        result = await db.execute(
            select(User).where(
                User.id == user_id
            )
        )
        return result.scalar_one_or_none()

    # Insert a new user
    @staticmethod
    async def create(
        db: AsyncSession,
        user: User
    ) -> User:
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    # Delete a user