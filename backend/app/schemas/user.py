from pydantic import BaseModel, EmailStr, Field

### REGISTER
# Used by POST /auth/register
class UserCreate(BaseModel):
    user_name: str = Field(..., min_length=5, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)

# Returned after successful registration
class UserResponse(BaseModel):
    id: int
    user_name: str
    email: EmailStr
    model_config = {
        "from_attributes": True
    }

### LOGIN
# Used by POST /auth/login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Returned after successful login
class LoginResponse(BaseModel):
    message: str