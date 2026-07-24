from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class UserRegistrationRequestSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    display_name: str = Field(alias = "displayName")
    email: EmailStr
    password: str


class UserLoginRequestSchema(BaseModel):
    email: EmailStr
    password: str


class UserAccountSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )

    id: UUID
    email: EmailStr
    is_active_account: bool = Field(alias="isActive")

class UserDataSchema(BaseModel):
    user: UserAccountSchema

class TokenClaimsSchema(BaseModel):
    subject_user_id: str
    email: EmailStr
    token_type: str