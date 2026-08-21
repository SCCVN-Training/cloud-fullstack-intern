import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# POST /bookings/{booking_id}/reviews
class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    knowledge_rating: int = Field(..., ge=1, le=5)
    communication_rating: int = Field(..., ge=1, le=5)
    video_audio_rating: int = Field(..., ge=1, le=5)
    feedback: Optional[str] = Field(None, max_length=1000)

# A single review, with the reviewer's identity attached — the frontend
# needs reviewer_name/reviewer_avatar_url to render each review, which
# means the query behind this joins reviews -> users -> profiles (see service.py/repository.py).
class ReviewItem(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewer_name: Optional[str] = None
    reviewer_avatar_url: Optional[str] = None
    rating: int
    knowledge_rating: int
    communication_rating: int
    video_audio_rating: int
    feedback: Optional[str] = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# GET /users/{reviewee_id}/reviews
class ReviewSummary(BaseModel):
    total: int
    items: list[ReviewItem]
