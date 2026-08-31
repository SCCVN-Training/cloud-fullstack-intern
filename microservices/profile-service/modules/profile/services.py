from uuid import UUID

from fastapi import HTTPException, status
from shared.logger import get_logger
from sqlalchemy.ext.asyncio import AsyncSession

from modules.profile.repositories import ProfileRepository
from modules.profile.schemas import (
    CreateProfileRequest,
    ProfileResponse,
    UpdateProfileRequest,
)

logger = get_logger(__name__)


class ProfileService:
    """
    Profile business logic service.

    Handles:
    - Profile creation (separate from auth)
    - Profile retrieval by user ID
    - Profile updates (partial)
    - Display name lookup
    """

    def __init__(self, postgres_session: AsyncSession):
        """Initialize service with database session."""
        self.repo = ProfileRepository(postgres_session)
        self.session = postgres_session

    # ============ Create ============

    async def create_profile(
        self,
        request: CreateProfileRequest,
    ) -> ProfileResponse:
        """
        Create a new user profile.

        ⚠️ Called separately after user registration.
        ⚠️ User must already exist in the database.

        Args:
            request: Profile creation request with user_id and display_name

        Returns:
            Created profile data

        Raises:
            HTTPException 400: Profile already exists
        """
        try:
            profile = await self.repo.create_profile(
                user_id=request.user_id,
                display_name=request.display_name,
            )
        except ValueError as e:
            logger.warning(
                f"Profile creation failed for user {request.user_id}: {e!s}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e),
            )
        logger.info(
            f"Business Event: Profile created successfully for user_id: {request.user_id}"
        )
        return profile

    # ============ Read ============

    async def get_profile_by_user_id(
        self,
        user_id: UUID,
    ) -> ProfileResponse:
        """
        Get profile by user ID.

        Args:
            user_id: User's UUID

        Returns:
            Profile data

        Raises:
            HTTPException 404: Profile not found
        """
        profile = await self.repo.get_by_user_id(user_id)

        if not profile:
            logger.warning(f"Profile lookup failed: Not found for user_id {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found for this user.",
            )

        return profile

    # ============ Update ============

    async def update_profile(
        self,
        user_id: UUID,
        payload: UpdateProfileRequest,
    ) -> ProfileResponse:
        """
        Update a user profile (partial update).

        Only fields provided in the request will be updated.

        Args:
            user_id: User's UUID
            request: Update request with optional fields

        Returns:
            Updated profile data

        Raises:
            HTTPException 404: Profile not found
        """
        # Get current profile
        profile = await self.repo.get_by_user_id(user_id)
        if not profile:
            logger.warning(f"Profile update failed: Not found for user_id {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found for this user.",
            )

        # Get changes (exclude None values)
        changes = payload.model_dump(exclude_none=True)

        if not changes:
            # No changes to apply
            return profile

        # Update profile
        updated_profile = await self.repo.patch_profile_by_user_id(
            user_id,
            changes,
        )
        logger.info(
            f"Business Event: Profile updated successfully for user_id: {user_id}"
        )
        return updated_profile

    # ============ Delete ============

    async def delete_profile(
        self,
        user_id: UUID,
    ) -> dict:
        """
        Delete a user profile.

        Args:
            user_id: User's UUID

        Returns:
            Success message

        Raises:
            HTTPException 404: Profile not found
        """
        deleted = await self.repo.delete_profile_by_user_id(user_id)

        if not deleted:
            logger.warning(f"Profile deletion failed: Not found for user_id {user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found for this user.",
            )

    # ============ Check Existence ============

    async def profile_exists(self, user_id: UUID) -> bool:
        """
        Check if a profile exists for a user.

        Args:
            user_id: User's UUID

        Returns:
            True if profile exists, False otherwise
        """
        profile = await self.repo.get_by_user_id(user_id)
        return profile is not None
