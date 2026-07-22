from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
import uuid

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Password must be at least 8 characters")
    full_name: str | None = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    storage_used: int
    storage_quota: int
    created_at: datetime


class TokenResponse(BaseModel):
    message: str
    user: UserResponse