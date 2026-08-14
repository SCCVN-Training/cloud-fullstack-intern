"""
Anime Module Rate Limits - Self-contained.
Controls rate limits for anime-specific endpoints.
"""

from typing import Tuple
from shared.rate_limiter import BaseRateLimiter, get_rate_limiter
from shared.config import settings


class AnimeRateLimiter:
    """Rate limiter specifically for anime module."""

    def __init__(self, rate_limiter: BaseRateLimiter):
        self.rate_limiter = rate_limiter
        self.module_prefix = "anime"

    async def check_seasonal(self, user_id: str) -> Tuple[bool, int, int]:
        """
        Check rate limit for seasonal anime endpoint.

        ✅ 10 requests per minute per user
        ✅ Seasonal data changes infrequently
        """
        limit, window = settings.get_rate_limit("anime", "seasonal")
        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:user:{user_id}",
            endpoint="seasonal",
            limit=limit,
            window_seconds=window,
        )

    async def check_search(self, user_id: str) -> Tuple[bool, int, int]:
        """
        Check rate limit for search anime endpoint.

        ✅ 30 requests per minute per user
        ✅ Search is more frequent than seasonal
        """
        limit, window = settings.get_rate_limit("anime", "search")
        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:user:{user_id}",
            endpoint="search",
            limit=limit,
            window_seconds=window,
        )

    async def check_seasonal_all(self, user_id: str) -> Tuple[bool, int, int]:
        """
        Check rate limit for fetching ALL seasonal anime.

        ✅ 2 requests per minute per user (stricter)
        ✅ This makes multiple API calls
        """
        limit, window = settings.get_rate_limit("anime", "seasonal_all")
        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:user:{user_id}",
            endpoint="seasonal_all",
            limit=limit,
            window_seconds=window,
        )


# ============================================
# DEPENDENCY INJECTION
# ============================================

async def get_anime_rate_limiter() -> AnimeRateLimiter:
    """Dependency for anime module rate limiter."""
    base_limiter = await get_rate_limiter()
    return AnimeRateLimiter(base_limiter)
