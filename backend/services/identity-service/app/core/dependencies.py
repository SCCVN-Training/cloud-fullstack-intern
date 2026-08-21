from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import (
    InvalidTokenException,
    UserNotFoundException,
    ForbiddenException  
)
from app.common.enums import UserRole
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

# HTTP Bearer scheme — /auth/login takes a JSON body, not OAuth2 form data,
# so OAuth2PasswordBearer's auto-generated Swagger login form doesn't match
# our endpoint's request shape. HTTPBearer instead gives Swagger a plain
# "paste your token" field, which is what we actually want here.
bearer_scheme = HTTPBearer()

# Current user dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
        token = credentials.credentials
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
        raise ForbiddenException(
            "Admin priviledges required"
        )

    return current_user