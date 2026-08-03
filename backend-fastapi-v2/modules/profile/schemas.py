from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# ============ Request Schemas ============

class CreateProfileRequest(BaseModel):
    """
    Request to create a user profile.

    Called after user registration to set up profile data.
    """
    user_id: UUID = Field(alias="userId", description="User ID from auth service")
    display_name: str = Field(
        ...,  # ← Required, no default
        min_length=1,
        max_length=50,
        alias="displayName",
        description="User's display name (required)"
    )

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "userId": "550e8400-e29b-41d4-a716-446655440000",
                "displayName": "John Doe"
            }
        }
    )


class UpdateProfileRequest(BaseModel):
    """
    Request to update a user profile.

    All fields are optional - only provided fields will be updated.
    """
    display_name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        alias="displayName",
        description="User's display name"
    )
    bio: Optional[str] = Field(
        None,
        max_length=500,
        description="User's biography"
    )
    avatar_url: Optional[str] = Field(
        None,
        max_length=500,
        alias="avatarUrl",
        description="URL to user's avatar image"
    )
    banner_url: Optional[str] = Field(
        None,
        max_length=500,
        alias="bannerUrl",
        description="URL to user's banner image"
    )
    profile_card_style: Optional[str] = Field(
        None,
        alias="profileCardStyle",
        description="Style of the profile card (e.g., 'default', 'compact', 'detailed')"
    )
    accent_color: Optional[str] = Field(
        None,
        alias="accentColor",
        description="User's accent color (hex code, e.g., '#FF6B6B')"
    )
    background_color: Optional[str] = Field(
        None,
        alias="backgroundColor",
        description="User's background color (hex code, e.g., '#F0F0F0')"
    )
    is_profile_public: Optional[bool] = Field(
        None,
        alias="isProfilePublic",
        description="Whether the profile is publicly visible"
    )

    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "displayName": "John Doe",
                "bio": "Anime and manga enthusiast!",
                "avatarUrl": "https://example.com/avatar.jpg",
                "accentColor": "#FF6B6B",
                "isProfilePublic": True
            }
        }
    )


# ============ Response Schemas ============

class ProfileResponse(BaseModel):
    """
    Profile data returned in API responses.

    ⚠️ Does NOT include total_anime, total_manga, total_music.
    ✅ These are computed via SQL views or separate endpoints.
    """
    user_id: UUID = Field(alias="userId")
    display_name: str = Field(alias="displayName")
    bio: Optional[str] = None
    avatar_url: Optional[str] = Field(None, alias="avatarUrl")
    banner_url: Optional[str] = Field(None, alias="bannerUrl")
    profile_card_style: str = Field(alias="profileCardStyle")
    accent_color: str = Field(alias="accentColor")
    background_color: str = Field(alias="backgroundColor")
    is_profile_public: bool = Field(alias="isProfilePublic")
    created_at_utc: datetime = Field(alias="createdAt")
    updated_at_utc: Optional[datetime] = Field(None, alias="updatedAt")

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )

class ProfileDataResponse(BaseModel):
    profile: ProfileResponse
class ProfileWithStatsResponse(ProfileResponse):
    """
    Profile response with computed stats from collection tables.

    ✅ This includes the total counts computed from:
    - user_anime table
    - user_manga table
    - user_music table
    """
    total_anime: int = Field(
        0,
        alias="totalAnime",
        description="Total anime in user's collection"
    )
    total_manga: int = Field(
        0,
        alias="totalManga",
        description="Total manga in user's collection"
    )
    total_music: int = Field(
        0,
        alias="totalMusic",
        description="Total music in user's collection"
    )

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )


# ============ Internal/Service Schemas ============

class ProfileStats(BaseModel):
    """Profile statistics computed from collection tables."""
    total_anime: int = 0
    total_manga: int = 0
    total_music: int = 0

    model_config = ConfigDict(populate_by_name=True)
