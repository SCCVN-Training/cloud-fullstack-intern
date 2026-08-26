from fastapi import APIRouter, Depends, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from shared.database import get_db, get_mongo_db
from shared.docs import get_error_responses
from shared.models import ApiResponse
from sqlalchemy.ext.asyncio import AsyncSession

from modules.auth.dependencies import get_current_user
from modules.auth.models import UserAccountModel
from modules.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    UserDataResponse,
    UserResponse,
)
from modules.auth.services import AuthService

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
    response_model=ApiResponse[UserResponse],
    status_code=status.HTTP_201_CREATED,
    responses=get_error_responses(400),
)
async def register(
    request: Request,
    payload: RegisterRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service),
    # rate_limiter: AuthRateLimiter = Depends(get_auth_rate_limiter),
):
    """
    Register a new user.

    ⚠️ This only creates a user account, NOT a profile.
    ✅ Frontend should call POST /api/v1/profile to create profile.

    Sets authentication cookies (auto-login).
    """
    # allowed, remaining, retry_after = await rate_limiter.check_register(request)
    # if not allowed:
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Too many registration attempts. Please try again later.",
    #         headers={"Retry-After": str(retry_after)},
    #     )

    user = await service.register(
        request=payload,
        response=response,
    )

    return ApiResponse(
        message="New user registered successful!",
        data=UserResponse.model_validate(user).model_dump(by_alias=True),
    )


@auth_router.post(
    "/login",
    response_model=ApiResponse[UserResponse],
    status_code=status.HTTP_200_OK,
    responses=get_error_responses(401, 403),
)
async def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service),
    # rate_limiter: AuthRateLimiter = Depends(get_auth_rate_limiter)
):
    """
    Login user.

    Validates credentials and sets authentication cookies.
    """

    # allowed, remaining, retry_after = await rate_limiter.check_login(request)

    # if not allowed:
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Too many login attempts. Please try again later.",
    #         headers={"Retry-After": str(retry_after)},
    #     )
    user = await service.login(
        request=payload,
        response=response,
    )

    return ApiResponse(
        message="User logged in successful!",
        data=UserResponse.model_validate(user).model_dump(by_alias=True),
    )


@auth_router.post(
    "/refresh-session",  # ← Renamed from "restore-session"
    response_model=ApiResponse,
    status_code=status.HTTP_200_OK,
    responses=get_error_responses(401),
)
async def refresh_session(
    request: Request,
    response: Response,
    service: AuthService = Depends(get_auth_service),
    # rate_limiter: AuthRateLimiter = Depends(get_auth_rate_limiter)
):
    """
    Refresh session using refresh token cookie.

    Called when access token expires.
    Sets new access_token cookie.
    """
    # allowed, remaining, retry_after = await rate_limiter.check_refresh(request)
    # if not allowed:
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Too many refresh attempts. Please try again later.",
    #         headers={"Retry-After": str(retry_after)},
    #     )
    await service.refresh_session(
        request=request,
        response=response,
    )

    return ApiResponse(message="Session refreshed!")


@auth_router.post(
    "/logout",
    response_model=ApiResponse,
    status_code=status.HTTP_200_OK,
    responses=get_error_responses(401),
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
    await service.logout(request=request, response=response)
    return ApiResponse(message="User logged out!")


@auth_router.get(
    "/me",
    response_model=ApiResponse[UserDataResponse],
    status_code=status.HTTP_200_OK,
    responses=get_error_responses(401),
)
async def get_me(
    request: Request,
    current_user: UserAccountModel = Depends(get_current_user),
    # rate_limiter: AuthRateLimiter = Depends(get_auth_rate_limiter)
):
    """
    Get current authenticated user.

    Returns user data from access token cookie.
    """
    # allowed, remaining, retry_after = await rate_limiter.check_me(request)
    # if not allowed:
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Too many requests. Please try again later.",
    #         headers={"Retry-After": str(retry_after)},
    #     )
    return {
        "message": "Current user retrieved successfully.",
        "data": {
            "user": UserResponse.model_validate(current_user).model_dump(by_alias=True),
        },
    }


@auth_router.get("/verify", include_in_schema=False)
async def verify_token(current_user: UserAccountModel = Depends(get_current_user)):
    """
    Internal API for API Gateway
    Return Header With UserId
    """
    return Response(status_code=200, headers={"X-User-Id": str(current_user.id)})
