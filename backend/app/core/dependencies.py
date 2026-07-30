from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import OAuth2PasswordBearer

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import (
    InvalidTokenException,
    UserNotFoundException
)
from app.common.enums import UserRole
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
        role = payload.get("role")

        if user_id is None or role is None:
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

# Admin authorization dependency
async def require_admin(
    current_user: User = Depends(get_current_user)
) -> User:

    if current_user.role != UserRole.ADMIN:
        raise InvalidTokenException(
             "Admin priviledges required"
        ) 

    return current_user