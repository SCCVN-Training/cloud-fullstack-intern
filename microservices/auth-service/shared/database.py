from typing import AsyncGenerator, Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
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
    pass


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


# ============ MongoDB Setup ============

_mongo_client: Optional[AsyncIOMotorClient] = None
_mongo_db: Optional[AsyncIOMotorDatabase] = None
_mongo_connected: bool = False


def is_atlas_connection(uri: str) -> bool:
    """Check if the connection string is for MongoDB Atlas."""
    return "+srv" in uri.lower()


async def get_mongo_client() -> AsyncIOMotorClient:
    """Get or create MongoDB client."""
    global _mongo_client, _mongo_connected

    if _mongo_client is None:
        try:
            logger.info(f"Connecting to MongoDB...")
            logger.info(f"URI: {settings.mongodb_connection_uri[:40]}...")

            # Common connection options
            client_options = {
                "maxPoolSize": 50,
                "minPoolSize": 10,
                "maxIdleTimeMS": 60000,
                "serverSelectionTimeoutMS": 10000,
                "connectTimeoutMS": 15000,
                "retryWrites": True,
                "retryReads": True,
            }

            # For Atlas (+srv), add TLS settings
            if is_atlas_connection(settings.mongodb_connection_uri):
                client_options["tls"] = True
                client_options["tlsAllowInvalidCertificates"] = settings.is_development
                logger.info("✅ Atlas connection detected - using TLS")

            _mongo_client = AsyncIOMotorClient(
                settings.mongodb_connection_uri,
                **client_options
            )

            # Test connection
            await _mongo_client.admin.command('ping')
            _mongo_connected = True
            logger.info("✅ MongoDB connected successfully")

        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            _mongo_client = None
            _mongo_connected = False
            raise

    return _mongo_client


async def get_mongo_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """
    Dependency that returns the MongoDB database instance.

    Usage:
        @router.get("/logs")
        async def get_logs(db: AsyncIOMotorDatabase = Depends(get_mongo_db)):
            ...
    """
    client = await get_mongo_client()
    db = client[settings.mongodb_database_name]
    yield db


async def init_mongo() -> None:
    """Initialize MongoDB indexes."""
    global _mongo_connected

    try:
        client = await get_mongo_client()
        db = client[settings.mongodb_database_name]

        # Create indexes with proper error handling
        index_success = True

        try:
            # Use different syntax for Motor 3.x
            await db.audit_logs.create_index([("timestamp", -1)])
            logger.info("✅ Created index: audit_logs.timestamp")
        except Exception as e:
            logger.warning(f"⚠️ Could not create timestamp index: {e}")
            index_success = False

        try:
            await db.audit_logs.create_index([("user_id", 1)])
            logger.info("✅ Created index: audit_logs.user_id")
        except Exception as e:
            logger.warning(f"⚠️ Could not create user_id index: {e}")
            index_success = False

        try:
            await db.access_logs.create_index([("timestamp", -1)])
            logger.info("✅ Created index: access_logs.timestamp")
        except Exception as e:
            logger.warning(f"⚠️ Could not create access_logs timestamp index: {e}")
            index_success = False

        _mongo_connected = True

        if index_success:
            logger.info("✅ All MongoDB indexes created successfully")
        else:
            logger.info("⚠️ MongoDB connected, but some indexes failed (logs will still work)")

    except Exception as e:
        _mongo_connected = False
        logger.warning(f"⚠️ MongoDB initialization warning: {e}")
        logger.warning("Continuing without MongoDB... (audit logging will be disabled)")

async def close_mongo() -> None:
    """Close MongoDB connection."""
    global _mongo_client, _mongo_db, _mongo_connected

    if _mongo_client is not None:
        _mongo_client.close()
        _mongo_client = None
        _mongo_db = None
        _mongo_connected = False
        logger.info("MongoDB connection closed")


def is_mongo_connected() -> bool:
    """Check if MongoDB is connected."""
    return _mongo_connected


# ============ Exports for convenience ============

# MongoDB client and database (for direct access if needed)
mongodb_client = _mongo_client
mongodb_database = _mongo_db

# ============ Redis Setup ============

_redis_client: Optional[redis.Redis] = None
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
            logger.info(f"Connecting to Redis...")
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
