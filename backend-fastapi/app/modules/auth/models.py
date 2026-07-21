import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import BaseDeclarativeModel


class UserAccountModel(BaseDeclarativeModel):
    """SQLAlchemy model representing a user in Neon PostgreSQL."""

    __tablename__ = "user_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active_account = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(255), nullable=True)
    created_at_utc = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )