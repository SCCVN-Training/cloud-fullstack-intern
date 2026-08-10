import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.bookings.models import Booking, BookingStatus
from app.modules.bookings.schema import BookingCreate, BookingResponse, BookingListResponse, BookingStatusUpdate
from app.modules.bookings.repository import BookingRepository
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.skills.repository import SkillRepository
from app.modules.profiles.repository import ProfileRepository

class BookingService:
    
    @classmethod
    async def _format_booking_response(cls, db: AsyncSession, booking: Booking) -> BookingResponse:
        # Fetch related data for convenience in the frontend
        skill = await SkillRepository.get_by_id(db, booking.skill_id)
        learner_profile = await ProfileRepository.get_by_user_id(db, booking.learner_id)
        mentor_profile = await ProfileRepository.get_by_user_id(db, booking.mentor_id)
        
        learner_name = learner_profile.full_name if learner_profile else "Unknown Learner"
        mentor_name = mentor_profile.full_name if mentor_profile else "Unknown Mentor"
        skill_title = skill.title if skill else "Unknown Skill"
        
        booking_dict = {
            c.name: getattr(booking, c.name) for c in booking.__table__.columns
        }
        booking_dict["id"] = str(booking.id)
        booking_dict["skill_id"] = str(booking.skill_id)
        booking_dict["learner_id"] = str(booking.learner_id)
        booking_dict["mentor_id"] = str(booking.mentor_id)
        
        booking_dict["skill_title"] = skill_title
        booking_dict["learner_name"] = learner_name
        booking_dict["mentor_name"] = mentor_name
        
        return BookingResponse(**booking_dict)

    @classmethod
    async def get_booking_by_id(cls, db: AsyncSession, booking_id: uuid.UUID, current_user: User) -> BookingResponse:
        booking = await BookingRepository.get_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        # Only learner, mentor, or admin can view the booking
        if booking.learner_id != current_user.id and booking.mentor_id != current_user.id and current_user.role.value != "ADMIN":
            raise HTTPException(status_code=403, detail="Not enough permissions")
            
        return await cls._format_booking_response(db, booking)

    @classmethod
    async def get_my_bookings(
        cls, 
        db: AsyncSession, 
        current_user: User,
        skip: int = 0, 
        limit: int = 20,
        as_mentor: bool = False
    ) -> BookingListResponse:
        
        if as_mentor:
            total, bookings = await BookingRepository.get_by_mentor(db, current_user.id, skip, limit)
        else:
            total, bookings = await BookingRepository.get_by_learner(db, current_user.id, skip, limit)
            
        response_bookings = []
        for booking in bookings:
            response_bookings.append(await cls._format_booking_response(db, booking))
            
        return BookingListResponse(total=total, bookings=response_bookings)

    @classmethod
    async def create_booking(
        cls, 
        db: AsyncSession, 
        booking_in: BookingCreate, 
        current_user: User
    ) -> BookingResponse:
        
        skill = await SkillRepository.get_by_id(db, booking_in.skill_id)
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")
            
        if skill.instructor_id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot book your own skill")
            
        new_booking = Booking(
            skill_id=skill.id,
            learner_id=current_user.id,
            mentor_id=skill.instructor_id,
            session_date=booking_in.session_date,
            session_notes=booking_in.session_notes,
            status=BookingStatus.PENDING,
            price_paid=skill.price
        )
        
        created_booking = await BookingRepository.create(db, new_booking)
        return await cls._format_booking_response(db, created_booking)
        
    @classmethod
    async def update_status(
        cls, 
        db: AsyncSession, 
        booking_id: uuid.UUID,
        status_update: BookingStatusUpdate,
        current_user: User
    ) -> BookingResponse:
        
        booking = await BookingRepository.get_by_id(db, booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
            
        # Only mentor or admin can confirm/complete
        if status_update.status in [BookingStatus.CONFIRMED, BookingStatus.COMPLETED]:
            if booking.mentor_id != current_user.id and current_user.role.value != "ADMIN":
                raise HTTPException(status_code=403, detail="Only mentor can confirm or complete bookings")
                
        # Learner or mentor can cancel
        if status_update.status == BookingStatus.CANCELLED:
            if booking.learner_id != current_user.id and booking.mentor_id != current_user.id and current_user.role.value != "ADMIN":
                raise HTTPException(status_code=403, detail="Not enough permissions to cancel")
                
        booking.status = status_update.status
        updated_booking = await BookingRepository.update(db, booking)
        
        return await cls._format_booking_response(db, updated_booking)
