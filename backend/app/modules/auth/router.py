import asyncpg
from fastapi import APIRouter, Depends, Request, Response, status, HTTPException
from app.core.database import get_db_connection
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.service import AuthService
from app.modules.auth import schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: schemas.UserRegisterRequest,
    response: Response,
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    return await AuthService.register_user(conn, payload, response)


@router.post("/login", response_model=schemas.UserResponse)
async def login(
    payload: schemas.UserLoginRequest,
    response: Response,
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    return await AuthService.login_user(conn, payload, response)


@router.post("/refresh", response_model=schemas.UserResponse)
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


@router.get("/me", response_model=schemas.UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Protected endpoint: Returns current user profile."""
    return schemas.UserResponse(**current_user)

@router.delete("/me", status_code=status.HTTP_200_OK)
async def delete_me(
    response: Response,
    current_user: dict = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    """Protected endpoint: Permanently deletes current user account."""
    return await AuthService.delete_account(conn, current_user["id"], response)

@router.post("/forgot-password", response_model=schemas.MessageResponse)
async def forgot_password(
    payload: schemas.ForgotPasswordRequest,
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    """Requests a password reset link for a given email address."""
    return await AuthService.request_password_reset(conn, payload)


@router.post("/reset-password", response_model=schemas.MessageResponse)
async def reset_password(
    payload: schemas.ResetPasswordRequest,
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    """Resets user password using a valid reset token."""
    return await AuthService.reset_password(conn, payload)

@router.put("/change-password", response_model=schemas.MessageResponse)
async def change_password(
    payload: schemas.ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    conn: asyncpg.Connection = Depends(get_db_connection),
):
    """Protected endpoint: Allows logged-in users to update their password."""
    return await AuthService.change_password(conn, current_user["id"], payload)