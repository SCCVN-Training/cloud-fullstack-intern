import logging
import uuid
from typing import Optional, TypedDict

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


class PublicProfile(TypedDict):
    user_id: str
    # Already resolved server-side by identity-service: the user's
    # display-name override if set, otherwise their login handle. This
    # service never needs to know two underlying columns exist.
    user_name: str
    avatar_url: Optional[str]
    bio: Optional[str]
    title: Optional[str]


# Fallback shown whenever identity-service can't be reached or the user
# doesn't exist there. Keeping this as one constant (rather than
# scattering "Unknown Instructor" literals through skills/bookings/
# reviews) means a UX tweak here is a one-line change everywhere.
_UNKNOWN_PROFILE: PublicProfile = {
    "user_id": "",
    "user_name": "Unknown User",
    "avatar_url": "https://ui-avatars.com/api/?name=User",
    "bio": "",
    "title": "Mentor",
}


class BookingPaymentError(Exception):
    """
    Raised by charge_booking/credit_booking on ANY failure — unlike
    get_public_profile's graceful "Unknown User" degradation, a wallet
    operation must never be silently swallowed. status_code mirrors
    identity-service's real response where there is one (422 insufficient
    balance, 404 no wallet), or a synthesized one otherwise (503
    unreachable, 502 unexpected response) — callers use it directly to
    build the HTTPException they raise to the frontend.
    """

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class IdentityClient:
    """
    The one deliberate synchronous REST call this service makes to
    identity-service — fetching display data (name/avatar/bio) for a
    user_id this service only knows as an opaque UUID (see
    Skill.instructor_id, Booking.learner_id/mentor_id,
    Review.reviewer_id/reviewee_id — none of them are real FKs anymore,
    see the comments in those models).

    Trade-off, intentionally accepted for a training-project scope: if
    identity-service is down or slow, every skill/booking/review list in
    this service degrades to "Unknown User" rather than failing outright
    (see the try/except below) — availability over consistency for a
    read-only display field. A production system might instead cache
    the last-known profile, or move this off the request path entirely
    via an async event (see docs/architecture.md's messaging discussion).
    """

    _timeout = httpx.Timeout(3.0, connect=2.0)

    @classmethod
    async def get_public_profile(cls, user_id: uuid.UUID) -> PublicProfile:
        url = f"{settings.IDENTITY_SERVICE_URL}/internal/users/{user_id}/public"
        try:
            async with httpx.AsyncClient(timeout=cls._timeout) as client:
                resp = await client.get(url)
                if resp.status_code == 404:
                    return {**_UNKNOWN_PROFILE, "user_id": str(user_id)}
                resp.raise_for_status()
                return resp.json()
        except httpx.RequestError as exc:
            # Network-level failure (identity-service down, DNS, timeout, ...)
            logger.warning("identity-service unreachable for user %s: %s", user_id, exc)
            return {**_UNKNOWN_PROFILE, "user_id": str(user_id)}
        except httpx.HTTPStatusError as exc:
            # identity-service responded but with an unexpected error (5xx etc.)
            logger.warning("identity-service error for user %s: %s", user_id, exc)
            return {**_UNKNOWN_PROFILE, "user_id": str(user_id)}

    @classmethod
    async def user_exists(cls, user_id: uuid.UUID) -> bool:
        """
        Distinguishes "identity-service confirmed this user doesn't
        exist" (real 404) from "couldn't reach identity-service" — unlike
        get_public_profile(), which deliberately collapses both cases
        into the same friendly fallback for display purposes. Use this
        where the caller needs a genuine existence check (e.g. raising
        404 on GET /users/{id}/reviews for a bogus id) rather than just
        decorating a response.

        On network failure this fails *open* (returns True) rather than
        incorrectly reporting "doesn't exist" — an identity-service
        outage should degrade marketplace-service's own checks, not
        masquerade as a 404 for a real user.
        """
        url = f"{settings.IDENTITY_SERVICE_URL}/internal/users/{user_id}/public"
        try:
            async with httpx.AsyncClient(timeout=cls._timeout) as client:
                resp = await client.get(url)
                if resp.status_code == 404:
                    return False
                resp.raise_for_status()
                return True
        except (httpx.RequestError, httpx.HTTPStatusError) as exc:
            logger.warning("identity-service unreachable checking existence of %s: %s", user_id, exc)
            return True

    # POST /internal/wallets/charge — debits the learner's wallet for a
    # booking. Called from BookingService.create_booking BEFORE the
    # Booking row is inserted (see that method's docstring for why).
    # Raises BookingPaymentError on any failure; callers must treat that
    # as "booking creation failed", never create the booking anyway.
    @classmethod
    async def charge_booking(cls, learner_id: uuid.UUID, amount: int, booking_id: uuid.UUID) -> None:
        await cls._wallet_transaction("charge", learner_id, amount, booking_id)

    # POST /internal/wallets/credit — credits the mentor's wallet when a
    # booking completes. Same failure shape as charge_booking; the
    # caller (BookingService.update_status) decides to treat a failure
    # here more forgivingly (booking still completes) — that's a
    # decision for the caller to make, not this client.
    @classmethod
    async def credit_booking(cls, mentor_id: uuid.UUID, amount: int, booking_id: uuid.UUID) -> None:
        await cls._wallet_transaction("credit", mentor_id, amount, booking_id)

    @classmethod
    async def _wallet_transaction(
        cls, action: str, user_id: uuid.UUID, amount: int, booking_id: uuid.UUID
    ) -> None:
        url = f"{settings.IDENTITY_SERVICE_URL}/internal/wallets/{action}"
        payload = {"user_id": str(user_id), "amount": amount, "booking_id": str(booking_id)}

        try:
            async with httpx.AsyncClient(timeout=cls._timeout) as client:
                resp = await client.post(url, json=payload)
        except httpx.RequestError as exc:
            logger.error(
                "identity-service unreachable during wallet %s for booking %s: %s",
                action, booking_id, exc,
            )
            raise BookingPaymentError(
                503, "Could not reach the payments service. Please try again."
            ) from exc

        if resp.status_code == 200:
            return

        try:
            detail = resp.json().get("detail", resp.text)
        except ValueError:
            detail = resp.text

        if resp.status_code in (422, 404):
            # Real, well-formed rejection from identity-service —
            # insufficient balance (422) or no wallet found (404).
            logger.warning("wallet %s rejected for booking %s: %s", action, booking_id, detail)
            raise BookingPaymentError(resp.status_code, detail)

        logger.error(
            "identity-service returned unexpected status %s during wallet %s for booking %s: %s",
            resp.status_code, action, booking_id, detail,
        )
        raise BookingPaymentError(502, "Unexpected error from the payments service.")
