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

from app.modules.auth.schemas import (
    UserRegistrationRequestSchema,
    UserLoginRequestSchema,
    UserDataSchema,
)

from app.shared.models.responses import ApiResponse

from app.modules.auth.service import AuthService

auth_router = APIRouter(
    prefix="/auth",
    tags=["Authentication Domain"],
)


@auth_router.post(
    "/register",
    response_model=ApiResponse[UserDataSchema],
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: UserRegistrationRequestSchema,
    postgres: AsyncSession = Depends(get_neon_db_session),
    mongo: AsyncIOMotorDatabase = Depends(get_mongodb_database),
):
    return await AuthService.register(
        payload,
        postgres,
        mongo,
    )


@auth_router.post(
    "/login",
    response_model=ApiResponse[UserDataSchema],
    status_code=status.HTTP_200_OK,
)
async def login(
    payload: UserLoginRequestSchema,
    response: Response,
    postgres: AsyncSession = Depends(get_neon_db_session),
):
    return await AuthService.login(
        payload,
        response,
        postgres,
    )


@auth_router.post(
    "/restore-session",
    response_model=ApiResponse,
    status_code=status.HTTP_200_OK,
)
async def restore_session(
    request: Request,
    response: Response,
):
    return await AuthService.restore_session(
        request,
        response,
    )


@auth_router.post(
    "/logout",
    response_model=ApiResponse,
    status_code=status.HTTP_200_OK,
)
async def logout(
    response: Response,
):
    return await AuthService.logout(response)


@auth_router.get(
    "/me",
    response_model=ApiResponse[UserDataSchema],
    status_code=status.HTTP_200_OK,
)
async def me(
    payload: dict = Depends(extract_authenticated_user_payload),
    postgres: AsyncSession = Depends(get_neon_db_session),
):
    return await AuthService.get_current_user(
        payload,
        postgres
    )