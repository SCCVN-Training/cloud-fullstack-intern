import secrets

import asyncpg
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Response, status
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_token, decode_token
from app.modules.auth.repository import AuthRepository
from app.modules.auth import schemas, queries


class AuthService:

    @staticmethod
    def _set_token_cookies(response: Response, user_id: str) -> None:
        """Helper to create and attach HttpOnly access and refresh cookies."""
        access_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE)
        refresh_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE)

        access_token = create_token({"sub": str(user_id), "type": "access"}, access_expires)
        refresh_token = create_token({"sub": str(user_id), "type": "refresh"}, refresh_expires)

        # Set Access Token Cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=int(access_expires.total_seconds()),
        )

        # Set Refresh Token Cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=int(refresh_expires.total_seconds()),
        )

    @staticmethod
    async def register_user(conn: asyncpg.Connection, data: schemas.UserRegisterRequest, response: Response) -> schemas.UserResponse:
        existing_user = await AuthRepository.get_by_email(conn, data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered.",
            )

        hashed_pwd = hash_password(data.password)
        new_user = await AuthRepository.create_user(
            conn,
            email=data.email,
            hashed_password=hashed_pwd,
            full_name=data.full_name,
        )

        AuthService._set_token_cookies(response, str(new_user["id"]))

        return schemas.UserResponse(**new_user)

    @staticmethod
    async def login_user(
        conn: asyncpg.Connection, credentials: schemas.UserLoginRequest, response: Response
    ) -> schemas.UserResponse:
        user = await AuthRepository.get_by_email(conn, credentials.email)
        if not user or not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        # Attach HttpOnly JWT Cookies
        AuthService._set_token_cookies(response, str(user["id"]))

        return schemas.UserResponse(**user)

    @staticmethod
    async def refresh_session(conn: asyncpg.Connection, refresh_token: str, response: Response) -> schemas.UserResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        user_id = payload.get("sub")
        row = await conn.fetchrow(queries.GET_USER_BY_EMAIL, user_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found.",
            )

        user = dict(row)
        # Issue fresh token pair
        AuthService._set_token_cookies(response, str(user["id"]))

        return schemas.UserResponse(**user)

    @staticmethod
    def logout_user(response: Response) -> dict:
        """Clears auth cookies on logout."""
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")
        return {"message": "Successfully logged out"}

    @staticmethod
    async def delete_account(conn: asyncpg.Connection, user_id: uuid.UUID, response: Response) -> dict:
        deleted = await AuthRepository.delete_user(conn, user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

        # Clear active session cookies
        AuthService.logout_user(response)

        return {"message": "Account successfully deleted."}

    @staticmethod
    async def request_password_reset(conn: asyncpg.Connection, data: schemas.ForgotPasswordRequest) -> dict:
        user = await AuthRepository.get_by_email(conn, data.email)
        
        # Security Best Practice: Don't reveal if email exists or not
        if not user:
            return {"message": "If that email is registered, a password reset link has been sent."}

        # Generate secure random token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        await AuthRepository.create_reset_token(conn, user["id"], reset_token, expires_at)

        # TODO: Integrate Email Service (Resend/SMTP) here
        # E.g., await send_reset_email(user["email"], reset_token)
        print(f" RESET TOKEN for {user['email']}: {reset_token}")

        return {"message": "If that email is registered, a password reset link has been sent."}

    @staticmethod
    async def reset_password(conn: asyncpg.Connection, data: schemas.ResetPasswordRequest) -> dict:
        token_record = await AuthRepository.get_valid_reset_token(conn, data.token)
        if not token_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token.",
            )

        new_hashed_password = hash_password(data.new_password)
        await AuthRepository.update_password_and_invalidate_token(
            conn,
            user_id=token_record["user_id"],
            new_hashed_password=new_hashed_password,
            token_id=token_record["id"],
        )

        return {"message": "Password successfully reset. You can now log in with your new password."}

    @staticmethod
    async def change_password(
        conn: asyncpg.Connection,
        user_id: uuid.UUID,
        payload: schemas.ChangePasswordRequest,
    ) -> dict:
        # Fetch current user record from DB
        row = await conn.fetchrow(queries.GET_CURRENT_PASSWORD, user_id)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # 1. Verify current password
        if not verify_password(payload.current_password, row["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect current password.",
            )

        # 2. Hash and update new password
        new_hashed = hash_password(payload.new_password)
        await conn.execute(queries.UPDATE_USER_PASSWORD, new_hashed, user_id)

        return {"message": "Password updated successfully."}