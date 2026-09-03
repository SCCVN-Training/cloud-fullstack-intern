import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, UUID, Boolean, Integer, Float, Text, ForeignKey, ARRAY, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base

class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image: Mapped[str] = mapped_column(String(255), nullable=False)
    
    price: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    level: Mapped[str] = mapped_column(String(50), nullable=False)
    requirements: Mapped[str] = mapped_column(Text, nullable=False)
    
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    
    # Cross-service reference to identity-service's users table. This
    # CANNOT be a real ForeignKey anymore — that table lives in a
    # different schema/database now, and Postgres can't enforce FK
    # constraints across separate databases (and, more fundamentally,
    # separate services shouldn't share DB-level constraints — that's a
    # backdoor coupling). Referential integrity here becomes an
    # application-level concern: identity-service is the source of
    # truth for "does this user exist", and this service trusts the
    # instructor_id it's given (validated at write time in the service
    # layer, not by the database).
    instructor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    
    available_slots: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str] = mapped_column(String(50), default="English")
    
    tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String).with_variant(JSON(), "sqlite"), default=list)
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Optional fields mapped to JSON/Text for simplicity
    about_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    learning_outcomes: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String).with_variant(JSON(), "sqlite"), nullable=True)
    prerequisites: Mapped[Optional[List[str]]] = mapped_column(ARRAY(String).with_variant(JSON(), "sqlite"), nullable=True)
