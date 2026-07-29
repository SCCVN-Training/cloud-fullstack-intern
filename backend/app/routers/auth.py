from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.user import ( 
    UserCreate, 
    UserResponse, 
    UserLogin, 
    LoginResponse 
)
from app.services.user_service import UserService

router = APIRouter(
    prefix='/auth',
    tags=["Authentication"]
)

### REGISTER
@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)

async def register(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await UserService.create_user(db, user)

    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )

### LOGIN
@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK
)

async def login(
    user: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    try:
        return await UserService.login_user(db, user)

    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(err)
        )
