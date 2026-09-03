import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Tuple, Optional

from app.modules.bookings.models import Booking, BookingStatus

class BookingRepository:

    @classmethod
    async def get_by_id(cls, db: AsyncSession, booking_id: uuid.UUID) -> Optional[Booking]:
        stmt = select(Booking).where(Booking.id == booking_id)
        result = await db.execute(stmt)
        return result.scalars().first()

    # Basic overlap check: exact match on (mentor_id, session_date) among
    # non-cancelled bookings. Sessions are a fixed 45-minute slot chosen
    # from a small set of start times (see the frontend's booking-session
    # page), so an exact-datetime match is sufficient here — this doesn't
    # need to be a general interval-overlap algorithm.
    @classmethod
    async def get_conflicting(
        cls, db: AsyncSession, mentor_id: uuid.UUID, session_date: datetime
    ) -> Optional[Booking]:
        stmt = select(Booking).where(
            Booking.mentor_id == mentor_id,
            Booking.session_date == session_date,
            Booking.status != BookingStatus.CANCELLED,
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    @classmethod
    async def get_by_learner(
        cls, 
        db: AsyncSession, 
        learner_id: uuid.UUID,
        skip: int = 0, 
        limit: int = 20
    ) -> Tuple[int, List[Booking]]:
        
        stmt = select(Booking).where(Booking.learner_id == learner_id).order_by(Booking.created_at.desc())
        count_stmt = select(func.count()).select_from(Booking).where(Booking.learner_id == learner_id)
        
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        bookings = result.scalars().all()
        
        return total, list(bookings)

    @classmethod
    async def get_by_mentor(
        cls, 
        db: AsyncSession, 
        mentor_id: uuid.UUID,
        skip: int = 0, 
        limit: int = 20
    ) -> Tuple[int, List[Booking]]:
        
        stmt = select(Booking).where(Booking.mentor_id == mentor_id).order_by(Booking.created_at.desc())
        count_stmt = select(func.count()).select_from(Booking).where(Booking.mentor_id == mentor_id)
        
        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0
        
        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        bookings = result.scalars().all()
        
        return total, list(bookings)

    # Admin-only — every booking in the system, not scoped to a single
    # learner/mentor. See get_by_learner/get_by_mentor above for the
    # scoped equivalents regular users hit via GET /bookings/me.
    @classmethod
    async def get_all(
        cls,
        db: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        status: Optional[BookingStatus] = None,
    ) -> Tuple[int, List[Booking]]:
        stmt = select(Booking)
        count_stmt = select(func.count()).select_from(Booking)

        if status is not None:
            stmt = stmt.where(Booking.status == status)
            count_stmt = count_stmt.where(Booking.status == status)

        stmt = stmt.order_by(Booking.created_at.desc())

        total_result = await db.execute(count_stmt)
        total = total_result.scalar() or 0

        stmt = stmt.offset(skip).limit(limit)
        result = await db.execute(stmt)
        bookings = result.scalars().all()

        return total, list(bookings)

    @classmethod
    async def create(cls, db: AsyncSession, booking: Booking) -> Booking:
        db.add(booking)
        await db.commit()
        await db.refresh(booking)
        return booking

    @classmethod
    async def update(cls, db: AsyncSession, booking: Booking) -> Booking:
        await db.commit()
        await db.refresh(booking)
        return booking
