# tests/unit/modules/auth/test_audit_repositories.py
from datetime import datetime, timezone
from uuid import uuid4
import pytest

from modules.auth.audit_repositories import AuditLogRepository


@pytest.fixture
def audit_repo(mock_mongo_db):
    return AuditLogRepository(mock_mongo_db)


@pytest.fixture
def sample_data():
    """Sample data for audit log tests."""
    return {
        "user_id": uuid4(),
        "email": "test@example.com",
        "ip_address": "127.0.0.1",
        "user_agent": "Mozilla/5.0"
    }


# ==========================================
# 1. TESTS FOR log_registration
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_log_registration(audit_repo, sample_data):
    """Should log a registration event."""
    await audit_repo.log_registration(
        user_id=sample_data["user_id"],
        email=sample_data["email"],
        ip_address=sample_data["ip_address"],
        user_agent=sample_data["user_agent"],
    )

    logs = await audit_repo.get_user_audit_logs(user_id=sample_data["user_id"])

    assert len(logs) == 1
    assert logs[0]["event_type"] == "USER_REGISTERED"
    assert logs[0]["associated_user_id"] == str(sample_data["user_id"])
    assert logs[0]["email"] == sample_data["email"]
    assert logs[0]["ip_address"] == sample_data["ip_address"]
    assert logs[0]["user_agent"] == sample_data["user_agent"]


# ==========================================
# 2. TESTS FOR log_login_attempt
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_log_login_success(audit_repo, sample_data):
    """Should log a successful login attempt."""
    await audit_repo.log_login_attempt(
        user_id=sample_data["user_id"],
        email=sample_data["email"],
        ip_address=sample_data["ip_address"],
        user_agent=sample_data["user_agent"],
        success=True
    )

    logs = await audit_repo.get_user_audit_logs(user_id=sample_data["user_id"])

    assert len(logs) == 1
    assert logs[0]["event_type"] == "LOGIN_ATTEMPT"
    assert logs[0]["associated_user_id"] == str(sample_data["user_id"])
    assert logs[0]["email"] == sample_data["email"]
    assert logs[0]["success"] is True


@pytest.mark.unit
@pytest.mark.asyncio
async def test_log_login_fail(audit_repo, sample_data):
    """Should log a failed login attempt."""
    await audit_repo.log_login_attempt(
        user_id=sample_data["user_id"],
        email=sample_data["email"],
        ip_address=sample_data["ip_address"],
        user_agent=sample_data["user_agent"],
        success=False
    )

    logs = await audit_repo.get_user_audit_logs(user_id=sample_data["user_id"])

    assert len(logs) == 1
    assert logs[0]["event_type"] == "LOGIN_ATTEMPT"
    assert logs[0]["associated_user_id"] == str(sample_data["user_id"])
    assert logs[0]["email"] == sample_data["email"]
    assert logs[0]["success"] is False


@pytest.mark.unit
@pytest.mark.asyncio
async def test_log_login_without_user_id(audit_repo):
    """Should log a failed login attempt even without user_id."""
    email = "unknown@example.com"

    await audit_repo.log_login_attempt(
        email=email,
        success=False,
        ip_address="127.0.0.1",
        user_agent="Chrome/120",
        user_id=None,
    )

    logs = await audit_repo.collection.find({"event_type": "LOGIN_ATTEMPT"}).to_list(length=100)

    assert len(logs) == 1
    assert logs[0]["email"] == email
    assert logs[0]["success"] is False
    assert "associated_user_id" not in logs[0] or logs[0]["associated_user_id"] is None


# ==========================================
# 3. TESTS FOR log_password_change
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_log_password_change(audit_repo, sample_data):
    """Should log a password change event."""
    await audit_repo.log_password_change(
        user_id=sample_data["user_id"],
        email=sample_data["email"],
        ip_address=sample_data["ip_address"],
    )

    logs = await audit_repo.get_user_audit_logs(user_id=sample_data["user_id"])

    assert len(logs) == 1
    assert logs[0]["event_type"] == "PASSWORD_CHANGED"
    assert logs[0]["associated_user_id"] == str(sample_data["user_id"])
    assert logs[0]["email"] == sample_data["email"]
    assert logs[0]["ip_address"] == sample_data["ip_address"]


# ==========================================
# 4. TESTS FOR log_account_deactivation
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_log_account_deactivation_with_reason(audit_repo, sample_data):
    """Should log account deactivation with a reason."""
    reason = "User requested deletion"

    await audit_repo.log_account_deactivation(
        user_id=sample_data["user_id"],
        email=sample_data["email"],
        reason=reason,
    )

    logs = await audit_repo.get_user_audit_logs(user_id=sample_data["user_id"])

    assert len(logs) == 1
    assert logs[0]["event_type"] == "ACCOUNT_DEACTIVATED"
    assert logs[0]["associated_user_id"] == str(sample_data["user_id"])
    assert logs[0]["email"] == sample_data["email"]
    assert logs[0]["reason"] == reason


@pytest.mark.unit
@pytest.mark.asyncio
async def test_log_account_deactivation_without_reason(audit_repo, sample_data):
    """Should log account deactivation with None reason if not provided."""
    await audit_repo.log_account_deactivation(
        user_id=sample_data["user_id"],
        email=sample_data["email"],
        reason=None,
    )

    logs = await audit_repo.get_user_audit_logs(user_id=sample_data["user_id"])

    assert logs[0]["reason"] is None


# ==========================================
# 5. TESTS FOR get_user_audit_logs
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_user_audit_logs_pagination(audit_repo, sample_data):
    """Should respect limit and skip parameters."""
    user_id = sample_data["user_id"]

    # Insert 5 logs
    for i in range(5):
        await audit_repo.log_registration(
            user_id=user_id,
            email=f"test{i}@example.com",
            ip_address=None,
            user_agent=None,
        )

    # Get first 2
    logs_page_1 = await audit_repo.get_user_audit_logs(
        user_id=user_id,
        limit=2,
        skip=0
    )
    assert len(logs_page_1) == 2

    # Get next 2
    logs_page_2 = await audit_repo.get_user_audit_logs(
        user_id=user_id,
        limit=2,
        skip=2
    )
    assert len(logs_page_2) == 2

    # Should be different logs (sorted by timestamp descending)
    assert logs_page_1[0]["email"] != logs_page_2[0]["email"]


# ==========================================
# 6. TESTS FOR get_recent_registrations
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_recent_registrations(audit_repo, mocker):
    """Should return registrations sorted by timestamp descending."""
    # Mock datetime to have predictable timestamps
    mock_datetime = mocker.patch("modules.auth.audit_repositories.datetime")
    mock_timezone = mocker.patch("modules.auth.audit_repositories.timezone")

    # First registration (older)
    mock_datetime.now.return_value = datetime(2024, 1, 1, 10, 0, 0, tzinfo=timezone.utc)
    await audit_repo.log_registration(
        user_id=uuid4(),
        email="user1@example.com",
        ip_address=None,
        user_agent=None,
    )

    # Second registration (newer)
    mock_datetime.now.return_value = datetime(2024, 1, 1, 11, 0, 0, tzinfo=timezone.utc)
    await audit_repo.log_registration(
        user_id=uuid4(),
        email="user2@example.com",
        ip_address=None,
        user_agent=None,
    )

    # Reset mock for the actual query
    mock_datetime.now.return_value = datetime(2024, 1, 2, 0, 0, 0, tzinfo=timezone.utc)
    mock_timezone.utc = timezone.utc

    registrations = await audit_repo.get_recent_registrations(days=7, limit=10)

    assert len(registrations) == 2
    # Now order should be correct: user2 first (newer)
    assert registrations[0]["email"] == "user2@example.com"
    assert registrations[1]["email"] == "user1@example.com"

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_recent_registrations_respects_limit(audit_repo):
    """Should respect the limit parameter."""
    # Create 10 registrations
    for i in range(10):
        await audit_repo.log_registration(
            user_id=uuid4(),
            email=f"user{i}@example.com",
            ip_address=None,
            user_agent=None,
        )

    # Get only 3
    registrations = await audit_repo.get_recent_registrations(days=7, limit=3)

    assert len(registrations) == 3
