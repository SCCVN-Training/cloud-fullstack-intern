import uuid
from typing import Optional

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.profiles.models import Profile
from app.modules.profiles.repository import ProfileRepository
from app.modules.profiles.schema import ProfileResponse, ProfileUpdate, PublicProfileResponse
from app.common.enums import UserRole
from app.core.exceptions import (
    ProfileNotFoundException,
    ForbiddenException,
    UserNotFoundException,
    InvalidAvatarException,
)
from app.core.storage import save_avatar, get_avatar_url


class ProfileService:
    # GET — the profile owner, or an admin
    @staticmethod
    async def get_profile(
        db: AsyncSession,
        target_user_id: uuid.UUID,
        current_user: User,
    ) -> ProfileResponse:
        profile = await ProfileRepository.get_by_user_id(db, target_user_id)

        if profile is None:
            raise ProfileNotFoundException("Profile not found")

        ProfileService._ensure_self_or_admin(current_user, target_user_id)

        # user_name lives on User, not Profile — fetch the *target* user's
        # row (not current_user, since an admin may be viewing someone
        # else's profile).
        target_user = await UserRepository.get_by_id(db, target_user_id)
        if target_user is None:
            raise UserNotFoundException("User not found")

        return ProfileResponse.from_model(profile, login_user_name=target_user.user_name)

    # UPDATE — the profile owner, or an admin. Partial update (PATCH semantics).
    @staticmethod
    async def update_profile(
        db: AsyncSession,
        target_user_id: uuid.UUID,
        updates: ProfileUpdate,
        current_user: User,
    ) -> ProfileResponse:
        profile = await ProfileRepository.get_by_user_id(db, target_user_id)

        if profile is None:
            raise ProfileNotFoundException("Profile not found")

        ProfileService._ensure_self_or_admin(current_user, target_user_id)

        # Only include fields the client actually sent
        update_data = updates.model_dump(exclude_unset=True)

        updated_profile = await ProfileRepository.update(db, profile, update_data)

        target_user = await UserRepository.get_by_id(db, target_user_id)
        if target_user is None:
            raise UserNotFoundException("User not found")

        return ProfileResponse.from_model(updated_profile, login_user_name=target_user.user_name)

    # Called from AuthService right after a new user registers —
    # every user gets an empty profile row so GET never 404s unexpectedly
    # for a freshly-created account.
    @staticmethod
    async def create_default_profile(db: AsyncSession, user_id: uuid.UUID) -> Profile:
        profile = Profile(
            user_id=user_id,
            interests=[],
            skills_learning=[],
            skills_taught=[],
        )
        return await ProfileRepository.create(db, profile)

    # POST /users/{id}/profile/avatar — self or admin. Saves the uploaded
    # file (see app/core/storage.py) and writes the resulting URL to
    # Profile.avatar_url in the same call, so the response is already the
    # up-to-date profile — no separate PATCH needed from the client.
    @staticmethod
    async def update_avatar(
        db: AsyncSession,
        target_user_id: uuid.UUID,
        file: UploadFile,
        current_user: User,
    ) -> ProfileResponse:
        profile = await ProfileRepository.get_by_user_id(db, target_user_id)
        if profile is None:
            raise ProfileNotFoundException("Profile not found")

        ProfileService._ensure_self_or_admin(current_user, target_user_id)

        try:
            avatar_url = await save_avatar(target_user_id, file)
        except ValueError as e:
            raise InvalidAvatarException(str(e))

        updated_profile = await ProfileRepository.update(db, profile, {"avatar_url": avatar_url})

        target_user = await UserRepository.get_by_id(db, target_user_id)
        if target_user is None:
            raise UserNotFoundException("User not found")

        return ProfileResponse.from_model(updated_profile, login_user_name=target_user.user_name)

    # Shared authorization rule: you may access your own profile,
    # or an admin may access anyone's.
    @staticmethod
    def _ensure_self_or_admin(current_user: User, target_user_id: uuid.UUID) -> None:
        if current_user.id != target_user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You are not allowed to access this profile")

    # GET /internal/users/{id}/public — no auth check (see router: this
    # lives outside the authenticated /users/{id}/profile prefix and is
    # meant to be called service-to-service, not from the browser).
    # Returns None instead of raising when the user doesn't exist, so
    # callers (e.g. IdentityClient in marketplace-service) can degrade
    # gracefully instead of getting a 404/500 that looks like a real error.
    @staticmethod
    async def get_public_profile(db: AsyncSession, target_user_id: uuid.UUID) -> Optional["PublicProfileResponse"]:
        profile = await ProfileRepository.get_by_user_id(db, target_user_id)
        user = await UserRepository.get_by_id(db, target_user_id)

        if profile is None or user is None:
            return None

        title = "Mentor"
        if profile.skills_taught:
            title = "Expert in " + ", ".join(profile.skills_taught[:2])

        return PublicProfileResponse(
            user_id=user.id,
            user_name=profile.user_name or user.user_name,
            avatar_url=get_avatar_url(profile.avatar_url),
            bio=profile.bio,
            title=title,
        )
