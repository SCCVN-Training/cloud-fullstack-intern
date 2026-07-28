import asyncpg
from fastapi import Depends, HTTPException, Request, status
from app.core.database import get_db_connection
from app.core.security import decode_token
from app.modules.auth import queries


async def get_current_user(
    request: Request,
    conn: asyncpg.Connection = Depends(get_db_connection),
) -> dict:
    """FastAPI Dependency: Ensures request is authenticated via access_token cookie."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing.",
        )

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )

    user_id = payload.get("sub")
    row = await conn.fetchrow(queries.GET_USER_BY_EMAIL, user_id)

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    return dict(row)