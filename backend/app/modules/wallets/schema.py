import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# GET /users/{id}/wallet
class WalletResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    balance: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# POST /users/{id}/wallet/topup — a stand-in for a real payment provider.
# Only creates a SYSTEM_TOP_UP transaction; BOOKING_PAYMENT/BOOKING_EARNING
# are created internally by WalletService, never from a request body.
class TopUpRequest(BaseModel):
    amount: int = Field(..., gt=0, le=100_000, description="Amount to add, in the app's smallest currency unit")
    description: str = Field(default="Wallet top-up", max_length=255)
