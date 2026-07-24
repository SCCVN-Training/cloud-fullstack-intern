from fastapi import APIRouter, Depends, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import (
    get_mongodb_database,
    get_neon_db_session,
)

from app.shared.dependencies.verify_token import (
    extract_authenticated_user_payload,
)

from app.modules.profile.service import ProfileService

from app.modules.profile.schemas import UserProfileSchema, UserProfileChangeRequestModel, UserProfileCreateRequestModel

from app.shared.models.responses import ApiResponse

profile_router = APIRouter(
    prefix="/profile",
    tags=["User Profile Domain"],
)

@profile_router.post(
    "",
    response_model = ApiResponse[UserProfileSchema],
    status_code=status.HTTP_201_CREATED,
)
async def create_profile(
    credentials: UserProfileCreateRequestModel,
    payload: dict = Depends(extract_authenticated_user_payload),
    postgres: AsyncSession = Depends(get_neon_db_session),
):
    return await ProfileService.create_profile(
        credentials,
        payload,
        postgres
    )

@profile_router.get(
    "/me",
    response_model=ApiResponse[UserProfileSchema],
    status_code=status.HTTP_200_OK,
)
async def get_my_profile(
    payload: dict = Depends(extract_authenticated_user_payload),
    postgres: AsyncSession = Depends(get_neon_db_session),
):
    return await ProfileService.get_my_profile(
        payload,
        postgres
    )

@profile_router.patch(
    "/me",
    response_model=ApiResponse,
    status_code=status.HTTP_200_OK,
)
async def change_profile(
    credentials: UserProfileChangeRequestModel,
    payload: dict = Depends(extract_authenticated_user_payload),
    postgres: AsyncSession = Depends(get_neon_db_session),
):
    return await ProfileService.change_user_profile(
        credentials,
        payload,
        postgres
    )