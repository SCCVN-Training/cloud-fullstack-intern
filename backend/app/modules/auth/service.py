import asyncpg
from datetime import timedelta
from fastapi import HTTPException, Response, status
from app.core.config import settings
from app.core.security import hash_password, verify_password, create_token, decode_token
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import UserRegisterRequest, UserLoginRequest, UserResponse

class AuthService:

    @staticmethod
    def _set_token_cookies(response: Response, user_id: str) -> None:
        """Helper to create and attach HttpOnly access and refresh cookies."""
        access_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        refresh_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

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
    async def register_user(conn: asyncpg.Connection, data: UserRegisterRequest, response: Response) -> UserResponse:
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

        return UserResponse(**new_user)

    @staticmethod
    async def login_user(
        conn: asyncpg.Connection, credentials: UserLoginRequest, response: Response
    ) -> UserResponse:
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

        return UserResponse(**user)

    @staticmethod
    async def refresh_session(conn: asyncpg.Connection, refresh_token: str, response: Response) -> UserResponse:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        user_id = payload.get("sub")
        query = "SELECT * FROM nephos.users WHERE id = $1"
        row = await conn.fetchrow(query, user_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found.",
            )

        user = dict(row)
        # Issue fresh token pair
        AuthService._set_token_cookies(response, str(user["id"]))

        return UserResponse(**user)

    @staticmethod
    def logout_user(response: Response) -> dict:
        """Clears auth cookies on logout."""
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")
        return {"message": "Successfully logged out"}