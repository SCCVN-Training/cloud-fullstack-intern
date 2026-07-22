import asyncpg
from fastapi import APIRouter, Depends, Request, Response, status, HTTPException
from app.core.database import get_db_connection
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.schemas import UserRegisterRequest, UserLoginRequest, UserResponse
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: UserRegisterRequest,
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    return await AuthService.register_user(conn, payload)


@router.post("/login", response_model=UserResponse)
async def login(
    payload: UserLoginRequest,
    response: Response,
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    return await AuthService.login_user(conn, payload, response)


@router.post("/refresh", response_model=UserResponse)
async def refresh(
    request: Request,
    response: Response,
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return await AuthService.refresh_session(conn, refresh_token, response)


@router.post("/logout")
async def logout(response: Response):
    return AuthService.logout_user(response)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Protected endpoint: Returns current user profile."""
    return UserResponse(**current_user)