"""
Shared library for all modules.
"""

from .config import settings
from .database import (
    Base,
    close_db,
    close_mongo,
    # PostgreSQL
    get_db,
    # MongoDB
    get_mongo_db,
    init_db,
    init_mongo,
    is_mongo_connected,
    mongodb_client,
    mongodb_database,
    neon_async_engine,
)
from .logger import get_logger
from .rate_limiter import BaseRateLimiter, get_rate_limiter
from .repositories import BaseRepository
from .security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
    verify_token,
    verify_token_raw,
)

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
