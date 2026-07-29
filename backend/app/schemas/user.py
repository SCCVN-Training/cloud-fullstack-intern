from pydantic import BaseModel, EmailStr, Field

# Used by POST /register
class UserCreate(BaseModel):
    user_name: str = Field(..., min_length=5, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

# When register successfully, then return response
class UserResponse(BaseModel):
    id: int
    user_name: str
    email: EmailStr
    model_config = {
        "from_attributes": True
    }