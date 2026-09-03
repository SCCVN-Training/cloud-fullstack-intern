import uuid
from datetime import datetime, timezone

from sqlalchemy import String, UUID, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # One review per booking — the learner reviews the mentor once the
    # session is complete. unique=True enforces the ERD's zero-or-one
    # BOOKINGS--REVIEWS cardinality at the database level, not just in
    # application code.
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("bookings.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    # Cross-service references into identity-service's users table —
    # plain UUID, not a ForeignKey, same reasoning as Skill.instructor_id.
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )

    # The user being reviewed (e.g. after a teaching session)
    reviewee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )

    rating: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )

    knowledge_rating: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )

    communication_rating: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )

    video_audio_rating: Mapped[int] = mapped_column(
        Integer, 
        nullable=False
    )

    feedback: Mapped[str | None] = mapped_column(
        String(1000), 
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
