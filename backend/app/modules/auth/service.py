from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)
from app.core.exceptions import (
    EmailAlreadyExistsException,
    InvalidCredentialException,
)
from app.modules.auth.schema import ( 
    RegisterRequest, 
    RegisterResponse, 
    LoginRequest, 
    LoginResponse
)

class AuthService:
    # REGISTER
    @staticmethod
    async def create_user(
        db: AsyncSession, 
        user_data: RegisterRequest
    ) -> RegisterResponse:
        
        # Check if email already exists
        existing_user = await UserRepository.get_by_email(
            db,
            user_data.email
        )

        if existing_user:
            raise EmailAlreadyExistsException(
                "Email already registered"
            )

        # Hash password
        hashed_password = hash_password(
            user_data.password
        )

        # Create user object
        new_user = User(
            user_name=user_data.user_name,
            email=user_data.email,
            password_hash=hashed_password
        )
        
        new_user = await UserRepository.create(
            db,
            new_user
        )

        return RegisterResponse.model_validate(
            new_user
        )

    # LOGIN
    @staticmethod
    async def login_user(
        db: AsyncSession, 
        user_data: LoginRequest
    ) -> LoginResponse:
        
        # Find user by email
        user = await UserRepository.get_by_email(
            db,
            user_data.email
        )

        # Check if user exists
        if user is None:
            raise InvalidCredentialException(
                "Invalid email or password"
            )

        # Verify password
        if not verify_password(
            user_data.password,
            user.password_hash
        ):
            raise InvalidCredentialException(
                "Invalid email or password"
            )

        # Generate JWT access token
        access_token = create_access_token(
            {
                "sub": str(user.id)
            }
        )

        # Login successfully
        return LoginResponse(
            access_token=access_token,
            token_type="bearer"
        )