import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.profiles.service import ProfileService
from app.modules.profiles.schema import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/users/{user_id}/profile", tags=["Profiles"])


# GET PROFILE (self or admin)
@router.get("", response_model=ProfileResponse, status_code=status.HTTP_200_OK)
async def get_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ProfileService.get_profile(db, user_id, current_user)


# UPDATE PROFILE (self or admin) — partial update
@router.patch("", response_model=ProfileResponse, status_code=status.HTTP_200_OK)
async def update_profile(
    user_id: uuid.UUID,
    updates: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ProfileService.update_profile(db, user_id, updates, current_user)
