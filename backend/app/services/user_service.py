from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.models.user import User
from app.schemas.user import ( 
    UserCreate, 
    UserLogin, 
    LoginResponse
)

pwd_context = CryptContext(
    schemes=["bcrypt"], 
    deprecated="auto"
)

class UserService:
    @staticmethod
    async def create_user(
        db: AsyncSession, 
        user_data: UserCreate
    ) -> User:
        
        # Check if email already exists
        result = await db.execute(
            select(User).where(
                User.email == user_data.email
            )
        )

        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise ValueError("Email already registered")

        # Hash password
        hashed_password = pwd_context.hash(
            user_data.password
        )

        # Create user object
        new_user = User(
            user_name=user_data.user_name,
            email=user_data.email,
            password_hash=hashed_password
        )

        # Save to database
        db.add(new_user)

        await db.commit()

        await db.refresh(new_user)

        return new_user

    @staticmethod
    async def login_user(
        db: AsyncSession, 
        user_data: UserLogin
    ) -> LoginResponse:
        
        # Find user by email
        result = await db.execute(
            select(User).where(
                User.email == user_data.email
            )
        )

        user = result.scalar_one_or_none()

        # Check if user exists
        if user is None:
            raise ValueError("Invalid email or password")

        # Verify password
        if not pwd_context.verify(
            user_data.password,
            user.password_hash
        ):
            raise ValueError("Invalid email or password")

        # Login successfully
        return LoginResponse(
            message="Login successful"
        )