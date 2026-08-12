from fastapi import APIRouter, Depends

from app.core.api_key import get_training_api_key

router = APIRouter(
    prefix="/training",
    tags=["Training Placeholder"]
)

@router.get("/protected", dependencies=[Depends(get_training_api_key)])
async def protected_training_route():
    return {
        "message": "Access Granted!",
        "details": "You have successfully accessed the training endpoint using the API Key placeholder.",
        "path": "Training Phase"
    }