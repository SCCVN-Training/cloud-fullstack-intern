from datetime import datetime, timezone
from typing import Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.repositories import BaseRepository
from modules.profile.models import UserProfileModel


class ProfileRepository(BaseRepository[UserProfileModel]):
    """
    UserProfileModel repository with profile-specific operations.

    Inherits from BaseRepository:
    - create()
    - get_by_id()
    - get_all()
    - update()
    - delete()
    """

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        super().__init__(UserProfileModel, session)

    # ============ Custom Query Methods ============

    async def get_by_user_id(self, user_id: UUID) -> Optional[UserProfileModel]:
        """
        Get profile by user ID.

        Args:
            user_id: User's UUID

        Returns:
            UserProfileModel instance if found, None otherwise
        """
        result = await self.session.execute(
            select(UserProfileModel).where(UserProfileModel.user_id == user_id)
        )
        return result.scalar_one_or_none()

    # ============ Create Methods ============

    async def create_profile(
        self,
        user_id: UUID,
        display_name: str,
    ) -> UserProfileModel:
        """
        Create a new profile for a user.

        Args:
            user_id: User's UUID
            display_name: User's display name

        Returns:
            Created profile instance
        """
        # Check if profile already exists
        existing = await self.get_by_user_id(user_id)
        if existing:
            raise ValueError(f"UserProfileModel already exists for user {user_id}")

        # Create profile with default values
        profile = await self.create(
            user_id=user_id,
            display_name=display_name,
            bio=None,
            avatar_url=None,
            banner_url=None,
            profile_card_style="default",
            accent_color="#FF6B6B",
            background_color="#F5F5F5",
            is_profile_public=True,
            created_at_utc=datetime.now(timezone.utc),
            updated_at_utc=datetime.now(timezone.utc)
        )

        return profile

    # ============ Update Methods ============

    async def patch_profile_by_user_id(
        self,
        user_id: UUID,
        changes: Dict[str, Any],
    ) -> Optional[UserProfileModel]:
        """
        Update profile fields for a user.

        Args:
            user_id: User's UUID
            changes: Dictionary of fields to update

        Returns:
            True if updated, False otherwise
        """
        if not changes:
            return False

        # Add updated_at timestamp
        changes["updated_at_utc"] = datetime.now(timezone.utc)

        result = await self.session.execute(
            update(UserProfileModel)
            .where(UserProfileModel.user_id == user_id)
            .values(**changes)
            .returning(UserProfileModel)
        )
        await self.session.commit()

        return result.scalar_one_or_none()

    async def update_profile_by_user_id(
        self,
        user_id: UUID,
        **kwargs,
    ) -> Optional[UserProfileModel]:
        """
        Update profile and return the updated instance.

        Args:
            user_id: User's UUID
            **kwargs: Fields to update

        Returns:
            Updated profile instance if found, None otherwise
        """
        # First check if profile exists
        profile = await self.get_by_user_id(user_id)
        if not profile:
            return None

        # Update the profile
        updated_profile = await self.update(profile.user_id, **kwargs)
        return updated_profile

    # ============ Delete Methods ============

    async def delete_profile_by_user_id(self, user_id: UUID) -> bool:
        """
        Delete profile by user ID.

        Args:
            user_id: User's UUID

        Returns:
            True if deleted, False otherwise
        """
        profile = await self.get_by_user_id(user_id)
        if not profile:
            return False

        return await self.delete(profile.id)
