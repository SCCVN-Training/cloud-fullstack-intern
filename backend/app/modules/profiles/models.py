import uuid

from sqlalchemy import String, UUID, Integer, ForeignKey, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # One-to-one with User — unique enforces at most one profile per user
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    full_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Simple array columns — good enough for training scope.
    # A normalized skills/interests + join-table design is the
    # "correct" relational approach but is out of scope for now.
    interests: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    skills_learning: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    skills_taught: Mapped[list[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )

    # True once the user has submitted the onboarding form (full_name, age,
    # gender, interests, skills_learning). Drives the frontend's
    # login -> onboarding vs. login -> homepage branch. Explicit flag
    # instead of inferring from empty fields, so clearing a field later
    # doesn't accidentally re-trigger onboarding.
    is_onboarded: Mapped[bool] = mapped_column(
        default=False, nullable=False
    )
