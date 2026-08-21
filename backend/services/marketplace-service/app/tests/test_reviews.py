import uuid

from app.clients.identity_client import IdentityClient

VALID_REVIEW_BODY = {
    "rating": 5,
    "knowledge_rating": 5,
    "communication_rating": 4,
    "video_audio_rating": 5,
    "feedback": "Great mentor!",
}


async def test_create_review_success(
    client, second_user_auth_headers, completed_booking, second_user, stub_identity_client
):
    """second_user is the learner on completed_booking — may review it."""
    stub_identity_client[str(second_user.id)] = "Second User"

    res = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=second_user_auth_headers,
    )
    assert res.status_code == 201
    body = res.json()
    assert body["rating"] == 5
    assert body["knowledge_rating"] == 5
    assert body["feedback"] == "Great mentor!"
    assert body["reviewer_name"] == "Second User"
    assert body["booking_id"] == str(completed_booking.id)


async def test_mentor_cannot_review_own_booking(client, auth_headers, completed_booking):
    """seeded_user is the mentor on completed_booking, not the learner — forbidden."""
    res = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=auth_headers,
    )
    assert res.status_code == 403


async def test_cannot_review_pending_booking(client, second_user_auth_headers, seeded_booking):
    """seeded_booking is PENDING, not COMPLETED — reviewing it should fail."""
    res = await client.post(
        f"/bookings/{seeded_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=second_user_auth_headers,
    )
    assert res.status_code == 403


async def test_review_nonexistent_booking_fails(client, auth_headers):
    res = await client.post(
        f"/bookings/{uuid.uuid4()}/reviews",
        json=VALID_REVIEW_BODY,
        headers=auth_headers,
    )
    assert res.status_code == 404


async def test_cannot_review_same_booking_twice(client, second_user_auth_headers, completed_booking):
    first = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=second_user_auth_headers,
    )
    assert first.status_code == 201

    second = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=second_user_auth_headers,
    )
    assert second.status_code == 409


async def test_review_rating_out_of_range_fails_validation(
    client, second_user_auth_headers, completed_booking
):
    res = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json={**VALID_REVIEW_BODY, "rating": 6},  # exceeds le=5
        headers=second_user_auth_headers,
    )
    assert res.status_code == 422


async def test_create_review_requires_auth(client, completed_booking):
    res = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
    )
    assert res.status_code in (401, 403)


async def test_get_reviews_for_user(
    client, auth_headers, second_user_auth_headers, completed_booking, seeded_user
):
    """second_user leaves a review on completed_booking (mentor=seeded_user),
    then anyone authenticated can list reviews received by seeded_user."""
    create_res = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=second_user_auth_headers,
    )
    assert create_res.status_code == 201

    res = await client.get(f"/users/{seeded_user.id}/reviews", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["rating"] == 5


async def test_get_reviews_empty_for_user_with_none(client, auth_headers, seeded_user):
    res = await client.get(f"/users/{seeded_user.id}/reviews", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 0
    assert body["items"] == []


async def test_get_reviews_for_nonexistent_reviewee_fails(client, auth_headers, monkeypatch):
    """The autouse stub_identity_client fixture always reports users as
    existing (fine for the review-creation tests above, which only care
    about the reviewer/mentor being resolvable) — override it just for
    this test to exercise the real "reviewee doesn't exist" 404 path."""

    async def fake_user_exists(user_id):
        return False

    monkeypatch.setattr(IdentityClient, "user_exists", staticmethod(fake_user_exists))

    res = await client.get(f"/users/{uuid.uuid4()}/reviews", headers=auth_headers)
    assert res.status_code == 404
