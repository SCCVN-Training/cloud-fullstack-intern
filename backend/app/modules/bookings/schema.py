import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from app.modules.bookings.models import BookingStatus


class BookingCreate(BaseModel):
    skill_id: uuid.UUID
    session_date: datetime
    session_notes: str | None = None
    
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
    session_notes: str | None = None
    status: BookingStatus
    price_paid: int
    created_at: datetime
    updated_at: datetime
    
    # Extra fields for frontend convenience (populated by service)
    skill_title: str | None = None
    learner_name: str | None = None
    mentor_name: str | None = None

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )

class BookingListResponse(BaseModel):
    total: int
    bookings: list[BookingResponse]

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
