from typing import Dict, Any
from fastapi import HTTPException, Request, status

from app.core.security import decode_json_web_token


async def extract_authenticated_user_payload(request: Request) -> Dict[str, Any]:
    """Dependency that verifies the access token stored in HTTP-Only cookies."""
    access_token = request.cookies.get("access_token")

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failure: Access token cookie missing.",
        )

    decoded_payload = decode_json_web_token(access_token)

    if not decoded_payload or decoded_payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failure: Access token is invalid or expired.",
        )

    return decoded_payload