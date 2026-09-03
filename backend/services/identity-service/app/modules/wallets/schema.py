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


# POST /internal/wallets/charge and /internal/wallets/credit — called by
# marketplace-service (via IdentityClient), never the browser. Shared
# shape for both: the endpoint decides whether it's a debit or credit,
# not the request body.
class WalletTransactionRequest(BaseModel):
    user_id: uuid.UUID
    amount: int = Field(..., gt=0)
    booking_id: uuid.UUID
