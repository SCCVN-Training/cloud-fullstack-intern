import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.wallets.repository import WalletRepository
from app.modules.transactions.repository import TransactionRepository
from app.modules.transactions.schema import TransactionItem, TransactionListResponse
from app.common.enums import UserRole
from app.core.exceptions import WalletNotFoundException, ForbiddenException

DEFAULT_TRANSACTION_LIMIT = 20


class TransactionService:
    # GET /users/{id}/wallet/transactions — self or admin
    @staticmethod
    async def get_transactions_for_user(
        db: AsyncSession,
        target_user_id: uuid.UUID,
        current_user: User,
        limit: int | None = DEFAULT_TRANSACTION_LIMIT,
        offset: int = 0,
    ) -> TransactionListResponse:
        if current_user.id != target_user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You are not allowed to view this wallet's transactions")

        wallet = await WalletRepository.get_by_user_id(db, target_user_id)
        if wallet is None:
            raise WalletNotFoundException("Wallet not found")

        total = await TransactionRepository.count_for_wallet(db, wallet.id)
        rows = await TransactionRepository.list_for_wallet(db, wallet.id, limit, offset)

        return TransactionListResponse(
            total=total,
            items=[TransactionItem.model_validate(t) for t in rows],
        )
