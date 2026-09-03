import uuid

from typing import Optional
from pydantic import BaseModel, Field

from app.core.storage import get_avatar_url


# GET /users/{id}/profile
# PATCH /users/{id}/profile
class ProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    # Resolved value: Profile.user_name if the user has set a display
    # name override, otherwise User.user_name (the login handle). See
    # from_model() below — this is the ONE user_name the API exposes,
    # not a raw column passthrough.
    user_name: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

    interests: list[str] = []

    # "skill learning" / "skill taught" — total + string list, computed
    # from the array columns so the frontend doesn't have to count itself
    skills_learning: list[str] = []
    skills_learning_total: int = 0
    skills_taught: list[str] = []
    skills_taught_total: int = 0

    is_onboarded: bool = False

    model_config = {
        "from_attributes": True
    }

    @classmethod
    def from_model(cls, profile, login_user_name: str) -> "ProfileResponse":
        return cls(
            id=profile.id,
            user_id=profile.user_id,
            user_name=profile.user_name or login_user_name,
            bio=profile.bio,
            # Resolves a bare S3 key into a working (presigned) URL when
            # STORAGE_BACKEND=s3 — a no-op passthrough for "local". See
            # app/core/storage.py's get_avatar_url docstring.
            avatar_url=get_avatar_url(profile.avatar_url),
            age=profile.age,
            gender=profile.gender,
            interests=profile.interests or [],
            skills_learning=profile.skills_learning or [],
            skills_learning_total=len(profile.skills_learning or []),
            skills_taught=profile.skills_taught or [],
            skills_taught_total=len(profile.skills_taught or []),
            is_onboarded=profile.is_onboarded,
        )


# PATCH /users/{id}/profile — partial update, self or admin
class ProfileUpdate(BaseModel):
    # Sets Profile.user_name (the display-name override) — NOT the
    # account's login handle. To change the login handle itself, use
    # PATCH /users/{id} (UserUpdate) instead.
    user_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)
    avatar_url: Optional[str] = Field(None, max_length=255)
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: Optional[str] = Field(None, max_length=20)
    interests: Optional[list[str]] = None
    skills_learning: Optional[list[str]] = None
    # skills_taught intentionally NOT editable here — it's derived from
    # completed teaching sessions (built later), not user-entered.
    is_onboarded: Optional[bool] = None


# GET /internal/users/{id}/public — consumed by other services
# (marketplace-service) over REST, not by the browser. Deliberately
# narrower than ProfileResponse: no email, no wallet, no anything a
# service outside identity's ownership boundary shouldn't see.
class PublicProfileResponse(BaseModel):
    user_id: uuid.UUID
    # Same resolved value as ProfileResponse.user_name (display-name
    # override if set, else login handle) — already merged server-side,
    # so consumers never need to know two underlying columns exist.
    user_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    title: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

