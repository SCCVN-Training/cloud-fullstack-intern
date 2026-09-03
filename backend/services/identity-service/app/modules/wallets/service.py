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
    #
    # Starts at 0 and is immediately topped up via a SYSTEM_TOP_UP
    # transaction (same as a self-service top-up) rather than being
    # created with balance=100 directly, so the welcome bonus shows up
    # in the transaction ledger like any other balance change.
    WELCOME_BONUS = 100

    @staticmethod
    async def create_default_wallet(db: AsyncSession, user_id: uuid.UUID) -> Wallet:
        wallet = Wallet(user_id=user_id, balance=0)
        wallet = await WalletRepository.create(db, wallet)

        await TransactionRepository.create(
            db,
            Transaction(
                wallet_id=wallet.id,
                amount=WalletService.WELCOME_BONUS,
                transaction_type=TransactionType.SYSTEM_TOP_UP,
                description="Welcome bonus",
                reference_id=None,
            ),
        )
        return await WalletRepository.apply_delta(db, wallet, WalletService.WELCOME_BONUS)

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
    #
    # Idempotent on booking_id: if a BOOKING_PAYMENT transaction already
    # exists for this booking, this is a no-op that just returns the
    # current wallet — protects against a retried request (e.g. the
    # caller's HTTP request succeeded server-side but timed out
    # client-side, and the client retries) double-charging the learner.
    @staticmethod
    async def charge_for_booking(
        db: AsyncSession,
        learner_user_id: uuid.UUID,
        amount: int,
        booking_id: uuid.UUID,
    ) -> WalletResponse:
        wallet = await WalletRepository.get_by_user_id(db, learner_user_id)
        if wallet is None:
            raise WalletNotFoundException("Learner has no wallet")

        existing = await TransactionRepository.get_by_reference_id_and_type(
            db, str(booking_id), TransactionType.BOOKING_PAYMENT
        )
        if existing is not None:
            return WalletResponse.model_validate(wallet)

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
        wallet = await WalletRepository.apply_delta(db, wallet, -amount)
        return WalletResponse.model_validate(wallet)

    # Internal — call from BookingService when a booking is marked
    # COMPLETED. Credits the mentor's wallet. Idempotent on booking_id,
    # same reasoning as charge_for_booking above.
    @staticmethod
    async def credit_for_booking(
        db: AsyncSession,
        mentor_user_id: uuid.UUID,
        amount: int,
        booking_id: uuid.UUID,
    ) -> WalletResponse:
        wallet = await WalletRepository.get_by_user_id(db, mentor_user_id)
        if wallet is None:
            raise WalletNotFoundException("Mentor has no wallet")

        existing = await TransactionRepository.get_by_reference_id_and_type(
            db, str(booking_id), TransactionType.BOOKING_EARNING
        )
        if existing is not None:
            return WalletResponse.model_validate(wallet)

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
        wallet = await WalletRepository.apply_delta(db, wallet, amount)
        return WalletResponse.model_validate(wallet)

    @staticmethod
    def _ensure_self_or_admin(current_user: User, target_user_id: uuid.UUID) -> None:
        if current_user.id != target_user_id and current_user.role != UserRole.ADMIN:
            raise ForbiddenException("You are not allowed to access this wallet")
