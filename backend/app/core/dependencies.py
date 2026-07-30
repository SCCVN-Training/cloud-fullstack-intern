from uuid import UUID

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import (
    InvalidTokenException,
    UserNotFoundException
)
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

# OAuth2 bearer token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

# Current user dependency
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
        payload = decode_access_token(token)
        user_id = payload.get("sub")

        if user_id is None:
            raise InvalidTokenException(
                "Token payload is invalid"
            )

        user = await UserRepository.get_by_id(
            db,
            UUID(user_id)
        )

        if user is None:
            raise UserNotFoundException(
                "User not found"
            )

        return user