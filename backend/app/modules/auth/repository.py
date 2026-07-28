import asyncpg
import uuid
from datetime import datetime
from typing import Optional, Any
from app.modules.auth import queries

class AuthRepository:

    @staticmethod
    async def get_by_email(conn: asyncpg.Connection, email: str) -> Optional[dict[str, Any]]:
        """Queries user by email using raw SQL and parameterized bindings."""
        row = await conn.fetchrow(queries.GET_USER_BY_EMAIL, email)
        return dict(row) if row else None

    @staticmethod
    async def create_user(
        conn: asyncpg.Connection,
        email: str,
        hashed_password: str,
        full_name: Optional[str],
    ) -> dict[str, Any]:
        row = await conn.fetchrow(queries.CREATE_USER, email, hashed_password, full_name)
        return dict(row)

    @staticmethod
    async def delete_user(conn: asyncpg.Connection, user_id: uuid.UUID) -> bool:
        """Permanently deletes a user from the database."""
        result = await conn.execute(queries.DELETE_USER, user_id)
        # Returns True if a row was actually deleted
        return result == "DELETE 1"

    @staticmethod
    async def create_reset_token(
        conn: asyncpg.Connection, user_id: uuid.UUID, token: str, expires_at: datetime
    ) -> None:
        """Stores a new password reset token."""
        await conn.execute(queries.CREATE_RESET_TOKEN, user_id, token, expires_at)

    @staticmethod
    async def get_valid_reset_token(
        conn: asyncpg.Connection, token: str
    ) -> Optional[dict[str, Any]]:
        """Retrieves a token record if it exists, is unused, and hasn't expired."""
        row = await conn.fetchrow(queries.GET_VALID_RESET_TOKEN, token)
        return dict(row) if row else None

    @staticmethod
    async def update_password_and_invalidate_token(
        conn: asyncpg.Connection, user_id: uuid.UUID, new_hashed_password: str, token_id: uuid.UUID
    ) -> None:
        """Updates user password and marks the token as used in a single transaction."""
        async with conn.transaction():
            await conn.execute(
                queries.UPDATE_USER_PASSWORD,
                new_hashed_password,
                user_id,
            )
            await conn.execute(
                queries.INVALIDATE_RESET_TOKEN,
                token_id,
            )