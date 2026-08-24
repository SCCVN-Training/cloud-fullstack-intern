from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from modules.profile.dependencies import get_current_user_id
from shared.models import ApiResponse

from modules.profile.services import ProfileService
from modules.profile.schemas import (
    CreateProfileRequest,
    UpdateProfileRequest,
    ProfileDataResponse,
)
from uuid import UUID

from modules.profile.rate_limit import ProfileRateLimiter, get_profile_rate_limiter


# ============ Router Setup ============

profile_router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


# ============ Dependencies ============

async def get_profile_service(
    db: AsyncSession = Depends(get_db),
) -> ProfileService:
    """Get profile service instance with database session."""
    return ProfileService(db)


# ============ Endpoints ============

@profile_router.post(
    "",
    response_model=ApiResponse[ProfileDataResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_profile(
    payload: CreateProfileRequest,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProfileService = Depends(get_profile_service),
    # rate_limiter: ProfileRateLimiter = Depends(get_profile_rate_limiter)

):
    """
    Create a user profile.

    ✅ Reads access_token from HttpOnly cookie
    ✅ User must be authenticated via cookie
    """
    # Security check: User can only create their own profile
    if payload.user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create your own profile.",
        )

    # allowed, remaining, retry_after = await rate_limiter.check_create_profile(
    #     user_id=str(current_user_id)
    # )

    # if not allowed:
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Too many profile creation attempts. Please try again later.",
    #         headers={"Retry-After": str(retry_after)},
    #     )


    profile = await service.create_profile(payload)

    return {
        "message": "Profile created successfully.",
        "data": {
            "profile": profile
        },
    }


@profile_router.get(
    "/me",
    response_model=ApiResponse[ProfileDataResponse],
    status_code=status.HTTP_200_OK,
)
async def get_my_profile(
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProfileService = Depends(get_profile_service),
    # rate_limiter: ProfileRateLimiter = Depends(get_profile_rate_limiter)
):
    """
    Get current user's profile.

    ✅ Reads access_token from HttpOnly cookie
    ✅ User must be authenticated via cookie
    """
    # allowed, remaining, retry_after = await rate_limiter.check_get_profile(
    #     user_id=str(current_user_id)
    # )
    # if not allowed:
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Too many profile retrieval attempts. Please try again later.",
    #         headers={"Retry-After": str(retry_after)},
    #     )

    profile = await service.get_profile_by_user_id(current_user_id)

    return {
        "message": "Profile retrieved successfully.",
        "data": {
            "profile": profile
        }
    }

@profile_router.patch(
    "/me",
    response_model=ApiResponse[ProfileDataResponse],
    status_code=status.HTTP_200_OK,
)
async def update_my_profile(
    payload: UpdateProfileRequest,
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProfileService = Depends(get_profile_service),
    # rate_limiter: ProfileRateLimiter = Depends(get_profile_rate_limiter)
):
    """
    Update current user's profile.

    ✅ Reads access_token from HttpOnly cookie
    ✅ User must be authenticated via cookie
    """
    # allowed, remaining, retry_after = await rate_limiter.check_update_profile(
    #     user_id=str(current_user_id)
    # )

    # if not allowed:
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Too many profile update attempts. Please try again later.",
    #         headers={"Retry-After": str(retry_after)},
    #     )

    profile = await service.update_profile(
        payload=payload,
        user_id=current_user_id,
    )

    return {
        "message": "Profile updated successfully.",
        "data": {
            "profile": profile
        }
    }


@profile_router.delete(
    "/me",
    response_model=ApiResponse,
    status_code=status.HTTP_200_OK,
)
async def delete_my_profile(
    current_user_id: UUID = Depends(get_current_user_id),
    service: ProfileService = Depends(get_profile_service),
    # rate_limiter: ProfileRateLimiter = Depends(get_profile_rate_limiter)
):
    """
    Delete current user's profile.

    ✅ Reads access_token from HttpOnly cookie
    ✅ User must be authenticated via cookie
    """
    # allowed, remaining, retry_after = await rate_limiter.check_delete_profile(
    #     user_id=str(current_user_id)
    # )

    # if not allowed:
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Too many profile deletion attempts. Please try again later.",
    #         headers={"Retry-After": str(retry_after)},
    #     )

    result = await service.delete_profile(current_user_id)

    return {
        "message": result["message"],
    }
