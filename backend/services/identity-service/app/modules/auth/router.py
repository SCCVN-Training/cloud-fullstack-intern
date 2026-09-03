from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import ( 
    APIRouter, 
    Depends, 
    Request,
    status
)

from app.core.database import get_db
from app.core.rate_limit import limiter
from app.modules.users.models import User
from app.modules.auth.service import AuthService
from app.core.dependencies import get_current_user
from app.modules.auth.schema import ( 
    RegisterRequest, 
    RegisterResponse, 
    LoginRequest, 
    LoginResponse,
    CurrentUserResponse
)

router = APIRouter(
    prefix='/auth',
    tags=["Authentication"]
)

### REGISTER
# Tighter limit than the browse endpoints: registration is cheap to spam
# and directly enables downstream abuse (fake accounts).
@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED
)
@limiter.limit("10/hour")
async def register(
    request: Request,
    user: RegisterRequest,
    db: AsyncSession = Depends(get_db)
):
    return await AuthService.create_user(db, user)

### LOGIN
# Classic brute-force protection: a handful of attempts per minute per IP
# is generous for a real user who mistyped a password, but throttles
# credential-stuffing/guessing.
@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK
)
@limiter.limit("10/minute")
async def login(
    request: Request,
    user: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    return await AuthService.login_user(db, user)

### CURRENT USER
@router.get(
    "/me",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK
)

async def get_me(
    current_user: User = Depends(get_current_user)
):
    return CurrentUserResponse.model_validate(
        current_user
    )

