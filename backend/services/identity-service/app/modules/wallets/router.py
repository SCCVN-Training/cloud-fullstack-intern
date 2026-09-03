import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.wallets.service import WalletService
from app.modules.wallets.schema import WalletResponse, TopUpRequest, WalletTransactionRequest

router = APIRouter(prefix="/users/{user_id}/wallet", tags=["Wallets"])

# Separate router, no auth dependency — same trust-boundary pattern as
# profiles/router.py's internal_router: meant to be called
# service-to-service (marketplace-service -> identity-service) on the
# private network, not from the browser.
internal_router = APIRouter(prefix="/internal/wallets", tags=["Internal"])


# GET WALLET (self or admin)
@router.get("", response_model=WalletResponse, status_code=status.HTTP_200_OK)
async def get_wallet(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await WalletService.get_wallet(db, user_id, current_user)


# TOP UP (self only — stands in for a real payment provider)
@router.post("/topup", response_model=WalletResponse, status_code=status.HTTP_200_OK)
async def top_up_wallet(
    user_id: uuid.UUID,
    request: TopUpRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await WalletService.top_up(db, user_id, request, current_user)


# INTERNAL — debit the learner's wallet for a booking. Called by
# marketplace-service's IdentityClient.charge_booking(). Raises (via
# WalletService, mapped by the global exception handlers)
# InsufficientBalanceException -> 422 or WalletNotFoundException -> 404
# on failure — the caller must treat either as "booking creation failed".
@internal_router.post("/charge", response_model=WalletResponse, status_code=status.HTTP_200_OK)
async def charge_wallet(
    request: WalletTransactionRequest,
    db: AsyncSession = Depends(get_db),
):
    return await WalletService.charge_for_booking(
        db, request.user_id, request.amount, request.booking_id
    )


# INTERNAL — credit the mentor's wallet when a booking completes. Called
# by marketplace-service's IdentityClient.credit_booking().
@internal_router.post("/credit", response_model=WalletResponse, status_code=status.HTTP_200_OK)
async def credit_wallet(
    request: WalletTransactionRequest,
    db: AsyncSession = Depends(get_db),
):
    return await WalletService.credit_for_booking(
        db, request.user_id, request.amount, request.booking_id
    )
