import logging
import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.modules.bookings.models import Booking, BookingStatus
from app.modules.bookings.schema import BookingCreate, BookingResponse, BookingListResponse, BookingStatusUpdate
from app.modules.bookings.repository import BookingRepository
from app.modules.skills.repository import SkillRepository
from app.core.dependencies import CurrentUser
from app.core.exceptions import BookingOverlapException
from app.clients.identity_client import IdentityClient, BookingPaymentError

logger = logging.getLogger(__name__)


class BookingService:

    @classmethod
    async def _format_booking_response(
        cls, db: AsyncSession, booking: Booking, credit_status: Optional[str] = None
    ) -> BookingResponse:
        # skill stays a local repository lookup (same service/schema).
        # learner/mentor names are cross-service display data — same
        # IdentityClient call skills/service.py uses; see its docstring
        # for the "identity-service is down" trade-off.
        skill = await SkillRepository.get_by_id(db, booking.skill_id)
        learner = await IdentityClient.get_public_profile(booking.learner_id)
        mentor = await IdentityClient.get_public_profile(booking.mentor_id)

        booking_dict = {
            c.name: getattr(booking, c.name) for c in booking.__table__.columns
        }
        booking_dict["id"] = str(booking.id)
        booking_dict["skill_id"] = str(booking.skill_id)
        booking_dict["learner_id"] = str(booking.learner_id)
        booking_dict["mentor_id"] = str(booking.mentor_id)

        booking_dict["skill_title"] = skill.title if skill else "Unknown Skill"
        booking_dict["learner_name"] = learner["user_name"]
        booking_dict["mentor_name"] = mentor["user_name"]
        # Not a DB column — only set by update_status() right after a
        # COMPLETED transition, never persisted.
        booking_dict["credit_status"] = credit_status

        return BookingResponse(**booking_dict)

    @classmethod
    async def get_booking_by_id(cls, db: AsyncSession, booking_id: uuid.UUID, current_user: CurrentUser) -> BookingResponse:
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
        current_user: CurrentUser,
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

    # Admin-only — powers the admin booking-management page, which needs
    # to see every booking, not just the caller's own (unlike /bookings/me).
    @classmethod
    async def get_all_bookings(
        cls,
        db: AsyncSession,
        current_user: CurrentUser,
        skip: int = 0,
        limit: int = 20,
        status: Optional[BookingStatus] = None,
    ) -> BookingListResponse:
        if current_user.role.value != "ADMIN":
            raise HTTPException(status_code=403, detail="Not enough permissions")

        total, bookings = await BookingRepository.get_all(db, skip, limit, status)

        response_bookings = []
        for booking in bookings:
            response_bookings.append(await cls._format_booking_response(db, booking))

        return BookingListResponse(total=total, bookings=response_bookings)

    @classmethod
    async def create_booking(
        cls,
        db: AsyncSession,
        booking_in: BookingCreate,
        current_user: CurrentUser
    ) -> BookingResponse:

        skill = await SkillRepository.get_by_id(db, booking_in.skill_id)
        if not skill:
            raise HTTPException(status_code=404, detail="Skill not found")

        if skill.instructor_id == current_user.id:
            raise HTTPException(status_code=400, detail="You cannot book your own skill")

        conflict = await BookingRepository.get_conflicting(
            db, skill.instructor_id, booking_in.session_date
        )
        if conflict is not None:
            raise BookingOverlapException(
                "This mentor already has a booking at that date and time"
            )

        # Charge BEFORE inserting the booking row, using a client-generated
        # id so the charge's reference_id already matches the booking
        # that's about to exist. This means there's never a window where
        # a PENDING booking exists without a real charge behind it — the
        # alternative (insert first, charge after, delete on failure)
        # would need a compensating delete; this doesn't.
        #
        # charge_for_booking is idempotent on booking_id (see
        # WalletService), so if this request is retried after the charge
        # already succeeded but the client never saw the response, the
        # retry charges nothing extra.
        booking_id = uuid.uuid4()
        try:
            await IdentityClient.charge_booking(current_user.id, skill.price, booking_id)
        except BookingPaymentError as exc:
            raise HTTPException(status_code=exc.status_code, detail=exc.detail)

        new_booking = Booking(
            id=booking_id,
            skill_id=skill.id,
            learner_id=current_user.id,
            mentor_id=skill.instructor_id,
            session_date=booking_in.session_date,
            session_notes=booking_in.session_notes,
            status=BookingStatus.PENDING,
            price_paid=skill.price
        )

        try:
            created_booking = await BookingRepository.create(db, new_booking)
        except Exception as exc:
            # The learner has genuinely been charged at this point — no
            # refund mechanism exists (out of scope), so this must be
            # loud and traceable rather than silently losing the money.
            # See the credit-failure handling in update_status() below
            # for the same "visibility over automation" reasoning.
            logger.error(
                "Charged %s %d for booking %s but booking insert failed: %s",
                current_user.id, skill.price, booking_id, exc,
            )
            raise HTTPException(
                status_code=500,
                detail="Payment succeeded but the booking could not be created. Please contact support.",
            )

        return await cls._format_booking_response(db, created_booking)
        
    @classmethod
    async def update_status(
        cls, 
        db: AsyncSession, 
        booking_id: uuid.UUID,
        status_update: BookingStatusUpdate,
        current_user: CurrentUser
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

        # Booking completion itself never fails because of a wallet
        # issue — the session already happened, so the booking's status
        # must reflect that regardless of whether the payout succeeds.
        # credit_for_booking is idempotent on booking_id, so a retried
        # PATCH to COMPLETED (or this code running twice for any reason)
        # never double-credits.
        credit_status: Optional[str] = None
        if status_update.status == BookingStatus.COMPLETED:
            try:
                await IdentityClient.credit_booking(
                    updated_booking.mentor_id, updated_booking.price_paid, updated_booking.id
                )
                credit_status = "CREDITED"
            except BookingPaymentError as exc:
                logger.error(
                    "Failed to credit mentor %s %d for booking %s: %s",
                    updated_booking.mentor_id, updated_booking.price_paid, updated_booking.id, exc.detail,
                )
                credit_status = "FAILED"

        return await cls._format_booking_response(db, updated_booking, credit_status=credit_status)
