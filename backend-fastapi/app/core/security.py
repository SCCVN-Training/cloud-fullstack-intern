from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import app_settings

# Password context manager
password_crypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_raw_password(raw_password: str) -> str:
    """Hashes a plain text password using Bcrypt."""
    return password_crypt_context.hash(raw_password)


def verify_password_hash(
    plain_password: str, hashed_password: str
) -> bool:
    """Verifies a plain text password against a stored hash."""
    return password_crypt_context.verify(plain_password, hashed_password)


def generate_json_web_token(
    payload_claims: Dict[str, Any], token_lifespan: timedelta
) -> str:
    """Encodes arbitrary claims into a signed JWT."""
    claims_to_encode = payload_claims.copy()
    expiration_timestamp = datetime.now(timezone.utc) + token_lifespan
    claims_to_encode.update({"exp": expiration_timestamp})

    return jwt.encode(
        claims_to_encode,
        app_settings.JWT_SECRET_KEY,
        algorithm=app_settings.JWT_ALGORITHM,
    )


def decode_json_web_token(encoded_token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT signature and expiration time."""
    try:
        decoded_payload = jwt.decode(
            encoded_token,
            app_settings.JWT_SECRET_KEY,
            algorithms=[app_settings.JWT_ALGORITHM],
        )
        return decoded_payload
    except JWTError:
        return None