from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.core.security import decode_access_token
from app.core.exceptions import InvalidTokenException, ForbiddenException
from app.common.enums import UserRole

# HTTP Bearer scheme — same reasoning as identity-service: Swagger gets a
# plain "paste your token" field instead of an OAuth2 login form.
bearer_scheme = HTTPBearer()


class CurrentUser(BaseModel):
    """
    Stand-in for identity-service's full User model. This service has no
    `users` table, so it can't (and shouldn't) look the user up — it
    trusts the JWT's signature (shared SECRET_KEY with identity-service)
    and reads identity + role straight out of the token claims instead.

    If a route needs *display* data about the user (name, avatar, bio)
    rather than just identity/authorization, fetch that separately via
    IdentityClient (app/clients/identity_client.py) — don't try to grow
    this model into a duplicate of the real User.
    """
    id: UUID
    role: UserRole


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> CurrentUser:
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    role = payload.get("role")

    if user_id is None or role is None:
        raise InvalidTokenException("Token payload is invalid")

    return CurrentUser(id=UUID(user_id), role=UserRole(role))


async def require_admin(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    if current_user.role != UserRole.ADMIN:
        raise ForbiddenException("Admin priviledges required")

    return current_user
