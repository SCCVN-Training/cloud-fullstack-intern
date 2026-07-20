from datetime import datetime, timezone
import email

from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import UserAccountModel


class AuthRepository:
    """Handles all database operations for the authentication module."""

    @staticmethod
    async def get_user_by_email(
        postgres: AsyncSession,
        email: str,
    ) -> UserAccountModel | None:
        result = await postgres.execute(
            select(UserAccountModel).where(
                UserAccountModel.email == email
            )
        )

        return result.scalars().first()
    
    @staticmethod
    async def get_user_by_username(
        postgres: AsyncSession,
        username: str,
    ) -> UserAccountModel | None:
        result = await postgres.execute(
            select(UserAccountModel).where(
                UserAccountModel.username == username
            )
        )

        return result.scalars().first()

    @staticmethod
    async def create_user(
        postgres: AsyncSession,
        user: UserAccountModel,
    ) -> UserAccountModel:
        postgres.add(user)

        await postgres.commit()
        await postgres.refresh(user)

        return user

    @staticmethod
    async def create_registration_audit_log(
        mongo: AsyncIOMotorDatabase,
        user_id: str,
        username: str,
        email: str,
    ) -> None:
        await mongo["auth_audit_logs"].insert_one(
            {
                "event_type": "USER_REGISTERED",
                "associated_user_id": user_id,
                "email": email,
                "username": username,
                "timestamp_utc": datetime.now(timezone.utc),
            }
        )