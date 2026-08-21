import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Tuple, Optional

from app.modules.bookings.models import Booking

class BookingRepository:
    
    @classmethod
    async def get_by_id(cls, db: AsyncSession, booking_id: uuid.UUID) -> Optional[Booking]:
        stmt = select(Booking).where(Booking.id == booking_id)
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
