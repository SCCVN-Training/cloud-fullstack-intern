import asyncpg
from fastapi import APIRouter, Depends, status
from app.core.database import get_db_connection
from app.modules.auth.schemas import UserRegisterRequest, UserLoginRequest, UserResponse
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegisterRequest,
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    """Endpoint for user registration."""
    return await AuthService.register_user(conn, payload)

@router.post("/login", response_model=UserResponse)
async def login(
    payload: UserLoginRequest,
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    """Endpoint for user authentication."""
    return await AuthService.login_user(conn, payload)