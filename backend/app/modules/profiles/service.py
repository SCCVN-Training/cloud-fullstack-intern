import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.profiles.models import Profile
from app.modules.profiles.repository import ProfileRepository
from app.modules.profiles.schema import ProfileResponse, ProfileUpdate
from app.common.enums import UserRole
from app.core.exceptions import ProfileNotFoundException, ForbiddenException


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

        return ProfileResponse.from_model(profile)

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

        return ProfileResponse.from_model(updated_profile)

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

    # Shared authorization rule: you may access your own profile,
    # or an admin may access anyone's.
    @staticmethod
    def _ensure_self_or_admin(current_user: User, target_user_id: uuid.UUID) -> None:
        if current_user.id != target_user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You are not allowed to access this profile")
