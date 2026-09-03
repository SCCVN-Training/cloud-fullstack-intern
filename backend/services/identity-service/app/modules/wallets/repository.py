import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.wallets.models import Wallet


class WalletRepository:
    @staticmethod
    async def get_by_user_id(db: AsyncSession, user_id: uuid.UUID) -> Wallet | None:
        result = await db.execute(select(Wallet).where(Wallet.user_id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, wallet: Wallet) -> Wallet:
        db.add(wallet)
        await db.commit()
        await db.refresh(wallet)
        return wallet

    # Balance changes always go through here, never a bare attribute set
    # in a service — keeps "how a balance is persisted" in one place.
    @staticmethod
    async def apply_delta(db: AsyncSession, wallet: Wallet, delta: int) -> Wallet:
        wallet.balance += delta
        await db.commit()
        await db.refresh(wallet)
        return wallet
