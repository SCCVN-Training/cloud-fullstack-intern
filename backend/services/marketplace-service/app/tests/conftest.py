import uuid
import logging
import pytest_asyncio
import pytest
from dotenv import load_dotenv
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

# Must load before importing app.main — Settings() reads env vars at import time
load_dotenv(".env.test", override=True)

from app.main import app
from app.core.database import get_db, Base
from app.modules.skills.models import Skill
from app.modules.bookings.models import Booking, BookingStatus
from app.common.enums import UserRole
from app.core.security import create_access_token
from app.clients.identity_client import IdentityClient

logger = logging.getLogger("tests.conftest")

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


@pytest_asyncio.fixture(autouse=True)
def stub_identity_client(monkeypatch):
    """
    marketplace-service's tests should not require identity-service to
    actually be running — that's what a separate integration/contract
    test would be for. This stubs the one cross-service dependency
    (IdentityClient) with canned, deterministic responses keyed by the
    user_id it's asked about, so unit tests for skills/bookings/reviews
    stay fast and self-contained.
    """
    _display_names: dict[str, str] = {}

    async def fake_get_public_profile(user_id):
        uid = str(user_id)
        return {
            "user_id": uid,
            "user_name": _display_names.get(uid, f"User-{uid[:8]}"),
            "avatar_url": "https://ui-avatars.com/api/?name=Test",
            "bio": "Test bio",
            "title": "Mentor",
        }

    async def fake_user_exists(user_id):
        return True

    # Default: both succeed and do nothing observable — individual tests
    # that need to exercise a charge/credit failure override these with
    # monkeypatch.setattr in the test itself (see test_bookings.py).
    async def fake_charge_booking(learner_id, amount, booking_id):
        return None

    async def fake_credit_booking(mentor_id, amount, booking_id):
        return None

    monkeypatch.setattr(IdentityClient, "get_public_profile", staticmethod(fake_get_public_profile))
    monkeypatch.setattr(IdentityClient, "user_exists", staticmethod(fake_user_exists))
    monkeypatch.setattr(IdentityClient, "charge_booking", staticmethod(fake_charge_booking))
    monkeypatch.setattr(IdentityClient, "credit_booking", staticmethod(fake_credit_booking))
    return _display_names


# ---------- "Users" ----------
# There's no users table in this service anymore — identity-service owns
# that. What this service needs for tests is just a user_id + role to
# mint a valid JWT with (see auth_headers below), so these fixtures are
# plain dataclass-ish objects instead of ORM rows.

class FakeUser:
    def __init__(self, role: UserRole = UserRole.USER):
        self.id = uuid.uuid4()
        self.role = role


@pytest.fixture
def seeded_user():
    return FakeUser(role=UserRole.USER)


@pytest.fixture
def seeded_admin():
    return FakeUser(role=UserRole.ADMIN)


@pytest.fixture
def second_user():
    return FakeUser(role=UserRole.USER)


# ---------- Auth headers ----------
# No /auth/login here — that endpoint lives in identity-service. This
# service verifies JWTs statelessly (see core/dependencies.py), so tests
# mint tokens directly with the same signing function/secret identity-
# service uses in production.

def _token_for(user: FakeUser) -> str:
    return create_access_token({"sub": str(user.id), "role": user.role.value})


@pytest.fixture
def auth_headers(seeded_user):
    return {"Authorization": f"Bearer {_token_for(seeded_user)}"}


@pytest.fixture
def second_user_auth_headers(second_user):
    return {"Authorization": f"Bearer {_token_for(second_user)}"}


@pytest.fixture
def admin_auth_headers(seeded_admin):
    return {"Authorization": f"Bearer {_token_for(seeded_admin)}"}


# ---------- Skills / bookings ----------

@pytest_asyncio.fixture
async def seeded_skill(db_session, seeded_user):
    """A skill taught by seeded_user."""
    skill = Skill(
        title="Intro to Guitar",
        category="Music",
        description="Learn the basics of guitar.",
        image="https://example.com/guitar.jpg",
        duration=30,
        level="Beginner",
        requirements="An acoustic guitar",
        instructor_id=seeded_user.id,
    )
    db_session.add(skill)
    await db_session.commit()
    await db_session.refresh(skill)
    return skill


@pytest_asyncio.fixture
async def seeded_booking(db_session, seeded_skill, second_user):
    """second_user books seeded_user's skill."""
    from datetime import datetime, timezone
    booking = Booking(
        skill_id=seeded_skill.id,
        learner_id=second_user.id,
        mentor_id=seeded_skill.instructor_id,
        session_date=datetime.now(timezone.utc),
        status=BookingStatus.PENDING,
        price_paid=seeded_skill.price,
    )
    db_session.add(booking)
    await db_session.commit()
    await db_session.refresh(booking)
    return booking


@pytest_asyncio.fixture
async def completed_booking(db_session, seeded_skill, second_user):
    """Same shape as seeded_booking but COMPLETED — reviews can only be
    left on a completed booking, so review tests need this rather than
    seeded_booking (PENDING)."""
    from datetime import datetime, timezone
    booking = Booking(
        skill_id=seeded_skill.id,
        learner_id=second_user.id,
        mentor_id=seeded_skill.instructor_id,
        session_date=datetime.now(timezone.utc),
        status=BookingStatus.COMPLETED,
        price_paid=seeded_skill.price,
    )
    db_session.add(booking)
    await db_session.commit()
    await db_session.refresh(booking)
    return booking
