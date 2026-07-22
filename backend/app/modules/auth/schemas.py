from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
import uuid


# Request payload for user registration
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Password must be at least 8 characters")
    full_name: str | None = None


# Request payload for user login
class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


# Safe response model (excludes password hashes)
class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    storage_used: int
    storage_quota: int
    created_at: datetime