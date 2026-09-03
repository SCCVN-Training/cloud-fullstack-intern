import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.transactions.models import Transaction, TransactionType


class TransactionRepository:
    @staticmethod
    async def create(db: AsyncSession, transaction: Transaction) -> Transaction:
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        return transaction

    # Idempotency check for charge_for_booking/credit_for_booking — a
    # BOOKING_PAYMENT or BOOKING_EARNING transaction is uniquely
    # identified by (reference_id, transaction_type), since the same
    # booking_id is used as reference_id for both a charge and (later,
    # separately) a credit. Used to make a retried charge/credit request
    # a no-op instead of double-charging/double-crediting.
    @staticmethod
    async def get_by_reference_id_and_type(
        db: AsyncSession,
        reference_id: str,
        transaction_type: TransactionType,
    ) -> Transaction | None:
        result = await db.execute(
            select(Transaction).where(
                Transaction.reference_id == reference_id,
                Transaction.transaction_type == transaction_type,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def count_for_wallet(db: AsyncSession, wallet_id: uuid.UUID) -> int:
        result = await db.execute(
            select(func.count(Transaction.id)).where(Transaction.wallet_id == wallet_id)
        )
        return result.scalar_one()

    @staticmethod
    async def list_for_wallet(
        db: AsyncSession,
        wallet_id: uuid.UUID,
        limit: int | None = None,
        offset: int = 0,
    ) -> list[Transaction]:
        stmt = (
            select(Transaction)
            .where(Transaction.wallet_id == wallet_id)
            .order_by(Transaction.created_at.desc())
            .offset(offset)
        )
        if limit is not None:
            stmt = stmt.limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()
