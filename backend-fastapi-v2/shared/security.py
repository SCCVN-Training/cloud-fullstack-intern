from datetime import datetime, timedelta, timezone
from typing import Optional, Union
from uuid import UUID
from jose import jwt, JWTError
from passlib.context import CryptContext
from shared.config import settings

# Password hashing context
# bcrypt is a secure, slow hashing algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============ JWT Functions ============

def create_access_token(user_id: Union[UUID, str, int]) -> str:
    """
    Create a JWT access token.

    Args:
        user_id: User ID (UUID, string, or integer)

    Returns:
        JWT token string

    Access tokens are short-lived (30 minutes by default).
    """
    # Convert UUID to string
    user_id_str = str(user_id) if isinstance(user_id, UUID) else str(user_id)

    expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    data = {
        "sub": user_id_str,      # Subject (who the token is for)
        "exp": expires,          # Expiration time
        "type": "access",        # Token type (for verification)
    }
    return jwt.encode(
        data,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm
    )


def create_refresh_token(user_id: Union[UUID, str, int]) -> str:
    """
    Create a JWT refresh token.

    Args:
        user_id: User ID (UUID, string, or integer)

    Returns:
        JWT token string

    Refresh tokens are long-lived (7 days by default).
    """
    # Convert UUID to string
    user_id_str = str(user_id) if isinstance(user_id, UUID) else str(user_id)

    expires = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    data = {
        "sub": user_id_str,
        "exp": expires,
        "type": "refresh",       # Different type for refresh tokens
    }
    return jwt.encode(
        data,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm
    )


def verify_token(token: str, token_type: str = "access") -> Optional[UUID]:
    """
    Verify a JWT token and extract the user ID as UUID.

    Args:
        token: JWT token string
        token_type: "access" or "refresh" - validates token type

    Returns:
        User ID as UUID if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm]
        )

        # Check token type matches
        if payload.get("type") != token_type:
            return None

        # Extract user ID as string
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None

        # ✅ Convert to UUID
        try:
            return UUID(user_id_str)
        except ValueError:
            # Invalid UUID format
            return None

    except JWTError:
        # Invalid token (expired, malformed, or wrong secret)
        return None


def verify_token_raw(token: str, token_type: str = "access") -> Optional[str]:
    """
    Verify JWT token and return raw string (for compatibility).

    Args:
        token: JWT token string
        token_type: "access" or "refresh"

    Returns:
        User ID as string if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm]
        )

        if payload.get("type") != token_type:
            return None

        return payload.get("sub")

    except JWTError:
        return None


def decode_token(token: str) -> Optional[dict]:
    """
    Decode JWT token without verification (for debugging).

    Args:
        token: JWT token string

    Returns:
        Token payload if valid, None otherwise
    """
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm]
        )
    except JWTError:
        return None


# ============ Password Functions ============

def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password from login request
        hashed_password: Stored hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)
