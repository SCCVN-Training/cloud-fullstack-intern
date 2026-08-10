import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

from app.modules.bookings.models import BookingStatus

class BookingCreate(BaseModel):
    skill_id: uuid.UUID
    session_date: datetime
    session_notes: Optional[str] = None
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )

class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )

class BookingResponse(BaseModel):
    id: str
    skill_id: str
    learner_id: str
    mentor_id: str
    session_date: datetime
    session_notes: Optional[str] = None
    status: BookingStatus
    price_paid: int
    created_at: datetime
    updated_at: datetime
    
    # Extra fields for frontend convenience (populated by service)
    skill_title: Optional[str] = None
    learner_name: Optional[str] = None
    mentor_name: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )

class BookingListResponse(BaseModel):
    total: int
    bookings: List[BookingResponse]

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
