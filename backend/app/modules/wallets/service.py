import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.models import User
from app.modules.wallets.models import Wallet
from app.modules.wallets.repository import WalletRepository
from app.modules.wallets.schema import WalletResponse, TopUpRequest
from app.modules.transactions.models import Transaction, TransactionType
from app.modules.transactions.repository import TransactionRepository
from app.common.enums import UserRole
from app.core.exceptions import (
    WalletNotFoundException,
    InsufficientBalanceException,
    ForbiddenException,
)


class WalletService:
    # Called from AuthService right after a new user registers — mirrors
    # ProfileService.create_default_profile, so every user always has
    # exactly one wallet and GET never 404s unexpectedly.
    @staticmethod
    async def create_default_wallet(db: AsyncSession, user_id: uuid.UUID) -> Wallet:
        wallet = Wallet(user_id=user_id, balance=0)
        return await WalletRepository.create(db, wallet)

    # GET /users/{id}/wallet — self or admin
    @staticmethod
    async def get_wallet(
        db: AsyncSession,
        target_user_id: uuid.UUID,
        current_user: User,
    ) -> WalletResponse:
        WalletService._ensure_self_or_admin(current_user, target_user_id)

        wallet = await WalletRepository.get_by_user_id(db, target_user_id)
        if wallet is None:
            raise WalletNotFoundException("Wallet not found")

        return WalletResponse.model_validate(wallet)

    # POST /users/{id}/wallet/topup — self only
    @staticmethod
    async def top_up(
        db: AsyncSession,
        target_user_id: uuid.UUID,
        request: TopUpRequest,
        current_user: User,
    ) -> WalletResponse:
        if current_user.id != target_user_id:
            raise ForbiddenException("You can only top up your own wallet")

        wallet = await WalletRepository.get_by_user_id(db, target_user_id)
        if wallet is None:
            raise WalletNotFoundException("Wallet not found")

        await TransactionRepository.create(
            db,
            Transaction(
                wallet_id=wallet.id,
                amount=request.amount,
                transaction_type=TransactionType.SYSTEM_TOP_UP,
                description=request.description,
                reference_id=None,
            ),
        )
        wallet = await WalletRepository.apply_delta(db, wallet, request.amount)

        return WalletResponse.model_validate(wallet)

    # Internal — call from BookingService when a booking is created/paid
    # for. Debits the learner's wallet. Raises InsufficientBalanceException
    # if they can't cover it; callers should treat that as "booking
    # creation failed", not silently let the booking through unpaid.
    @staticmethod
    async def charge_for_booking(
        db: AsyncSession,
        learner_user_id: uuid.UUID,
        amount: int,
        booking_id: uuid.UUID,
    ) -> None:
        wallet = await WalletRepository.get_by_user_id(db, learner_user_id)
        if wallet is None:
            raise WalletNotFoundException("Learner has no wallet")

        if wallet.balance < amount:
            raise InsufficientBalanceException(
                f"Insufficient balance: wallet has {wallet.balance}, booking costs {amount}"
            )

        await TransactionRepository.create(
            db,
            Transaction(
                wallet_id=wallet.id,
                amount=-amount,
                transaction_type=TransactionType.BOOKING_PAYMENT,
                description="Booking payment",
                reference_id=str(booking_id),
            ),
        )
        await WalletRepository.apply_delta(db, wallet, -amount)

    # Internal — call from BookingService when a booking is marked
    # COMPLETED. Credits the mentor's wallet.
    @staticmethod
    async def credit_for_booking(
        db: AsyncSession,
        mentor_user_id: uuid.UUID,
        amount: int,
        booking_id: uuid.UUID,
    ) -> None:
        wallet = await WalletRepository.get_by_user_id(db, mentor_user_id)
        if wallet is None:
            raise WalletNotFoundException("Mentor has no wallet")

        await TransactionRepository.create(
            db,
            Transaction(
                wallet_id=wallet.id,
                amount=amount,
                transaction_type=TransactionType.BOOKING_EARNING,
                description="Booking earning",
                reference_id=str(booking_id),
            ),
        )
        await WalletRepository.apply_delta(db, wallet, amount)

    @staticmethod
    def _ensure_self_or_admin(current_user: User, target_user_id: uuid.UUID) -> None:
        if current_user.id != target_user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You are not allowed to access this wallet")
