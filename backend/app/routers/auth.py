from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import ( UserCreate, UserResponse, UserLogin, LoginResponse )
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

def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    try:
        return UserService.create_user(db, user)

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

def login(
    user: UserLogin,
    db: Session = Depends(get_db)
):
    try:
        return UserService.login_user(db, user)

    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(err)
        )
