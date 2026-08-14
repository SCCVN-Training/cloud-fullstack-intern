"""
Base Rate Limiter - Reusable across all modules and microservices.
No configs here - just the core logic.
"""
import time
from typing import Optional, Tuple
from functools import lru_cache

import redis.asyncio as redis

from shared.config import settings

from shared.database import get_redis_client_sync


class BaseRateLimiter:
    """Base sliding window rate limiter."""

    def __init__(self, redis_client: Optional[redis.Redis] = None, key_prefix: Optional[str] = None):
        """
        Initialize rate limiter with Redis client.

        Args:
            redis_client: Async Redis client instance.
            key_prefix: Prefix for all Redis keys. Defaults to settings.cache_prefix_rate_limit.
        """
        self.redis = redis_client or self._get_redis_client()
        self.key_prefix = key_prefix or settings.cache_prefix_rate_limit

    def _get_redis_client(self) -> redis.Redis:
        """Get Redis client from settings."""
        return get_redis_client_sync()

    def _get_key(self, identifier: str, endpoint: str) -> str:
        """Generate Redis key for rate limit tracking."""
        return f"{self.key_prefix}:{endpoint}:{identifier}"

    async def check(
        self,
        identifier: str,
        endpoint: str,
        limit: int,
        window_seconds: int,
    ) -> Tuple[bool, int, int]:
        """
        Check if request is within rate limit.

        Args:
            identifier: Unique identifier (user ID, IP, etc.)
            endpoint: Endpoint name (e.g., "login", "search")
            limit: Max requests allowed in the window
            window_seconds: Time window in seconds

        Returns:
            Tuple of (allowed, remaining, retry_after_seconds)
        """
        key = self._get_key(identifier, endpoint)
        now = time.time()

        async with self.redis.pipeline(transaction=True) as pipe:
            # Remove timestamps older than window
            await pipe.zremrangebyscore(key, 0, now - window_seconds)
            # Count current requests
            await pipe.zcard(key)
            # Get TTL
            await pipe.ttl(key)

            results = await pipe.execute()
            current_count = results[1]
            ttl = results[2]

            if current_count >= limit:
                # Rate limit exceeded
                if ttl <= 0:
                    ttl = window_seconds
                return False, 0, ttl

            # Add current timestamp
            await pipe.zadd(key, {str(now): now})
            await pipe.expire(key, window_seconds)
            await pipe.execute()

            remaining = limit - current_count - 1
            return True, remaining, 0

    async def get_remaining(
        self,
        identifier: str,
        endpoint: str,
        limit: int,
        window_seconds: int,
    ) -> int:
        """Get remaining requests allowed in current window."""
        key = self._get_key(identifier, endpoint)
        now = time.time()

        await self.redis.zremrangebyscore(key, 0, now - window_seconds)
        count = await self.redis.zcard(key)
        return max(0, limit - count)


# ============================================
# DEPENDENCY INJECTION
# ============================================
@lru_cache
async def get_rate_limiter() -> BaseRateLimiter:
    """
    Dependency for getting rate limiter instance.

    Uses settings.redis_url and settings.cache_prefix_rate_limit.
    """
    return BaseRateLimiter()
