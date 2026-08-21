import uuid
import logging
import pytest_asyncio
from dotenv import load_dotenv
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

# Must load before importing app.main — Settings() reads env vars at import time
load_dotenv(".env.test", override=True)

from app.main import app
from app.core.database import get_db, Base
from app.modules.users.models import User
from app.modules.profiles.models import Profile
from app.common.enums import UserRole
from app.core.security import hash_password
from app.core.rate_limit import limiter

logger = logging.getLogger("tests.conftest")

import pytest


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """
    slowapi's default in-memory storage is process-wide, not per-request
    or per-test — without this, a full test-suite run legitimately trips
    the same 10/minute login limit real brute-force protection is meant
    to trip, since many tests call /auth/login in quick succession. Reset
    it before every test so rate limiting is exercised deliberately (by
    a test that wants to check it), not as test-suite cross-talk.
    """
    limiter.reset()
    yield

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = async_sessionmaker(bind=test_engine, expire_on_commit=False)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    logger.info("Creating in-memory SQLite schema for test...")
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    async def _get_test_db():
        yield db_session

    app.dependency_overrides[get_db] = _get_test_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


# ---------- Users ----------

@pytest_asyncio.fixture
async def seeded_user(db_session):
    user = User(
        user_name="testuser",
        email="test@example.com",
        password_hash=hash_password("secret123"),
        role=UserRole.USER,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def seeded_admin(db_session):
    admin = User(
        user_name="adminuser",
        email="admin@example.com",
        password_hash=hash_password("adminpass123"),
        role=UserRole.ADMIN,
    )
    db_session.add(admin)
    await db_session.commit()
    await db_session.refresh(admin)
    return admin


@pytest_asyncio.fixture
async def second_user(db_session):
    """A second regular user, used for permission-boundary tests."""
    user = User(
        user_name="seconduser",
        email="second@example.com",
        password_hash=hash_password("secret123"),
        role=UserRole.USER,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user

# ---------- Profiles ----------

@pytest_asyncio.fixture
async def seeded_profile(db_session, seeded_user):
    """Profile for seeded_user — required since review listings inner-join to profiles."""
    profile = Profile(
        user_id=seeded_user.id,
        user_name="Test User",
        bio="A test bio",
        interests=["music"],
        skills_learning=["guitar"],
        skills_taught=["python"],
        is_onboarded=True,
    )
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(profile)
    return profile


@pytest_asyncio.fixture
async def second_user_profile(db_session, second_user):
    """Profile for second_user, with a display-name override distinct
    from second_user's login handle (user_name='seconduser') — exercises
    the Profile.user_name-overrides-User.user_name resolution."""
    profile = Profile(
        user_id=second_user.id,
        user_name="Second User",
        bio="Another bio",
        interests=[],
        skills_learning=[],
        skills_taught=[],
        is_onboarded=False,
    )
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(profile)
    return profile


# ---------- Auth headers ----------

async def _login_and_get_token(client, email, password):
    res = await client.post("/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


@pytest_asyncio.fixture
async def auth_headers(client, seeded_user):
    token = await _login_and_get_token(client, "test@example.com", "secret123")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def second_user_auth_headers(client, second_user):
    token = await _login_and_get_token(client, "second@example.com", "secret123")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def admin_auth_headers(client, seeded_admin):
    token = await _login_and_get_token(client, "admin@example.com", "adminpass123")
    return {"Authorization": f"Bearer {token}"}