import uuid
from typing import Optional

from sqlalchemy import String, UUID, Integer, ForeignKey, ARRAY, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False
    )

    bio: Mapped[str | None] = mapped_column(String(500), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # ARRAY on Postgres, JSON on SQLite (test DB) — same Python-side behavior
    interests: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String).with_variant(JSON(), "sqlite"), nullable=False, default=list
    )
    skills_learning: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String).with_variant(JSON(), "sqlite"), nullable=False, default=list
    )
    skills_taught: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String).with_variant(JSON(), "sqlite"), nullable=False, default=list
    )

    is_onboarded: Mapped[bool] = mapped_column(default=False, nullable=False)