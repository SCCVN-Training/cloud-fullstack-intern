import uuid

from pydantic import BaseModel, EmailStr, Field

### REGISTER
# Used by POST /auth/register
class RegisterRequest(BaseModel):
    user_name: str = Field(..., min_length=5, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

# Successful registration
class RegisterResponse(BaseModel):
    id: uuid.UUID
    user_name: str
    email: EmailStr
    model_config = {
        "from_attributes": True
    }

### LOGIN
# Used by POST /auth/login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Successful login
class LoginResponse(BaseModel):
    access_token: str
    token_type: str

### CURRENT USER
class CurrentUserResponse(BaseModel):
    id: uuid.UUID
    user_name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }