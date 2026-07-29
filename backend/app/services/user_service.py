from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.models.user import User
from app.schemas.user import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        # Check if email already exists
        existing_user = (
            db.query(User)
            .filter(User.email == user_data.email)
            .first()
        )

        if existing_user:
            raise ValueError("Email already registered")

        # Hash password
        hashed_password = pwd_context.hash(user_data.password)

        # Create user object
        new_user = User(
            user_name=user_data.user_name,
            email=user_data.email,
            password_hash=hashed_password
        )

        # Save to database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return new_user