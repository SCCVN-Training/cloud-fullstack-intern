from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db
from shared.dependencies import get_current_user
from shared.models import ApiResponse

from modules.profile.services import ProfileService
from modules.profile.schemas import (
    CreateProfileRequest,
    UpdateProfileRequest,
    ProfileDataResponse,
)
from modules.auth.models import UserAccountModel


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
    request: CreateProfileRequest,
    current_user: UserAccountModel = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
):
    """
    Create a user profile.

    ✅ Reads access_token from HttpOnly cookie
    ✅ User must be authenticated via cookie
    """
    # Security check: User can only create their own profile
    if request.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create your own profile.",
        )

    profile = await service.create_profile(request)

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
    current_user: UserAccountModel = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
):
    """
    Get current user's profile.

    ✅ Reads access_token from HttpOnly cookie
    ✅ User must be authenticated via cookie
    """
    profile = await service.get_profile_by_user_id(current_user.id)

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
    request: UpdateProfileRequest,
    current_user: UserAccountModel = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
):
    """
    Update current user's profile.

    ✅ Reads access_token from HttpOnly cookie
    ✅ User must be authenticated via cookie
    """
    profile = await service.update_profile(
        user_id=current_user.id,
        request=request,
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
    current_user: UserAccountModel = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
):
    """
    Delete current user's profile.

    ✅ Reads access_token from HttpOnly cookie
    ✅ User must be authenticated via cookie
    """
    result = await service.delete_profile(current_user.id)

    return {
        "message": result["message"],
    }
