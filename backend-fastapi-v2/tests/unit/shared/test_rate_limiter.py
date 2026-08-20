# tests/unit/shared/test_rate_limiter.py
import pytest
import time
from unittest.mock import AsyncMock, patch

from shared.rate_limiter import BaseRateLimiter


@pytest.fixture
def rate_limiter(mock_redis_client):
    """SUT: BaseRateLimiter with mocked Redis client."""
    return BaseRateLimiter(redis_client=mock_redis_client, key_prefix="test_limiter")


# ---------- HELPER: Get the pipeline mock inside the async with block ----------
def get_mock_pipe(mock_redis_client):
    """
    Extract the pipeline object that will be used inside the 'async with' block.
    """
    mock_cm = mock_redis_client.pipeline.return_value
    return mock_cm.__aenter__.return_value


@pytest.mark.unit
@pytest.mark.asyncio
async def test_check_under_limit(rate_limiter, mock_redis_client):
    """Should return allowed=True and remaining > 0 when under limit."""
    # Arrange: Get the actual pipe mock and set its execute return value
    mock_pipe = get_mock_pipe(mock_redis_client)
    mock_pipe.execute.return_value = [
        0,  # zremrangebyscore result (ignored)
        3,  # zcard result (current count = 3)
        600,  # ttl result
    ]

    # Act
    allowed, remaining, retry_after = await rate_limiter.check(
        identifier="user_123",
        endpoint="login",
        limit=5,
        window_seconds=60,
    )

    # Assert
    assert allowed is True
    assert remaining == 1  # 5 - 3 - 1 = 1
    assert retry_after == 0

    # Verify Redis operations
    mock_pipe.zremrangebyscore.assert_called_once()
    mock_pipe.zcard.assert_called_once()
    mock_pipe.ttl.assert_called_once()
    mock_pipe.zadd.assert_called_once()
    mock_pipe.expire.assert_called_once()
    mock_pipe.execute.assert_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_check_exceeded_limit(rate_limiter, mock_redis_client):
    """Should return allowed=False and retry_after > 0 when at limit."""
    # Arrange: Get the actual pipe mock and set its execute return value
    mock_pipe = get_mock_pipe(mock_redis_client)
    mock_pipe.execute.return_value = [
        0,  # zremrangebyscore
        5,  # zcard (current count = 5)
        30,  # ttl (30 seconds remaining)
    ]

    # Act
    allowed, remaining, retry_after = await rate_limiter.check(
        identifier="user_123",
        endpoint="login",
        limit=5,
        window_seconds=60,
    )

    # Assert
    assert allowed is False
    assert remaining == 0
    assert retry_after == 30  # TTL returned

    # Verify it did NOT call zadd/expire (because limit was exceeded)
    mock_pipe.zadd.assert_not_called()
    mock_pipe.expire.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_check_sliding_window_cleanup(rate_limiter, mock_redis_client, mocker):
    """Should call zremrangebyscore with the correct cutoff timestamp."""
    # Arrange
    mock_pipe = get_mock_pipe(mock_redis_client)
    mock_pipe.execute.return_value = [0, 1, 600]  # current_count = 1

    # Mock time to have a deterministic value
    mock_time = mocker.patch("shared.rate_limiter.time")
    mock_time.time.return_value = 1234567890.5  # Fixed timestamp

    # Act
    await rate_limiter.check(
        identifier="user_123",
        endpoint="login",
        limit=5,
        window_seconds=60,
    )

    # Assert: zremrangebyscore called with (0, 1234567890.5 - 60)
    expected_cutoff = 1234567890.5 - 60  # = 1234567830.5
    mock_pipe.zremrangebyscore.assert_called_once_with(
        "test_limiter:login:user_123",
        0,
        expected_cutoff
    )


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_remaining(rate_limiter, mock_redis_client):
    """Should return remaining = limit - current_count."""
    # Arrange
    mock_redis_client.zcard.return_value = 3
    mock_redis_client.zremrangebyscore.return_value = 0

    # Act
    remaining = await rate_limiter.get_remaining(
        identifier="user_123",
        endpoint="login",
        limit=10,
        window_seconds=60,
    )

    # Assert
    assert remaining == 7  # 10 - 3
    mock_redis_client.zremrangebyscore.assert_called_once()
    mock_redis_client.zcard.assert_awaited_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_remaining_negative_returns_zero(rate_limiter, mock_redis_client):
    """Should return 0 if current_count exceeds limit."""
    # Arrange
    mock_redis_client.zcard.return_value = 15  # Exceeds limit
    mock_redis_client.zremrangebyscore.return_value = 0

    # Act
    remaining = await rate_limiter.get_remaining(
        identifier="user_123",
        endpoint="login",
        limit=10,
        window_seconds=60,
    )

    # Assert
    assert remaining == 0  # Can't go negative
