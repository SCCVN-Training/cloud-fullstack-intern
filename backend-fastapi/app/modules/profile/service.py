from datetime import timedelta

from fastapi import HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import app_settings
from app.core.security import (
    decode_json_web_token,
    generate_json_web_token,
    hash_raw_password,
    verify_password_hash,
)

from app.modules.profile.repository import ProfileRepository
from app.modules.profile.schemas import (
    UserProfileChangeRequestModel,
    UserProfileCreateRequestModel
)


class ProfileService:
    """Business logic for the authentication module."""

    @staticmethod
    async def create_user_profile(
        credentials: UserProfileCreateRequestModel,
        postgres: AsyncSession
    ):
        new_profile = await ProfileRepository.create_profile(
            credentials,
            postgres
        )
        
        await postgres.commit()
        
        return new_profile

    @staticmethod
    async def get_my_profile(
        payload: dict,
        postgres: AsyncSession
    ):
        
        profile = await ProfileRepository.get_my_profile(
            postgres,
            payload
        )

        return {
            "message": "Profile retrieved successfully.",
            "data": profile
        }

    @staticmethod
    async def change_user_profile(
        credentials: UserProfileChangeRequestModel,
        payload: dict,
        postgres: AsyncSession
    ):
        user_id = payload["sub"]
        changes = credentials.model_dump(exclude_none = True)

        updated = await ProfileRepository.patch_profile_by_id(
            postgres,
            user_id,
            changes,
        )

        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )

        await postgres.commit()

        return {
            "message": "Profile updated successfully."
        }