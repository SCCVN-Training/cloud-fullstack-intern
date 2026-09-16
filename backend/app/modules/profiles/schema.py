import uuid

from pydantic import BaseModel, Field


# GET /users/{id}/profile
# PATCH /users/{id}/profile
class ProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_name: str
    bio: str | None = None
    avatar_url: str | None = None
    age: int | None = None
    gender: str | None = None

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
    def from_model(cls, profile, user_name: str) -> "ProfileResponse":
        return cls(
            id=profile.id,
            user_id=profile.user_id,
            user_name=user_name,
            bio=profile.bio,
            avatar_url=profile.avatar_url,
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
    bio: str | None = Field(None, max_length=500)
    avatar_url: str | None = Field(None, max_length=255)
    age: int | None = Field(None, ge=0, le=150)
    gender: str | None = Field(None, max_length=20)
    interests: list[str] | None = None
    skills_learning: list[str] | None = None
    # skills_taught intentionally NOT editable here — it's derived from
    # completed teaching sessions (built later), not user-entered.
    is_onboarded: bool | None = None

