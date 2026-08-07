import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.users.service import UserService
from app.modules.users.schema import (
    UserResponse,
    UserListResponse,
    UserUpdate,
    UserReplace,
)

router = APIRouter(prefix="/users", tags=["Users"])

# Separate router, same URL prefix, but its own "Admin" tag — so Swagger
# groups admin-only operations (list all users) visually apart from
# self-or-admin operations (get/update/replace/delete one user).
# Same prefix on two routers is fine; FastAPI just merges their routes.
admin_router = APIRouter(prefix="/users", tags=["Admin"])


# LIST USERS (admin only)
@admin_router.get("", response_model=UserListResponse, status_code=status.HTTP_200_OK)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserListResponse:
    return await UserService.get_all_users(
        db=db, current_user=current_user, skip=skip, limit=limit
    )


# GET ONE USER (self or admin)
@router.get("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await UserService.get_user_by_id(db, user_id, current_user)


# UPDATE USER (self or admin)
@router.patch("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user(
    user_id: uuid.UUID,
    updates: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await UserService.update_user(db, user_id, updates, current_user)


### FULL REPLACE USER (self or admin) — PUT means the client sends
### the entire resource; anything omitted is not preserved.
@router.put("/{user_id}", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def replace_user(
    user_id: uuid.UUID,
    replacement: UserReplace,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await UserService.replace_user(db, user_id, replacement, current_user)


# DELETE USER (self or admin)
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await UserService.delete_user(db, user_id, current_user)
