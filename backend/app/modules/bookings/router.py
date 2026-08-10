import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.bookings.schema import BookingCreate, BookingResponse, BookingListResponse, BookingStatusUpdate
from app.modules.bookings.service import BookingService

router = APIRouter(prefix="/bookings", tags=["Bookings"])

@router.get("/me", response_model=BookingListResponse, status_code=status.HTTP_200_OK)
async def list_my_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    as_mentor: bool = Query(False, description="Set to true to view bookings where you are the mentor"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingListResponse:
    """Get a list of bookings for the current user."""
    return await BookingService.get_my_bookings(
        db=db, 
        current_user=current_user,
        skip=skip, 
        limit=limit, 
        as_mentor=as_mentor
    )

@router.get("/{booking_id}", response_model=BookingResponse, status_code=status.HTTP_200_OK)
async def get_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    """Get detailed information about a specific booking."""
    return await BookingService.get_booking_by_id(db, booking_id, current_user)

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    """Book a new session."""
    return await BookingService.create_booking(db, booking, current_user)

@router.patch("/{booking_id}/status", response_model=BookingResponse, status_code=status.HTTP_200_OK)
async def update_booking_status(
    booking_id: uuid.UUID,
    status_update: BookingStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingResponse:
    """Update the status of a booking (e.g. Mentor confirming or Learner cancelling)."""
    return await BookingService.update_status(db, booking_id, status_update, current_user)
