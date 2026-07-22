from datetime import datetime, timezone
import email
from typing import Any, Dict

from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.profile.models import UserProfileModel
from app.modules.profile.schemas import UserProfileCreateRequestModel


class ProfileRepository:
    """Handles all database operations for the user profile module."""

    @staticmethod
    async def get_my_profile(
        postgres: AsyncSession,
        payload: dict,
    ) -> UserProfileModel:
        result = await postgres.execute(
            select(UserProfileModel).where(
                UserProfileModel.user_id == payload["sub"]
            )
        )

        return result.scalars().first()

    @staticmethod
    async def create_profile(
        credentials: UserProfileCreateRequestModel,
        postgres: AsyncSession,
    ) -> UserProfileModel:
        profile = UserProfileModel(
            user_id=credentials.user_id,
            display_name=credentials.display_name,
            created_at_utc=datetime.now(timezone.utc),
            updated_at_utc=datetime.now(timezone.utc)
        )
        postgres.add(profile)
        await postgres.commit()
        await postgres.refresh(profile)
        return profile

    @staticmethod
    async def patch_profile_by_id(
        postgres: AsyncSession,
        user_id: str,
        changes: Dict[str, Any]
    ) -> bool:
        if not changes:
            return False
        
        result = await postgres.execute(
            update(UserProfileModel)
            .where(UserProfileModel.id == user_id)
            .values(**changes)
        )

        return result.rowcount > 0