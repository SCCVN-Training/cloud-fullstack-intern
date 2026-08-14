"""
Profile Module Rate Limits - Self-contained.
Profile controls its own limits.
"""
from typing import Tuple
from fastapi import Request

from shared.rate_limiter import BaseRateLimiter, get_rate_limiter
from shared.config import settings


class ProfileRateLimiter:
    """Rate limiter specifically for profile module."""

    def __init__(self, rate_limiter: BaseRateLimiter):
        self.rate_limiter = rate_limiter
        self.module_prefix = "profile"

    async def check_get_profile(self, user_id: str) -> Tuple[bool, int, int]:
        """
        Check rate limit for getting profile.

        ✅ 60 requests per minute per user
        ✅ Profile data changes infrequently, but users may refresh often
        """
        limit, window = settings.get_rate_limit("profile", "get_profile")
        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:{user_id}",
            endpoint="get_profile",
            limit=limit,
            window_seconds=window,
        )

    async def check_update_profile(self, user_id: str) -> Tuple[bool, int, int]:
        """
        Check rate limit for updating profile.

        ✅ 30 requests per minute per user
        ✅ Users shouldn't spam updates (also protects database)
        """
        limit, window = settings.get_rate_limit("profile", "update_profile")
        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:user:{user_id}",
            endpoint="update_profile",
            limit=limit,
            window_seconds=window,
        )

    async def check_delete_profile(self, user_id: str) -> Tuple[bool, int, int]:
        """
        Check rate limit for deleting profile.

        ✅ 3 requests per minute per user
        ✅ Deletion is destructive - should be rate limited aggressively
        """
        limit, window = settings.get_rate_limit("profile", "delete_profile")
        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:user:{user_id}",
            endpoint="delete_profile",
            limit=limit,
            window_seconds=window,
        )

    async def check_create_profile(self, user_id: str) -> Tuple[bool, int, int]:
        """
        Check rate limit for creating profile.

        ✅ 3 requests per minute per user
        ✅ Each user should only create one profile
        """
        limit, window = settings.get_rate_limit("profile", "create_profile")
        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:user:{user_id}",
            endpoint="create_profile",
            limit=limit,
            window_seconds=window,
        )

    # async def check_upload_avatar(self, user_id: str) -> Tuple[bool, int, int]:
    #     """
    #     Check rate limit for avatar upload.

    #     ✅ 10 requests per minute per user
    #     ✅ File uploads are expensive (storage, bandwidth)
    #     """
    #     return await self.rate_limiter.check(
    #         identifier=f"{self.module_prefix}:avatar:user:{user_id}",
    #         endpoint="upload_avatar",
    #         limit=10,
    #         window_seconds=60,
    #     )

    # async def check_upload_banner(self, user_id: str) -> Tuple[bool, int, int]:
    #     """
    #     Check rate limit for banner upload.

    #     ✅ 5 requests per minute per user
    #     ✅ Banner files are larger, so stricter limit
    #     """
    #     return await self.rate_limiter.check(
    #         identifier=f"{self.module_prefix}:banner:user:{user_id}",
    #         endpoint="upload_banner",
    #         limit=5,
    #         window_seconds=60,
    #     )

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        # Handle case where request.client is None
        if request.client:
            return request.client.host or "unknown"

        return "unknown"


# ============================================
# DEPENDENCY INJECTION
# ============================================
async def get_profile_rate_limiter() -> ProfileRateLimiter:
    """Dependency for profile module rate limiter."""
    base_limiter = await get_rate_limiter()
    return ProfileRateLimiter(base_limiter)
