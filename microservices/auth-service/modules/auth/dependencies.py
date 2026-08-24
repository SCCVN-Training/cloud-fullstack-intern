from fastapi import Depends, HTTPException, Request, status
from shared.database import get_db
from shared.security import verify_token
from sqlalchemy.ext.asyncio import AsyncSession

from modules.auth.models import UserAccountModel
from modules.auth.repositories import AuthRepository


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserAccountModel:
    """
    Dependency to get current authenticated user from access token cookie.

    Usage:
        @router.get("/protected")
        async def protected_route(
            current_user: User = Depends(get_current_user)
        ):
            return {"user_id": current_user.id}

    Raises:
        HTTPException 401: Not authenticated
    """
    access_token = request.cookies.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = verify_token(access_token, token_type="access")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    repo = AuthRepository(db)
    user = await repo.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    return user


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserAccountModel | None:
    """
    Optional dependency - doesn't raise error if not authenticated.

    Usage:
        @router.get("/public-or-private")
        async def route(
            current_user: Optional[User] = Depends(get_current_user_optional)
        ):
            if current_user:
                return {"user": current_user.id}
            return {"message": "Anonymous"}
    """
    access_token = request.cookies.get("access_token")

    if not access_token:
        return None

    user_id = verify_token(access_token, token_type="access")
    if not user_id:
        return None

    repo = AuthRepository(db)
    user = await repo.get_by_id(user_id)

    if not user or not user.is_active:
        return None

    return user
