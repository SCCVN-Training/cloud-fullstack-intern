from shared.repositories import BaseRepository
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from modules.auth.models import UserAccountModel


class AuthRepository(BaseRepository[UserAccountModel]):
    """
    UserAccountModel repository with auth-specific operations.

    Inherits from BaseRepository:
    - create()
    - get_by_id()
    - get_all()
    - update()
    - delete()
    """

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        super().__init__(UserAccountModel, session)

    # ============ Custom Query Methods ============

    async def get_by_email(self, email: str) -> UserAccountModel | None:
        """
        Find a user by email address.

        Args:
            email: UserAccountModel's email address

        Returns:
            UserAccountModel instance if found, None otherwise
        """
        result = await self.session.execute(
            select(UserAccountModel).where(UserAccountModel.email == email)
        )
        return result.scalar_one_or_none()

    # async def get_active_users(self) -> list[UserAccountModel]:
    #     """
    #     Get all active users.

    #     Returns:
    #         List of active users
    #     """
    #     result = await self.session.execute(
    #         select(UserAccountModel).where(UserAccountModel.is_active == True)
    #     )
    #     return result.scalars().all()

    async def check_email_exists(self, email: str) -> bool:
        """
        Check if an email is already registered.

        Args:
            email: Email to check

        Returns:
            True if email exists, False otherwise
        """
        result = await self.session.execute(
            select(UserAccountModel.id).where(UserAccountModel.email == email).limit(1)
        )
        return result.scalar_one_or_none() is not None

    # async def deactivate_user(self, user_id: UUID) -> Optional[UserAccountModel]:
    #     """
    #     Soft delete a user (set is_active=False).

    #     Args:
    #         user_id: UserAccountModel ID to deactivate

    #     Returns:
    #         Updated user if found, None otherwise
    #     """
    #     return await self.update(user_id, is_active=False)

    # async def reactivate_user(self, user_id: UUID) -> Optional[UserAccountModel]:
    #     """
    #     Reactivate a user (set is_active=True).

    #     Args:
    #         user_id: UserAccountModel ID to reactivate

    #     Returns:
    #         Updated user if found, None otherwise
    #     """
    #     return await self.update(user_id, is_active=True)
