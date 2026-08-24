from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# ============ REQUEST SCHEMAS ============


class RegisterRequest(BaseModel):
    """Registration request."""

    email: EmailStr
    password: str = Field(..., min_length=6)
    model_config = ConfigDict(populate_by_name=True)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        """Validate email format."""
        if not v or "@" not in v:
            raise ValueError("Invalid email address")
        return v.lower()


class LoginRequest(BaseModel):
    """Login credentials."""

    email: EmailStr
    password: str


# ============ RESPONSE SCHEMAS ============


class UserResponse(BaseModel):
    """User data returned in API responses."""

    id: UUID
    email: EmailStr
    is_active: bool = Field(alias="isActive")
    created_at_utc: datetime = Field(alias="createdAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


class UserDataResponse(BaseModel):
    user: UserResponse


# ============ INTERNAL ============


class TokenClaims(BaseModel):
    """Data stored inside JWT token."""

    sub: str  # User ID as string
    email: EmailStr
    type: str  # "access" or "refresh"
    exp: int | None = None
    iat: int | None = None
