import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.transactions.models import Transaction


class TransactionRepository:
    @staticmethod
    async def create(db: AsyncSession, transaction: Transaction) -> Transaction:
        db.add(transaction)
        await db.commit()
        await db.refresh(transaction)
        return transaction

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
