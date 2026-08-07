import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


# POST /users/{reviewee_id}/reviews
class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)


# A single review, with the reviewer's identity attached — the frontend
# needs reviewer_name/reviewer_avatar_url to render each review, which
# means the query behind this joins reviews -> profiles (see service.py).
class ReviewItem(BaseModel):
    id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewer_name: Optional[str] = None
    reviewer_avatar_url: Optional[str] = None
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# GET /users/{reviewee_id}/reviews
class ReviewSummary(BaseModel):
    total: int
    items: list[ReviewItem]
