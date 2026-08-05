# modules/auth/rate_limit.py (already have this)

from typing import Tuple
from fastapi import Request
from shared.rate_limiter import BaseRateLimiter, get_rate_limiter
from shared.config import settings


class AuthRateLimiter:
    """Auth module rate limiter."""

    def __init__(self, rate_limiter: BaseRateLimiter):
        self.rate_limiter = rate_limiter
        self.module_prefix = "auth"

    async def check_login(self, request: Request) -> Tuple[bool, int, int]:
        """Check rate limit for login."""
        # ✅ Use IP as identifier (no user_id yet)
        ip = self._get_client_ip(request)

        limit, window = settings.get_rate_limit("auth", "login")

        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:ip:{ip}",
            endpoint="login",
            limit=limit,
            window_seconds=window,
        )

    async def check_register(self, request: Request) -> Tuple[bool, int, int]:
        """Check rate limit for registration."""
        ip = self._get_client_ip(request)

        limit, window = settings.get_rate_limit("auth", "register")

        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:ip:{ip}",
            endpoint="register",
            limit=limit,
            window_seconds=window,
        )

    async def check_refresh(self, request: Request) -> Tuple[bool, int, int]:
        """Check rate limit for refresh."""
        ip = self._get_client_ip(request)

        limit, window = settings.get_rate_limit("auth", "refresh")

        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:ip:{ip}",
            endpoint="refresh",
            limit=limit,
            window_seconds=window,
        )

    async def check_me(self, request: Request) -> Tuple[bool, int, int]:
        """Check rate limit for /me endpoint."""
        ip = self._get_client_ip(request)

        limit, window = settings.get_rate_limit("auth", "me")

        return await self.rate_limiter.check(
            identifier=f"{self.module_prefix}:ip:{ip}",
            endpoint="me",
            limit=limit,
            window_seconds=window,
        )

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP from request."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host or "unknown"


# ============================================
# DEPENDENCY INJECTION
# ============================================
async def get_auth_rate_limiter() -> AuthRateLimiter:
    """Dependency for auth rate limiter."""
    base_limiter = get_rate_limiter()
    return AuthRateLimiter(base_limiter)
