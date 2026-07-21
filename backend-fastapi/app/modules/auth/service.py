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

from app.modules.auth.models import UserAccountModel
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import (
    UserLoginRequestSchema,
    UserRegistrationRequestSchema,
)


class AuthService:
    """Business logic for the authentication module."""

    @staticmethod
    def set_authentication_cookies(
        response: Response,
        user_id: str,
        email: str,
    ) -> None:
        access_payload = {
            "sub": user_id,
            "email": email,
            "type": "access",
        }

        refresh_payload = {
            "sub": user_id,
            "email": email,
            "type": "refresh",
        }

        access_token = generate_json_web_token(
            access_payload,
            timedelta(minutes=app_settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        )

        refresh_token = generate_json_web_token(
            refresh_payload,
            timedelta(days=app_settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )

        secure = app_settings.ENVIRONMENT == "production"

        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=secure,
            samesite="lax",
            max_age=app_settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=secure,
            samesite="lax",
            path="/auth/restore-session",
            max_age=app_settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        )

    @staticmethod
    async def register(
        registration: UserRegistrationRequestSchema,
        postgres: AsyncSession,
        mongo: AsyncIOMotorDatabase,
    ) -> UserAccountModel:
        
        existing_user_by_username = await AuthRepository.get_user_by_username(
            postgres,
            username=registration.username,
        )

        if existing_user_by_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this username already exists.",
            )

        existing_user_by_email = await AuthRepository.get_user_by_email(
            postgres,
            email=registration.email,
        )

        if existing_user_by_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists.",
            )

        new_user = UserAccountModel(
            email=registration.email,
            username=registration.username,
            hashed_password=hash_raw_password(registration.password),
        )

        new_user = await AuthRepository.create_user(
            postgres,
            new_user,
        )

        await AuthRepository.create_registration_audit_log(
            mongo,
            str(new_user.id),
            new_user.username,
            new_user.email,
        )

        return {
            "message": "User registration successful.",
            "data": {
                "user": {
                    "id": str(new_user.id),
                    "username": new_user.username,
                    "email": new_user.email,
                    "isActive": new_user.is_active_account,
                    "avatarUrl": new_user.avatar_url,
                    "createdAt": new_user.created_at_utc.isoformat(),
                }
            }
        }

    @staticmethod
    async def login(
        credentials: UserLoginRequestSchema,
        response: Response,
        postgres: AsyncSession,
    ):

        user = await AuthRepository.get_user_by_email(
            postgres,
            credentials.email,
        )

        if not user or not verify_password_hash(
            credentials.password,
            user.hashed_password,
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        AuthService.set_authentication_cookies(
            response=response,
            user_id=str(user.id),
            email=user.email,
        )

        return {
            "message": "User login successful.",
            "data": {
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "isActive": user.is_active_account,
                    "avatarUrl": user.avatar_url,
                    "createdAt": user.created_at_utc.isoformat(),
                },
            }
        }

    @staticmethod
    async def restore_session(
        request: Request,
        response: Response,
    ):

        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token cookie missing.",
            )

        payload = decode_json_web_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        AuthService.set_authentication_cookies(
            response=response,
            user_id=payload["sub"],
            email=payload["email"],
        )

        return {
            "message": "Session refreshed successfully.",
        }

    @staticmethod
    async def logout(
        response: Response,
    ):

        response.delete_cookie("access_token")
        response.delete_cookie(
            "refresh_token",
            path="/auth/restore-session",
        )

        return {
            "message": "User logout successful.",
        }

    @staticmethod
    async def get_current_user(
        payload: dict,
        postgres: AsyncSession,
    ):
        user = await AuthRepository.get_user_by_email(
            postgres,
            email=payload["email"],
        )

        return {
            "message": "Current user retrieved successfully.",
            "data": {
                "user": {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "isActive": user.is_active_account,
                    "avatarUrl": user.avatar_url,
                    "createdAt": user.created_at_utc.isoformat(),
                }
            }
        }