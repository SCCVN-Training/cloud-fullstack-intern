import asyncpg
from fastapi import Depends
from app.core.database import get_db_connection
from app.modules.auth.repository import AuthRepository


async def get_auth_repository() -> AuthRepository:
    """Dependency injector for AuthRepository."""
    return AuthRepository()


# Placeholder for JWT validation dependency (coming in the next step)
async def get_current_user(
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    """Dependency to extract & validate JWT session from cookies."""
    pass