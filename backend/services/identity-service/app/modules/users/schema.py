import uuid

from typing import Optional
from pydantic import BaseModel, EmailStr, Field

# GET /users/{id}
# PATCH /users/{id}
class UserResponse(BaseModel):
    id: uuid.UUID
    user_name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }

# GET /users -> list of total count for pagination
class UserListResponse(BaseModel):
    total: int
    users: list[UserResponse]

# PATCH /users/{id}
class UserUpdate(BaseModel):
    user_name: Optional[str] = Field(None, min_length=5, max_length=50)
    email: Optional[EmailStr] = None

# PUT /users/{id}
class UserReplace(BaseModel):
    user_name: str = Field(..., min_length=5, max_length=50)
    email: EmailStr