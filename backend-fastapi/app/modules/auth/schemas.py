from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr

class UserRegistrationRequestSchema(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLoginRequestSchema(BaseModel):
    email: EmailStr
    password: str


class UserAccountResponseSchema(BaseModel):
    id: UUID
    username: str
    email: EmailStr
    is_active_account: bool
    avatar_url: str | None
    model_config = ConfigDict(from_attributes=True)


class TokenClaimsSchema(BaseModel):
    subject_user_id: str
    email: EmailStr
    token_type: str