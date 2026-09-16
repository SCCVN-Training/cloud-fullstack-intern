import uuid
from datetime import datetime

from pydantic import BaseModel

from app.modules.transactions.models import TransactionType


class TransactionItem(BaseModel):
    id: uuid.UUID
    wallet_id: uuid.UUID
    amount: int
    transaction_type: TransactionType
    description: str
    reference_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# GET /users/{id}/wallet/transactions
class TransactionListResponse(BaseModel):
    total: int
    items: list[TransactionItem]
