import enum
import uuid
from datetime import datetime

from sqlalchemy import UUID, Integer, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class TransactionType(str, enum.Enum):
    SYSTEM_TOP_UP = "SYSTEM_TOP_UP"
    BOOKING_PAYMENT = "BOOKING_PAYMENT"   # learner pays for a booking (debit)
    BOOKING_EARNING = "BOOKING_EARNING"   # mentor earns from a booking (credit)


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # No Python-level relationship/import back to wallets.models — kept
    # as a plain FK string so the two modules don't need to import each
    # other's models, only wallets/service.py imports this module.
    wallet_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False
    )

    # Positive for credits (top-up, booking earning), negative for debits
    # (booking payment) — lets balance = sum(amount) with no sign lookup.
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)

    # Free-form pointer to whatever caused this transaction — e.g. a
    # booking id when transaction_type is BOOKING_PAYMENT/BOOKING_EARNING.
    # Kept as a plain string (not a real FK) since it can point at
    # different tables depending on transaction_type.
    reference_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
