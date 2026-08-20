# tests/integration/conftest.py
import os
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool, StaticPool

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
    from motor.motor_asyncio import AsyncIOMotorClient
    test_mongo_client = AsyncIOMotorClient(
        settings.mongodb_connection_uri,
        maxPoolSize=10,
        minPoolSize=1,
        serverSelectionTimeoutMS=5000,
    )

    print("📦 Using REAL Redis")
    import redis.asyncio as redis
    test_redis_client = redis.from_url(
        settings.redis_url,
        decode_responses=True,
        max_connections=10,
    )

else:
    # ==========================================
    # SQLite FIX: Use StaticPool to share the same connection
    # ==========================================
    print("🐘 Using SQLite in-memory (local)")

    # Create engine with StaticPool to ensure all connections share the same in-memory DB
    test_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        poolclass=StaticPool,  # <-- CRITICAL: Share the same connection
        connect_args={"check_same_thread": False},  # <-- Allow multiple greenlets
    )

    print("🍃 Using mongomock (local)")
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

test_mongo_db = test_mongo_client[settings.mongodb_database_name]

# ============================================
# CREATE TABLES (Using the same engine connection)
# ============================================
@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    """Create tables once before all tests."""
    if not RUNNING_REAL_INTEGRATION:
        # For SQLite: Use TestSessionLocal to share the same connection
        async with TestSessionLocal() as session:
            # Create users table
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    hashed_password TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at_utc DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """))
            await session.commit()
            print("✅ SQLite users table created")
    else:
        # For PostgreSQL, Alembic should have created tables
        print("✅ Using existing PostgreSQL tables (created by Alembic)")

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
    yield test_mongo_db

async def override_get_redis_client():
    yield test_redis_client

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
                # SQLite: Check if table exists before deleting
                result = await session.execute(text(
                    "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
                ))
                if result.fetchone():
                    await session.execute(text("DELETE FROM users;"))
                    print("✅ SQLite users table cleaned")
            await session.commit()
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")
            await session.rollback()

    # Clean MongoDB
    try:
        for collection_name in await test_mongo_db.list_collection_names():
            await test_mongo_db[collection_name].delete_many({})
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

# ==========================================
# FIX: GRACEFUL TEARDOWN OF GLOBAL CONNECTIONS
# ==========================================
@pytest.fixture(scope="session", autouse=True)
async def close_global_connections():
    """
    Ensures all global connection pools are gracefully closed after the test suite finishes.
    This prevents memory leaks and hanging CI pipelines during the teardown phase.
    """
    # Yield control to let all test cases execute first
    yield

    print("\n🧹 Closing global database and Redis connections...")

    if RUNNING_REAL_INTEGRATION:
        # Close PostgreSQL connection pool
        await test_engine.dispose()

        # Close MongoDB connection
        test_mongo_client.close()

        # Close Redis connection pool
        await test_redis_client.aclose()
