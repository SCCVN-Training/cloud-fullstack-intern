from datetime import datetime
from uuid import UUID
import uuid
from pydantic import BaseModel, Field, ConfigDict

class UserProfileCreateRequestModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: UUID = Field(alias = "userId")
    display_name: str | None = Field(default = None, alias = "displayName")


class UserProfileChangeRequestModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    display_name: str | None = Field(
        default=None,
        alias="displayName",
    )

    bio: str | None = None

    avatar_url: str | None = Field(
        default=None,
        alias="avatarUrl",
    )

    banner_url: str | None = Field(
        default=None,
        alias="bannerUrl",
    )

    profile_card_style: str | None = Field(
        default=None,
        alias="profileCardStyle",
    )

    accent_color: str | None = Field(
        default=None,
        alias="accentColor",
    )

    background_color: str | None = Field(
        default=None,
        alias="backgroundColor",
    )

    is_profile_public: bool | None = Field(
        default=None,
        alias="isProfilePublic",
    )

class UserProfileSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
    )

    user_id: UUID = Field(alias="userId")

    display_name: str = Field(alias="displayName")

    bio: str | None = None

    avatar_url: str | None = Field(
        default=None,
        alias="avatarUrl",
    )

    banner_url: str | None = Field(
        default=None,
        alias="bannerUrl",
    )

    profile_card_style: str = Field(alias="profileCardStyle")

    accent_color: str = Field(alias="accentColor")

    background_color: str = Field(alias="backgroundColor")

    is_profile_public: bool = Field(alias="isProfilePublic")

    total_anime: int = Field(alias="totalAnime")

    total_manga: int = Field(alias="totalManga")

    total_music: int = Field(alias="totalMusic")

    created_at_utc: datetime = Field(alias="createdAt")

    updated_at_utc: datetime = Field(alias="updatedAt")