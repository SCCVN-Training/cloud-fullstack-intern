import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schema import (
    UserResponse,
    UserListResponse,
    UserUpdate,
    UserReplace,
)
from app.common.enums import UserRole
from app.core.exceptions import (
    UserNotFoundException,
    ForbiddenException,
    EmailAlreadyExistsException,
)


class UserService:
    # LIST — admin only (listing every account is an admin capability)
    @staticmethod
    async def get_all_users(
        db: AsyncSession,
        current_user: User,
        skip: int = 0,
        limit: int = 20,
    ) -> UserListResponse:
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenException("Admin privileges required")

        users, total = await UserRepository.get_all(db, skip=skip, limit=limit)

        return UserListResponse(
            total=total,
            users=[UserResponse.model_validate(u) for u in users],
        )

    # GET ONE — the user themselves, or an admin
    @staticmethod
    async def get_user_by_id(
        db: AsyncSession,
        target_id: uuid.UUID,
        current_user: User,
    ) -> UserResponse:
        target_user = await UserRepository.get_by_id(db, target_id)

        if target_user is None:
            raise UserNotFoundException("User not found")

        UserService._ensure_self_or_admin(current_user, target_user)

        return UserResponse.model_validate(target_user)

    # UPDATE — the user themselves, or an admin
    @staticmethod
    async def update_user(
        db: AsyncSession,
        target_id: uuid.UUID,
        updates: UserUpdate,
        current_user: User,
    ) -> UserResponse:
        target_user = await UserRepository.get_by_id(db, target_id)

        if target_user is None:
            raise UserNotFoundException("User not found")

        UserService._ensure_self_or_admin(current_user, target_user)

        # Only include fields the client actually sent (partial update)
        update_data = updates.model_dump(exclude_unset=True)

        # If email is changing, make sure nobody else already owns it
        new_email = update_data.get("email")
        if new_email and new_email != target_user.email:
            existing = await UserRepository.get_by_email(db, new_email)
            if existing is not None:
                raise EmailAlreadyExistsException("Email already registered")

        updated_user = await UserRepository.update(db, target_user, update_data)

        return UserResponse.model_validate(updated_user)

    # REPLACE - unlike PATCH, every field is required and always overwritten,
    # even if the value is the same as the old one
    @staticmethod
    async def replace_user(
        db: AsyncSession,
        target_id: uuid.UUID,
        replacement: UserReplace,
        current_user: User,
    ) -> UserResponse:
        target_user = await UserRepository.get_by_id(db, target_id)

        if target_user is None:
            raise UserNotFoundException("User not found")

        UserService._ensure_self_or_admin(current_user, target_user)
        # No exclude_unset here — PUT means "this is the new full state",
        # so every field in the schema is applied.
        replace_data = replacement.model_dump()

        new_email = replace_data.get("email")
        if new_email and new_email != target_user.email:
            existing = await UserRepository.get_by_email(db, new_email)
            if existing is not None:
                raise EmailAlreadyExistsException("Email already registered")

        replaced_user = await UserRepository.update(db, target_user, replace_data)

        return UserResponse.model_validate(replaced_user)

    # DELETE — the user themselves, or an admin
    @staticmethod
    async def delete_user(
        db: AsyncSession,
        target_id: uuid.UUID,
        current_user: User,
    ) -> None:
        target_user = await UserRepository.get_by_id(db, target_id)

        if target_user is None:
            raise UserNotFoundException("User not found")

        UserService._ensure_self_or_admin(current_user, target_user)

        await UserRepository.delete(db, target_user)

    # Shared authorization rule: you may act on your own account,
    # or an admin may act on anyone's account.
    @staticmethod
    def _ensure_self_or_admin(current_user: User, target_user: User) -> None:
        if current_user.id != target_user.id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You are not allowed to access this user")
