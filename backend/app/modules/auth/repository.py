import asyncpg
import uuid
from datetime import datetime
from typing import Optional, Any


class AuthRepository:

    @staticmethod
    async def get_by_email(conn: asyncpg.Connection, email: str) -> Optional[dict[str, Any]]:
        """Queries user by email using raw SQL and parameterized bindings."""
        query = "SELECT * FROM nephos.users WHERE email = $1"
        row = await conn.fetchrow(query, email)
        return dict(row) if row else None

    @staticmethod
    async def create_user(
        conn: asyncpg.Connection,
        email: str,
        hashed_password: str,
        full_name: Optional[str],
    ) -> dict[str, Any]:
        """Inserts a new user record safely into PostgreSQL."""
        query = """
            INSERT INTO nephos.users (email, hashed_password, full_name)
            VALUES ($1, $2, $3)
            RETURNING id, email, full_name, storage_used, storage_quota, created_at;
        """
        row = await conn.fetchrow(query, email, hashed_password, full_name)
        return dict(row)

    @staticmethod
    async def delete_user(conn: asyncpg.Connection, user_id: uuid.UUID) -> bool:
        """Permanently deletes a user from the database."""
        query = "DELETE FROM nephos.users WHERE id = $1"
        result = await conn.execute(query, user_id)
        # Returns True if a row was actually deleted
        return result == "DELETE 1"

    @staticmethod
    async def create_reset_token(
        conn: asyncpg.Connection, user_id: uuid.UUID, token: str, expires_at: datetime
    ) -> None:
        """Stores a new password reset token."""
        query = """
            INSERT INTO nephos.password_resets (user_id, token, expires_at)
            VALUES ($1, $2, $3)
        """
        await conn.execute(query, user_id, token, expires_at)

    @staticmethod
    async def get_valid_reset_token(
        conn: asyncpg.Connection, token: str
    ) -> Optional[dict[str, Any]]:
        """Retrieves a token record if it exists, is unused, and hasn't expired."""
        query = """
            SELECT * FROM nephos.password_resets 
            WHERE token = $1 AND is_used = FALSE AND expires_at > CURRENT_TIMESTAMP
        """
        row = await conn.fetchrow(query, token)
        return dict(row) if row else None

    @staticmethod
    async def update_password_and_invalidate_token(
        conn: asyncpg.Connection, user_id: uuid.UUID, new_hashed_password: str, token_id: uuid.UUID
    ) -> None:
        """Updates user password and marks the token as used in a single transaction."""
        async with conn.transaction():
            await conn.execute(
                "UPDATE nephos.users SET hashed_password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
                new_hashed_password,
                user_id,
            )
            await conn.execute(
                "UPDATE nephos.password_resets SET is_used = TRUE WHERE id = $1",
                token_id,
            )