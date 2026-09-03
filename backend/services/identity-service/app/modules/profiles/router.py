import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.profiles.service import ProfileService
from app.modules.profiles.schema import ProfileResponse, ProfileUpdate, PublicProfileResponse

router = APIRouter(prefix="/users/{user_id}/profile", tags=["Profiles"])

# Separate router, no auth dependency: this is meant to be called
# service-to-service (marketplace-service -> identity-service) on the
# private network, not from the browser. Kept on its own /internal
# prefix so the trust boundary is obvious from the URL alone — don't
# add browser-facing routes here.
internal_router = APIRouter(prefix="/internal/users", tags=["Internal"])


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


# UPLOAD AVATAR (self or admin) — multipart file upload, not JSON. Saves
# the file (locally for now — see app/core/storage.py) and PATCHes
# Profile.avatar_url to the resulting URL in one step.
@router.post("/avatar", response_model=ProfileResponse, status_code=status.HTTP_200_OK)
async def upload_avatar(
    user_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await ProfileService.update_avatar(db, user_id, file, current_user)


# GET /internal/users/{id}/public — consumed by marketplace-service to
# decorate skills/bookings/reviews with instructor display info. Returns
# 404 (not the full profile) if the user doesn't exist, so a caller with
# a stale/bad user_id gets a clean, expected failure mode.
@internal_router.get("/{user_id}/public", response_model=PublicProfileResponse, status_code=status.HTTP_200_OK)
async def get_public_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await ProfileService.get_public_profile(db, user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="User not found")
    return result
