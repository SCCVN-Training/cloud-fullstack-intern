from collections.abc import AsyncGenerator

import redis
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from shared.config import settings
from shared.logger import get_logger

logger = get_logger(__name__)


# ============ PostgreSQL (Neon) Setup ============

neon_async_engine: AsyncEngine = create_async_engine(
    str(settings.neon_database_url),
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=30,
    pool_recycle=3600,
    connect_args={"ssl": "require"} if settings.is_production else {},
)

async_session_factory = async_sessionmaker(
    bind=neon_async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an asynchronous PostgreSQL session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    async with neon_async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await neon_async_engine.dispose()


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


# ============ Synchronous Redis Client (for non-async contexts) ============


def get_redis_client_sync() -> redis.Redis:
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
