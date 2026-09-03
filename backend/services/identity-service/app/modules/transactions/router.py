import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.users.models import User
from app.modules.transactions.service import TransactionService
from app.modules.transactions.schema import TransactionListResponse

# Nested under the wallet, not its own top-level resource — a transaction
# only ever makes sense in the context of one wallet's history.
router = APIRouter(prefix="/users/{user_id}/wallet/transactions", tags=["Transactions"])


# GET TRANSACTION HISTORY (self or admin)
@router.get("", response_model=TransactionListResponse, status_code=status.HTTP_200_OK)
async def get_transactions(
    user_id: uuid.UUID,
    limit: int | None = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TransactionService.get_transactions_for_user(db, user_id, current_user, limit, offset)
