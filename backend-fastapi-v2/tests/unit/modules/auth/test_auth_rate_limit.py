# tests/unit/modules/auth/test_auth_rate_limit.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi import Request, HTTPException

from modules.auth.rate_limit import AuthRateLimiter


@pytest.fixture
def mock_base_rate_limiter():
    """Mock the base rate limiter."""
    mock = AsyncMock()
    mock.check = AsyncMock(return_value=(True, 4, 0))
    return mock


@pytest.fixture
def auth_rate_limiter(mock_base_rate_limiter):
    """SUT: AuthRateLimiter with mocked base rate limiter."""
    return AuthRateLimiter(mock_base_rate_limiter)


@pytest.fixture
def mock_request_with_forwarded():
    """Mock FastAPI Request with X-Forwarded-For header."""
    request = MagicMock(spec=Request)
    request.headers = {"X-Forwarded-For": "203.0.113.1, 192.168.1.1"}
    request.client = MagicMock()
    request.client.host = "192.168.1.1"
    return request


@pytest.fixture
def mock_request_with_client_ip():
    """Mock FastAPI Request with client.host only."""
    request = MagicMock(spec=Request)
    request.headers = {}
    request.client = MagicMock()
    request.client.host = "192.168.1.100"
    return request


@pytest.fixture
def mock_request_without_ip():
    """Mock FastAPI Request with no IP."""
    request = MagicMock(spec=Request)
    request.headers = {}
    request.client = None
    return request


# ==========================================
# 1. TESTS FOR check_login
# ==========================================

@pytest.mark.asyncio
async def test_check_login_success(auth_rate_limiter, mock_base_rate_limiter, mock_request_with_client_ip):
    """Should check login rate limit with IP as identifier."""
    # Arrange
    mock_base_rate_limiter.check.return_value = (True, 4, 0)

    # Act
    allowed, remaining, retry_after = await auth_rate_limiter.check_login(
        request=mock_request_with_client_ip
    )

    # Assert
    assert allowed is True
    assert remaining == 4
    assert retry_after == 0

    # Verify the base limiter was called with correct params
    mock_base_rate_limiter.check.assert_called_once_with(
        identifier="auth:ip:192.168.1.100",
        endpoint="login",
        limit=5,  # From settings: rate_limit_auth_login_limit = 5
        window_seconds=60,  # From settings: rate_limit_auth_login_window = 60
    )


@pytest.mark.asyncio
async def test_check_login_rate_limited(auth_rate_limiter, mock_base_rate_limiter, mock_request_with_client_ip):
    """Should return rate limited response when limit exceeded."""
    # Arrange
    mock_base_rate_limiter.check.return_value = (False, 0, 30)

    # Act
    allowed, remaining, retry_after = await auth_rate_limiter.check_login(
        request=mock_request_with_client_ip
    )

    # Assert
    assert allowed is False
    assert remaining == 0
    assert retry_after == 30


@pytest.mark.asyncio
async def test_check_login_with_forwarded_ip(auth_rate_limiter, mock_base_rate_limiter, mock_request_with_forwarded):
    """Should use X-Forwarded-For header when present."""
    # Act
    await auth_rate_limiter.check_login(request=mock_request_with_forwarded)

    # Assert: Should use the first IP from X-Forwarded-For
    mock_base_rate_limiter.check.assert_called_once_with(
        identifier="auth:ip:203.0.113.1",
        endpoint="login",
        limit=5,
        window_seconds=60,
    )


@pytest.mark.asyncio
async def test_check_login_without_ip(auth_rate_limiter, mock_base_rate_limiter, mock_request_without_ip):
    """Should use 'unknown' when no IP is available."""
    # Act
    await auth_rate_limiter.check_login(request=mock_request_without_ip)

    # Assert: Should use 'unknown' as fallback
    mock_base_rate_limiter.check.assert_called_once_with(
        identifier="auth:ip:unknown",
        endpoint="login",
        limit=5,
        window_seconds=60,
    )


# ==========================================
# 2. TESTS FOR check_register
# ==========================================

@pytest.mark.asyncio
async def test_check_register_success(auth_rate_limiter, mock_base_rate_limiter, mock_request_with_client_ip):
    """Should check registration rate limit with IP as identifier."""
    # Arrange
    mock_base_rate_limiter.check.return_value = (True, 2, 0)

    # Act
    allowed, remaining, retry_after = await auth_rate_limiter.check_register(
        request=mock_request_with_client_ip
    )

    # Assert
    assert allowed is True
    assert remaining == 2
    assert retry_after == 0

    mock_base_rate_limiter.check.assert_called_once_with(
        identifier="auth:ip:192.168.1.100",
        endpoint="register",
        limit=3,  # From settings: rate_limit_auth_register_limit = 3
        window_seconds=60,  # From settings: rate_limit_auth_register_window = 60
    )


@pytest.mark.asyncio
async def test_check_register_rate_limited(auth_rate_limiter, mock_base_rate_limiter, mock_request_with_client_ip):
    """Should return rate limited response when registration limit exceeded."""
    # Arrange
    mock_base_rate_limiter.check.return_value = (False, 0, 45)

    # Act
    allowed, remaining, retry_after = await auth_rate_limiter.check_register(
        request=mock_request_with_client_ip
    )

    # Assert
    assert allowed is False
    assert remaining == 0
    assert retry_after == 45


# ==========================================
# 3. TESTS FOR check_refresh
# ==========================================

@pytest.mark.asyncio
async def test_check_refresh_success(auth_rate_limiter, mock_base_rate_limiter, mock_request_with_client_ip):
    """Should check refresh rate limit with IP as identifier."""
    # Arrange
    mock_base_rate_limiter.check.return_value = (True, 9, 0)

    # Act
    allowed, remaining, retry_after = await auth_rate_limiter.check_refresh(
        request=mock_request_with_client_ip
    )

    # Assert
    assert allowed is True
    assert remaining == 9
    assert retry_after == 0

    mock_base_rate_limiter.check.assert_called_once_with(
        identifier="auth:ip:192.168.1.100",
        endpoint="refresh",
        limit=10,  # From settings: rate_limit_auth_refresh_limit = 10
        window_seconds=60,  # From settings: rate_limit_auth_refresh_window = 60
    )


# ==========================================
# 4. TESTS FOR check_me
# ==========================================

@pytest.mark.asyncio
async def test_check_me_success(auth_rate_limiter, mock_base_rate_limiter, mock_request_with_client_ip):
    """Should check /me rate limit with IP as identifier."""
    # Arrange
    mock_base_rate_limiter.check.return_value = (True, 59, 0)

    # Act
    allowed, remaining, retry_after = await auth_rate_limiter.check_me(
        request=mock_request_with_client_ip
    )

    # Assert
    assert allowed is True
    assert remaining == 59
    assert retry_after == 0

    mock_base_rate_limiter.check.assert_called_once_with(
        identifier="auth:ip:192.168.1.100",
        endpoint="me",
        limit=5,  # From settings: rate_limit_auth_me_limit (default 60)
        window_seconds=60,  # From settings: rate_limit_auth_me_window (default 60)
    )


@pytest.mark.asyncio
async def test_check_me_rate_limited(auth_rate_limiter, mock_base_rate_limiter, mock_request_with_client_ip):
    """Should return rate limited response when /me limit exceeded."""
    # Arrange
    mock_base_rate_limiter.check.return_value = (False, 0, 10)

    # Act
    allowed, remaining, retry_after = await auth_rate_limiter.check_me(
        request=mock_request_with_client_ip
    )

    # Assert
    assert allowed is False
    assert remaining == 0
    assert retry_after == 10


# ==========================================
# 5. TESTS FOR _get_client_ip (Private Method)
# ==========================================

def test_get_client_ip_with_forwarded(auth_rate_limiter, mock_request_with_forwarded):
    """Should extract first IP from X-Forwarded-For header."""
    ip = auth_rate_limiter._get_client_ip(mock_request_with_forwarded)
    assert ip == "203.0.113.1"


def test_get_client_ip_with_client_host(auth_rate_limiter, mock_request_with_client_ip):
    """Should use client.host when no X-Forwarded-For header."""
    ip = auth_rate_limiter._get_client_ip(mock_request_with_client_ip)
    assert ip == "192.168.1.100"


def test_get_client_ip_without_ip(auth_rate_limiter, mock_request_without_ip):
    """Should return 'unknown' when no IP is available."""
    ip = auth_rate_limiter._get_client_ip(mock_request_without_ip)
    assert ip == "unknown"


def test_get_client_ip_with_empty_forwarded(auth_rate_limiter):
    """Should fallback to client.host when X-Forwarded-For is empty."""
    request = MagicMock(spec=Request)
    request.headers = {"X-Forwarded-For": ""}
    request.client = MagicMock()
    request.client.host = "192.168.1.1"

    ip = auth_rate_limiter._get_client_ip(request)
    assert ip == "192.168.1.1"


# ==========================================
# 6. INTEGRATION WITH ROUTERS (Mock)
# ==========================================

@pytest.mark.asyncio
async def test_auth_rate_limiter_dependency():
    """Test that get_auth_rate_limiter returns a properly configured instance."""
    from modules.auth.rate_limit import get_auth_rate_limiter

    # We can't easily test this without Redis, but we can test the function exists
    # and returns the right type.
    limiter = await get_auth_rate_limiter()
    assert isinstance(limiter, AuthRateLimiter)
