import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.wallets.service import WalletService
from app.modules.wallets.schema import WalletResponse, TopUpRequest

router = APIRouter(prefix="/users/{user_id}/wallet", tags=["Wallets"])


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
