from fastapi import APIrouter

router = APIrouter(
    prefix="/users",
    tags=["Users"]
)