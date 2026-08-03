from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from shared.database import Base


class UserProfileModel(Base):
    """Public profile information and personalization."""

    __tablename__ = "profiles"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    # ===== Basic =====

    display_name = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )

    bio = Column(
        Text,
        nullable=True,
    )

    avatar_url = Column(
        String(500),
        nullable=True,
    )

    banner_url = Column(
        String(500),
        nullable=True,
    )

    # ===== Appearance =====

    profile_card_style = Column(
        String(50),
        default="default",
        nullable=False,
    )

    accent_color = Column(
        String(7),      # #1976D2
        default="#1976D2",
        nullable=False,
    )

    background_color = Column(
        String(7),
        default="#0B0F19",
        nullable=False,
    )

    # ===== Privacy =====

    is_profile_public = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    # ===== Audit =====

    created_at_utc = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at_utc = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship(
        "UserAccountModel",
        back_populates="profile",
        uselist=False,
    )
