"""
Smart Cache Manager for Anime Module.
Implements intelligent caching strategy for seasonal anime.
"""

import hashlib
import json
from typing import Any

import redis.asyncio as redis
from shared.config import settings
from shared.database import get_redis_client_async


class AnimeCacheManager:
    """
    Smart caching for anime data.

    Strategy:
    1. Seasonal anime: Cache ALL results in Redis as a single key
    2. Pagination: Server-side pagination from the cached full list
    3. Cache invalidation: TTL-based (1 hour for seasonal)
    4. Stale-while-revalidate: Serve stale cache while refreshing
    """

    def __init__(self, redis_client: redis.Redis | None = None):
        self.redis = redis_client or self._get_redis_client()
        self.default_ttl = settings.anilist_cache_ttl_l1  # Default 300s
        self.seasonal_ttl = 3600  # 1 hour for seasonal

    def _get_redis_client(self) -> redis.Redis:
        """Get Redis client from settings."""
        return get_redis_client_async()

    def _get_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate consistent cache key."""
        # Create a deterministic string from args
        key_parts = [str(arg) for arg in args]
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}:{v}")

        key_string = ":".join(key_parts)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"{settings.cache_prefix_l1}:anime:{prefix}:{key_hash}"

    # ============================================
    # SEASONAL CACHE (Full List)
    # ============================================

    async def get_seasonal_cache(
        self,
        season: str,
        year: int,
    ) -> list | None:
        """Get cached seasonal anime list."""
        cache_key = self._get_cache_key("seasonal", season=season, year=year)

        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        return None

    async def set_seasonal_cache(
        self,
        season: str,
        year: int,
        data: list,
        ttl: int | None = None,
    ) -> None:
        """Cache seasonal anime list."""
        cache_key = self._get_cache_key("seasonal", season=season, year=year)

        # Convert to dict for JSON serialization
        serializable = [item.model_dump() for item in data]
        await self.redis.setex(
            cache_key, ttl or self.seasonal_ttl, json.dumps(serializable)
        )

    async def get_seasonal_paginated(
        self,
        season: str,
        year: int,
        page: int,
        per_page: int,
    ) -> tuple[list, int, bool]:
        """
        Get paginated seasonal anime from cache.

        Returns:
            Tuple of (items, total_count, has_next_page)
        """
        # Get full list from cache
        full_list = await self.get_seasonal_cache(season, year)

        if full_list is None:
            return [], 0, False

        total = len(full_list)
        start = (page - 1) * per_page
        end = start + per_page

        # Slice the list
        items = full_list[start:end]
        has_next = end < total

        return items, total, has_next

    async def is_seasonal_cached(self, season: str, year: int) -> bool:
        """Check if seasonal data is cached."""
        cache_key = self._get_cache_key("seasonal", season=season, year=year)
        exists = await self.redis.exists(cache_key)
        return bool(exists)

    # ============================================
    # SEARCH CACHE (Individual searches)
    # ============================================

    async def get_search_cache(
        self,
        query: str,
        page: int,
        per_page: int,
    ) -> dict[str, Any] | None:
        """Get cached search results."""
        cache_key = self._get_cache_key(
            "search", query=query.lower().strip(), page=page, per_page=per_page
        )

        cached = await self.redis.get(cache_key)
        if cached:
            return json.loads(cached)

        return None

    async def set_search_cache(
        self,
        query: str,
        page: int,
        per_page: int,
        data: dict[str, Any],
        ttl: int | None = None,
    ) -> None:
        """Cache search results."""
        cache_key = self._get_cache_key(
            "search", query=query.lower().strip(), page=page, per_page=per_page
        )

        await self.redis.setex(cache_key, ttl or self.default_ttl, json.dumps(data))

    # ============================================
    # CACHE INVALIDATION
    # ============================================

    async def invalidate_seasonal(self, season: str, year: int) -> None:
        """Manually invalidate seasonal cache."""
        cache_key = self._get_cache_key("seasonal", season=season, year=year)
        await self.redis.delete(cache_key)

    async def invalidate_search(self, query: str) -> None:
        """Manually invalidate all search caches for a query."""
        # Pattern matching for all search keys
        pattern = f"{settings.cache_prefix_l1}:anime:search:*{query.lower().strip()}*"
        cursor = 0
        while True:
            cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
            if keys:
                await self.redis.delete(*keys)
            if cursor == 0:
                break
        # keys = await self.redis.keys(pattern)
        # if keys:
        #     await self.redis.delete(*keys)

    async def clear_all(self) -> None:
        """Clear all anime caches (admin use only)."""
        pattern = f"{settings.cache_prefix_l1}:anime:*"
        cursor = 0
        while True:
            cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
            if keys:
                await self.redis.delete(*keys)
            if cursor == 0:
                break
        # keys = await self.redis.keys(pattern)
        # if keys:
        #     await self.redis.delete(*keys)

    async def acquire_lock(self, lock_key: str, ttl: int = 15) -> bool:
        """
        Try to take distributed lock.
        Return True if success (Winner), False if failed (Loser)
        """
        result = await self.redis.set(lock_key, "locked", nx=True, ex=ttl)
        return bool(result)

    async def release_lock(self, lock_key: str) -> None:
        """Release lock (Use when error)."""
        await self.redis.delete(lock_key)
