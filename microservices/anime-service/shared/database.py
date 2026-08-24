from collections.abc import AsyncGenerator

import redis

from shared.config import settings
from shared.logger import get_logger

logger = get_logger(__name__)


# ============ Redis Setup ============

_redis_client: redis.Redis | None = None
_redis_connected: bool = False


async def get_redis_client() -> AsyncGenerator[redis.Redis, None]:
    """
    Dependency that returns a Redis client instance.

    Usage:
        @router.get("/cached-data")
        async def get_data(redis: Redis = Depends(get_redis_client)):
            data = await redis.get("key")
            return {"data": data}
    """
    global _redis_client, _redis_connected

    if _redis_client is None:
        try:
            import redis.asyncio as redis

            logger.info("Connecting to Redis...")
            logger.info(f"URL: {settings.redis_url[:30]}...")

            _redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                max_connections=20,
                socket_keepalive=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
            )

            # Test connection
            await _redis_client.ping()
            _redis_connected = True
            logger.info("✅ Redis connected successfully")

        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            _redis_client = None
            _redis_connected = False
            raise

    yield _redis_client


async def close_redis() -> None:
    """Close Redis connection."""
    global _redis_client, _redis_connected

    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
        _redis_connected = False
        logger.info("Redis connection closed")


def is_redis_connected() -> bool:
    """Check if Redis is connected."""
    return _redis_connected


# ============ Asynchronous Redis Client ============


def get_redis_client_async() -> redis.Redis:
    """
    Get a synchronous Redis client for use in non-async contexts.
    Use this for @lru_cache functions, startup scripts, etc.
    """
    import redis.asyncio as redis

    return redis.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=20,
    )
