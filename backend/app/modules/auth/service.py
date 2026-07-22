import asyncpg
from fastapi import HTTPException, status
from app.core.security import hash_password, verify_password
from app.modules.auth.repository import AuthRepository
from app.modules.auth.schemas import UserRegisterRequest, UserLoginRequest, UserResponse


class AuthService:

    @staticmethod
    async def register_user(conn: asyncpg.Connection, data: UserRegisterRequest) -> UserResponse:
        # 1. Check if user already exists
        existing_user = await AuthRepository.get_by_email(conn, data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered.",
            )

        # 2. Hash password
        hashed_pwd = hash_password(data.password)

        # 3. Create user record
        new_user = await AuthRepository.create_user(
            conn,
            email=data.email,
            hashed_password=hashed_pwd,
            full_name=data.full_name,
        )

        return UserResponse(**new_user)

    @staticmethod
    async def login_user(conn: asyncpg.Connection, credentials: UserLoginRequest) -> UserResponse:
        # 1. Fetch user by email
        user = await AuthRepository.get_by_email(conn, credentials.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        # 2. Verify password match
        if not verify_password(credentials.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        # 3. Verify active status
        if not user.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive.",
            )

        return UserResponse(**user)