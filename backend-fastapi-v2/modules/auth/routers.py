from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db, get_mongo_db
from modules.auth.dependencies import get_current_user
from shared.models import ApiResponse

from modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    UserDataResponse,
    UserResponse
)
from modules.auth.services import AuthService
from modules.auth.models import UserAccountModel
from modules.auth.rate_limit import AuthRateLimiter, get_auth_rate_limiter

# ============ Router Setup ============

auth_router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============ Dependencies ============

async def get_auth_service(
    postgres: AsyncSession = Depends(get_db),
    mongo: AsyncIOMotorDatabase = Depends(get_mongo_db),
) -> AuthService:
    """Get auth service instance with database sessions."""
    return AuthService(postgres, mongo)


# ============ Endpoints ============

@auth_router.post(
    "/register",
    response_model=ApiResponse[UserDataResponse],
    status_code=status.HTTP_201_CREATED,
)
async def register(
    request: Request,
    payload: RegisterRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service),
    rate_limiter: AuthRateLimiter = Depends(get_auth_rate_limiter),
):
    """
    Register a new user.

    ⚠️ This only creates a user account, NOT a profile.
    ✅ Frontend should call POST /api/v1/profile to create profile.

    Sets authentication cookies (auto-login).
    """
    allowed, remaining, retry_after = await rate_limiter.check_register(request)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    return await service.register(
        request=payload,
        response=response,
    )


@auth_router.post(
    "/login",
    response_model=ApiResponse[UserDataResponse],
    status_code=status.HTTP_200_OK,
)
async def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service),
    rate_limiter: AuthRateLimiter = Depends(get_auth_rate_limiter)
):
    """
    Login user.

    Validates credentials and sets authentication cookies.
    """

    allowed, remaining, retry_after = await rate_limiter.check_login(request)

    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    return await service.login(
        request=payload,
        response=response,
    )


@auth_router.post(
    "/refresh-session",  # ← Renamed from "restore-session"
    response_model=ApiResponse,
    status_code=status.HTTP_200_OK,
)
async def refresh_session(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
    rate_limiter: AuthRateLimiter = Depends(get_auth_rate_limiter)
):
    """
    Refresh session using refresh token cookie.

    Called when access token expires.
    Sets new access_token cookie.
    """
    allowed, remaining, retry_after = await rate_limiter.check_refresh(request)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many refresh attempts. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    return await service.refresh_session(
        request=request,
        response=response,
    )


@auth_router.post(
    "/logout",
    response_model=ApiResponse,
    status_code=status.HTTP_200_OK,
)
async def logout(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
):
    """
    Logout user.

    Clears authentication cookies.
    """
    return await service.logout(request=request, response=response)


@auth_router.get(
    "/me",
    response_model=ApiResponse[UserDataResponse],
    status_code=status.HTTP_200_OK,
)
async def get_me(
    request: Request,
    current_user: UserAccountModel = Depends(get_current_user),
    rate_limiter: AuthRateLimiter = Depends(get_auth_rate_limiter)
):
    """
    Get current authenticated user.

    Returns user data from access token cookie.
    """
    allowed, remaining, retry_after = await rate_limiter.check_me(request)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    return {
        "message": "Current user retrieved successfully.",
        "data": {
            "user": UserResponse.model_validate(current_user).model_dump(by_alias=True),
        }
    }
