from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User

# Repository is responsible for all database operations related to the User model
class UserRepository:
    # Find a user by email
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

    # Find a user by ID (UUID)
    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        user_id: uuid.UUID
    ) -> User | None:
        result = await db.execute(
            select(User).where(
                User.id == user_id
            )
        )
        return result.scalar_one_or_none()

    # CREATE
    @staticmethod
    async def create(
        db: AsyncSession,
        user: User
    ) -> User:
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    # List all users with pagination
    @staticmethod
    async def get_all(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20
    ) -> tuple[list[User], int]:
        count_result = await db.execute(
            select(func.count()).select_from(User)
        )
        total = count_result.scalar_one()

        result = await db.execute(
            select(User).offset(skip).limit(limit)
        )
        users = list(result.scalars().all())
        return users, total

    # UPDATE
    @staticmethod
    async def update(
        db: AsyncSession,
        user: User,
        updates: dict
    ) -> User:
        for field, value in updates.items():
            setattr(user, field, value)
        
        await db.commit()
        await db.refresh(user)
        return user

    # DELETE
    @staticmethod
    async def delete(
        db: AsyncSession,
        user: User
    ) -> None:
        await db.delete(user)
        await db.commit()

