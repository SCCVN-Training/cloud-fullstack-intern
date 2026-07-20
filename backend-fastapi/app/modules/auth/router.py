from fastapi import APIRouter, Depends, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import (
    get_mongodb_database,
    get_neon_db_session,
)

from app.modules.auth.dependencies import (
    extract_authenticated_user_payload,
)

from app.modules.auth.schemas import (
    UserRegistrationRequestSchema,
    UserLoginRequestSchema,
    UserAccountResponseSchema,
)

from app.modules.auth.service import AuthService

auth_router = APIRouter(
    prefix="/auth",
    tags=["Authentication Domain"],
)


@auth_router.post(
    "/register",
    response_model=UserAccountResponseSchema,
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


@auth_router.post("/login")
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


@auth_router.post("/restore-session")
async def restore_session(
    request: Request,
    response: Response,
):
    return await AuthService.restore_session(
        request,
        response,
    )


@auth_router.post("/logout")
async def logout(
    response: Response,
):
    return await AuthService.logout(response)


@auth_router.get("/me")
async def me(
    payload: dict = Depends(extract_authenticated_user_payload),
    postgres: AsyncSession = Depends(get_neon_db_session),
):
    return await AuthService.get_current_user(
        payload,
        postgres
    )