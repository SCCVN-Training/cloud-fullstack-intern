"""
Shared library for all modules.
"""

from .config import settings
from .database import (
    # PostgreSQL
    get_db,
    init_db,
    close_db,
    Base,
    neon_async_engine,
    # MongoDB
    get_mongo_db,
    init_mongo,
    close_mongo,
    mongodb_client,
    mongodb_database,
    is_mongo_connected,
)
from .security import (
    create_access_token,
    create_refresh_token,
    verify_token,
    verify_token_raw,
    decode_token,
    get_password_hash,
    verify_password,
)
from .repositories import BaseRepository
from .utils import get_logger
from .rate_limiter import BaseRateLimiter, get_rate_limiter

__all__ = [
    # Config
    "settings",

    # PostgreSQL
    "get_db",
    "init_db",
    "close_db",
    "Base",
    "neon_async_engine",

    # MongoDB
    "get_mongo_db",
    "init_mongo",
    "close_mongo",
    "mongodb_client",
    "mongodb_database",
    "is_mongo_connected",

    # Security
    "create_access_token",
    "create_refresh_token",
    "verify_token",
    "verify_token_raw",
    "decode_token",
    "get_password_hash",
    "verify_password",

    # Repositories
    "BaseRepository",

    # Utils
    "get_logger",

    # Rate Limiter
    "BaseRateLimiter",
    "get_rate_limiter",
]
