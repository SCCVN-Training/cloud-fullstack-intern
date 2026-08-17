# tests/integration/conftest.py
import os
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool

from shared.config import settings
from shared.database import get_db, get_mongo_db, get_redis_client
from main import app

# ============ ENVIRONMENT DETECTION ============
IN_GITHUB_ACTIONS = os.getenv("GITHUB_ACTIONS") == "true"
RUNNING_REAL_INTEGRATION = os.getenv("RUN_REAL_INTEGRATION") == "true" or IN_GITHUB_ACTIONS

# ============ SELECT DATABASE BACKEND ============
if RUNNING_REAL_INTEGRATION:
    print("🐘 Using REAL PostgreSQL")
    test_engine = create_async_engine(
        settings.neon_database_url,
        echo=False,
        pool_pre_ping=True,
    )

    print("🍃 Using REAL MongoDB")
    # DO NOT create a global client - create per test
    # We'll create it in the fixture

    print("📦 Using REAL Redis")
    import redis.asyncio as redis
    test_redis_client = redis.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=10,
    )

else:
    print("🐘 Using SQLite in-memory (local)")
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=NullPool,
    )

    print("🍃 Using mongomock (local)")
    # mongomock doesn't have event loop issues
    from mongomock_motor import AsyncMongoMockClient
    test_mongo_client = AsyncMongoMockClient()

    print("📦 Using fakeredis (local)")
    import redis.asyncio as redis
    from fakeredis import FakeServer
    from fakeredis.aioredis import FakeAsyncRedisConnection

    server = FakeServer()
    test_redis_pool = redis.ConnectionPool(
        connection_class=FakeAsyncRedisConnection,
        server=server,
        decode_responses=True,
        max_connections=10,
    )
    test_redis_client = redis.Redis(connection_pool=test_redis_pool)

# ---------- Session Factories ----------
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# ============================================
# FIX: Create MongoDB client per test
# ============================================
@pytest.fixture
async def test_mongo_db():
    """Create a fresh MongoDB client for each test."""
    if RUNNING_REAL_INTEGRATION:
        from motor.motor_asyncio import AsyncIOMotorClient
        # Create a new client for each test
        client = AsyncIOMotorClient(
            settings.mongodb_connection_uri,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
        )
        db = client[settings.mongodb_database_name]
        yield db
        # Cleanup after test
        client.close()
    else:
        # For local tests, use the shared mongomock client
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[settings.mongodb_database_name]
        yield db
        # No cleanup needed for mongomock


@pytest.fixture
async def test_redis_client():
    """Provide Redis client for tests."""
    yield test_redis_client

# ---------- Override Dependencies ----------
async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def override_get_mongo_db():
    """Override get_mongo_db to use test database."""
    # This will be overridden by the fixture in tests
    # We'll use dependency override with a fixture
    if RUNNING_REAL_INTEGRATION:
        from motor.motor_asyncio import AsyncIOMotorClient
        client = AsyncIOMotorClient(
            settings.mongodb_connection_uri,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
        )
        db = client[settings.mongodb_database_name]
        yield db
        client.close()
    else:
        from mongomock_motor import AsyncMongoMockClient
        client = AsyncMongoMockClient()
        db = client[settings.mongodb_database_name]
        yield db

async def override_get_redis_client():
    yield test_redis_client

# Apply overrides
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_mongo_db] = override_get_mongo_db
app.dependency_overrides[get_redis_client] = override_get_redis_client

# ---------- Override Rate Limiter ----------
from shared.rate_limiter import BaseRateLimiter
from modules.auth.rate_limit import AuthRateLimiter, get_auth_rate_limiter

def create_test_rate_limiter() -> BaseRateLimiter:
    return BaseRateLimiter(
        redis_client=test_redis_client,
        key_prefix="test_limiter"
    )

async def override_get_auth_rate_limiter():
    base_limiter = create_test_rate_limiter()
    return AuthRateLimiter(base_limiter)

from modules.auth.routers import get_auth_rate_limiter
app.dependency_overrides[get_auth_rate_limiter] = override_get_auth_rate_limiter

def patch_get_rate_limiter():
    import shared.rate_limiter
    shared.rate_limiter.get_rate_limiter = lambda: create_test_rate_limiter()

patch_get_rate_limiter()

# ---------- Cleanup Fixture ----------
@pytest.fixture(autouse=True)
async def clean_database():
    """Clean all test data before each test."""
    # Clean Postgres/SQLite
    async with TestSessionLocal() as session:
        try:
            if RUNNING_REAL_INTEGRATION:
                await session.execute(text("TRUNCATE TABLE users CASCADE;"))
            else:
                result = await session.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
                ))
                if result.fetchone():
                    await session.execute(text("DELETE FROM users;"))
            await session.commit()
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")
            await session.rollback()

    # Clean MongoDB - use a fresh connection
    try:
        if RUNNING_REAL_INTEGRATION:
            from motor.motor_asyncio import AsyncIOMotorClient
            client = AsyncIOMotorClient(
                settings.mongodb_connection_uri,
                serverSelectionTimeoutMS=5000,
            )
            db = client[settings.mongodb_database_name]
            for collection_name in await db.list_collection_names():
                await db[collection_name].delete_many({})
            client.close()
        else:
            from mongomock_motor import AsyncMongoMockClient
            client = AsyncMongoMockClient()
            db = client[settings.mongodb_database_name]
            for collection_name in await db.list_collection_names():
                await db[collection_name].delete_many({})
    except Exception as e:
        print(f"⚠️ MongoDB cleanup warning: {e}")

    # Clean Redis
    try:
        await test_redis_client.flushdb()
    except Exception as e:
        print(f"⚠️ Redis cleanup warning: {e}")

    yield

# ---------- HTTP Client ----------
@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

# ---------- DB Session ----------
@pytest.fixture
async def test_db_session():
    async with TestSessionLocal() as session:
        yield session
