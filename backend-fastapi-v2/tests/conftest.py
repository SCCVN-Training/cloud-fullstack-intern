# tests/conftest.py
# ============ ADD THIS AT THE VERY TOP ============
import asyncio
import os
import sys
import pytest
from pathlib import Path

# ============ ENVIRONMENT DETECTION ============
IN_GITHUB_ACTIONS = os.getenv("GITHUB_ACTIONS") == "true"
RUNNING_REAL_INTEGRATION = os.getenv("RUN_REAL_INTEGRATION") == "true" or IN_GITHUB_ACTIONS

print(f"🔍 Environment: {'GitHub Actions' if IN_GITHUB_ACTIONS else 'Local'}")
print(f"🔍 Integration mode: {'Real' if RUNNING_REAL_INTEGRATION else 'In-Memory'}")

# ============ SET ENVIRONMENT VARIABLES (LOCAL ONLY) ============
if not IN_GITHUB_ACTIONS:
    # Try to load .env.test
    try:
        from dotenv import load_dotenv
        env_file = Path(".env.test")
        if env_file.exists():
            load_dotenv(env_file, override=True)
            print("📄 Loaded .env.test")
        else:
            print("⚠️ No .env.test found - using fallback settings")
    except ImportError:
        print("⚠️ python-dotenv not installed - using fallback settings")

    # Fallback: Use in-memory mocks
    os.environ.setdefault("ENVIRONMENT", "test")
    os.environ.setdefault("NEON_DATABASE_URL", "sqlite+aiosqlite:///:memory:")
    os.environ.setdefault("MONGODB_CONNECTION_URI", "mongodb://localhost:27017")
    os.environ.setdefault("MONGODB_DATABASE_NAME", "test_db")
    os.environ.setdefault("REDIS_URL", "redis://localhost:6379")
    os.environ.setdefault("CACHE_PREFIX_RATE_LIMIT", "test_limiter")
    os.environ.setdefault("JWT_SECRET_KEY", "test_secret_key_32_chars_long_enough")
    os.environ.setdefault("JWT_ALGORITHM", "HS256")
    os.environ.setdefault("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
    os.environ.setdefault("REFRESH_TOKEN_EXPIRE_DAYS", "7")

# ============ AUTO-SKIP REAL INTEGRATION TESTS LOCALLY ============
def pytest_collection_modifyitems(config, items):
    """Automatically skip integration_real tests when running locally."""
    if not RUNNING_REAL_INTEGRATION:
        skip_real = pytest.mark.skip(
            reason="Real integration tests require GitHub Actions or RUN_REAL_INTEGRATION=true"
        )
        for item in items:
            if "integration_real" in item.keywords:
                item.add_marker(skip_real)
                print(f"⏭️ Skipping {item.name} (requires CI or RUN_REAL_INTEGRATION)")
# ============ END OF ADDED SECTION ============

from uuid import uuid4

from fastapi import Request, Response
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from httpx import AsyncClient
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession

from main import app  # Your FastAPI app factory
from shared.database import get_db

# ---------- 2. ASYNC CLIENT FIXTURE ----------
@pytest.fixture
async def async_client():
    """Provides an async HTTP client for testing FastAPI endpoints."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

# ---------- 3. GLOBAL MOCK FIXTURES (Reused across all unit tests) ----------
@pytest.fixture
def mock_pg_session():
    """Standard mock for SQLAlchemy AsyncSession."""
    session = AsyncMock(spec=AsyncSession)
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_result.scalars.return_value = MagicMock(all=lambda: [], first=lambda: None)
    session.execute.return_value = mock_result
    return session

@pytest.fixture
def mock_mongo_db():
    """Standard mock for Motor database."""
    from mongomock_motor import AsyncMongoMockClient

    client = AsyncMongoMockClient()
    db = client.get_database("test_db")
    return db

@pytest.fixture
def mock_auth_repo():
    repo = AsyncMock()
    repo.check_email_exists = AsyncMock(return_value=False)
    repo.create = AsyncMock(return_value=MagicMock(id=uuid4(), email="test@example.com", is_active=True))
    repo.get_by_email = AsyncMock(return_value=None)
    repo.get_by_id = AsyncMock(return_value=None)
    return repo

@pytest.fixture
def mock_audit_repo():
    repo = AsyncMock()
    repo.log_registration = AsyncMock()
    repo.log_login_attempt = AsyncMock()
    return repo

@pytest.fixture
def mock_request():
    request = MagicMock(spec=Request)
    request.cookies = {}
    return request

@pytest.fixture
def mock_response():
    return Response()

@pytest.fixture
def auth_service(mock_pg_session, mock_mongo_db, mock_auth_repo, mock_audit_repo):
    from modules.auth.services import AuthService
    service = AuthService(
        postgres_session=mock_pg_session,
        mongo_db=mock_mongo_db
    )
    # Inject mocks to override internal instantiations
    service.auth_repo = mock_auth_repo
    service.audit_repo = mock_audit_repo
    return service

@pytest.fixture
def mock_redis_client():
    """
    Mock Redis client that correctly handles async context managers.

    Usage:
        mock_redis = mock_redis_client
        # To override pipeline.execute() return value in a test:
        mock_cm = mock_redis.pipeline.return_value
        mock_pipe = mock_cm.__aenter__.return_value
        mock_pipe.execute.return_value = [0, 3, 600]
    """
    # --- 1. The actual pipeline object (the 'pipe' inside the with block) ---
    mock_pipe = AsyncMock()
    mock_pipe.zremrangebyscore = AsyncMock()
    mock_pipe.zcard = AsyncMock()
    mock_pipe.ttl = AsyncMock()
    mock_pipe.zadd = AsyncMock()
    mock_pipe.expire = AsyncMock()
    mock_pipe.execute = AsyncMock()

    # --- 2. The context manager returned by redis.pipeline() ---
    mock_cm = AsyncMock()
    mock_cm.__aenter__.return_value = mock_pipe
    mock_cm.__aexit__.return_value = None  # No exceptions

    # --- 3. The Redis client itself ---
    mock_redis = AsyncMock(spec=redis.Redis)
    mock_redis.pipeline.return_value = mock_cm
    mock_redis.zremrangebyscore = AsyncMock()
    mock_redis.zcard = AsyncMock()
    mock_redis.ttl = AsyncMock()
    mock_redis.zadd = AsyncMock()
    mock_redis.expire = AsyncMock()

    return mock_redis
