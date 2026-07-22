import asyncpg
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