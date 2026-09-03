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


async def test_create_review_updates_skill_rating_and_review_count(
    client, second_user_auth_headers, completed_booking, seeded_skill
):
    """seeded_skill starts at rating=0.0/review_count=0 (model defaults)."""
    res = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=second_user_auth_headers,
    )
    assert res.status_code == 201

    skill_res = await client.get(f"/skills/{seeded_skill.id}")
    assert skill_res.status_code == 200
    body = skill_res.json()
    assert body["rating"] == 5.0
    assert body["reviewCount"] == 1


async def test_second_review_averages_into_skill_rating(
    client, auth_headers, second_user_auth_headers, completed_booking, seeded_skill, seeded_user
):
    """completed_booking (rating=5) plus a second, separately-created
    completed booking on the same skill (rating=3) should average to 4.0,
    not just reflect whichever review landed most recently."""
    from app.tests.conftest import FakeUser, _token_for

    first = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=second_user_auth_headers,
    )
    assert first.status_code == 201

    third_user = FakeUser()
    third_user_headers = {"Authorization": f"Bearer {_token_for(third_user)}"}

    booking_res = await client.post(
        "/bookings",
        json={"skillId": str(seeded_skill.id), "sessionDate": "2029-03-01T10:00:00Z"},
        headers=third_user_headers,
    )
    assert booking_res.status_code == 201, booking_res.text
    second_booking_id = booking_res.json()["id"]

    # seeded_user is the mentor on seeded_skill — only the mentor (or
    # admin) can move a booking to COMPLETED.
    complete_res = await client.patch(
        f"/bookings/{second_booking_id}/status",
        json={"status": "COMPLETED"},
        headers=auth_headers,
    )
    assert complete_res.status_code == 200, complete_res.text

    second_review = await client.post(
        f"/bookings/{second_booking_id}/reviews",
        json={**VALID_REVIEW_BODY, "rating": 3},
        headers=third_user_headers,
    )
    assert second_review.status_code == 201, second_review.text

    skill_res = await client.get(f"/skills/{seeded_skill.id}")
    assert skill_res.status_code == 200
    body = skill_res.json()
    assert body["rating"] == 4.0
    assert body["reviewCount"] == 2


# ---------- GET /skills/{skill_id}/reviews ----------


async def test_get_skill_reviews_empty_for_skill_with_none(client, auth_headers, seeded_skill):
    res = await client.get(f"/skills/{seeded_skill.id}/reviews", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 0
    assert body["items"] == []


async def test_get_skill_reviews_for_nonexistent_skill_fails(client, auth_headers):
    res = await client.get(f"/skills/{uuid.uuid4()}/reviews", headers=auth_headers)
    assert res.status_code == 404


async def test_get_skill_reviews_requires_auth(client, seeded_skill):
    res = await client.get(f"/skills/{seeded_skill.id}/reviews")
    assert res.status_code in (401, 403)


async def test_get_skill_reviews_returns_reviews_most_recent_first(
    client, auth_headers, second_user_auth_headers, completed_booking, seeded_skill, seeded_user
):
    """completed_booking plus a second, separately-created completed
    booking on the same skill — both reviews should come back, newest
    (the second one) first."""
    from app.tests.conftest import FakeUser, _token_for

    first_review = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=second_user_auth_headers,
    )
    assert first_review.status_code == 201

    third_user = FakeUser()
    third_user_headers = {"Authorization": f"Bearer {_token_for(third_user)}"}

    booking_res = await client.post(
        "/bookings",
        json={"skillId": str(seeded_skill.id), "sessionDate": "2029-04-01T10:00:00Z"},
        headers=third_user_headers,
    )
    assert booking_res.status_code == 201, booking_res.text
    second_booking_id = booking_res.json()["id"]

    complete_res = await client.patch(
        f"/bookings/{second_booking_id}/status",
        json={"status": "COMPLETED"},
        headers=auth_headers,
    )
    assert complete_res.status_code == 200, complete_res.text

    second_review = await client.post(
        f"/bookings/{second_booking_id}/reviews",
        json={**VALID_REVIEW_BODY, "rating": 3, "feedback": "Second review"},
        headers=third_user_headers,
    )
    assert second_review.status_code == 201, second_review.text

    res = await client.get(f"/skills/{seeded_skill.id}/reviews", headers=auth_headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total"] == 2
    assert body["items"][0]["feedback"] == "Second review"
    assert body["items"][1]["feedback"] == "Great mentor!"


async def test_reviews_on_a_different_skill_do_not_leak_into_this_skills_list(
    client, auth_headers, second_user_auth_headers, second_user, completed_booking, seeded_skill
):
    """A review left on a completed booking for a DIFFERENT skill must
    never appear in seeded_skill's review list — this is exactly the
    scenario a wrong join condition would silently break."""
    other_skill_res = await client.post(
        "/skills",
        json={
            "title": "Other Skill", "category": "Tech", "description": "desc",
            "image": "http://x.com/i.jpg", "duration": 30, "level": "Beginner",
            "requirements": "none", "instructor_id": str(second_user.id),
        },
        headers=second_user_auth_headers,
    )
    assert other_skill_res.status_code == 201, other_skill_res.text
    other_skill_id = other_skill_res.json()["id"]

    other_booking_res = await client.post(
        "/bookings",
        json={"skillId": other_skill_id, "sessionDate": "2029-05-01T10:00:00Z"},
        headers=auth_headers,
    )
    assert other_booking_res.status_code == 201, other_booking_res.text
    other_booking_id = other_booking_res.json()["id"]

    # second_user is the instructor/mentor on the other skill.
    complete_res = await client.patch(
        f"/bookings/{other_booking_id}/status",
        json={"status": "COMPLETED"},
        headers=second_user_auth_headers,
    )
    assert complete_res.status_code == 200, complete_res.text

    other_review = await client.post(
        f"/bookings/{other_booking_id}/reviews",
        json={**VALID_REVIEW_BODY, "feedback": "Review for the OTHER skill"},
        headers=auth_headers,
    )
    assert other_review.status_code == 201, other_review.text

    # Also leave a review on seeded_skill via completed_booking, so the
    # list isn't just empty for a trivial reason.
    same_skill_review = await client.post(
        f"/bookings/{completed_booking.id}/reviews",
        json=VALID_REVIEW_BODY,
        headers=second_user_auth_headers,
    )
    assert same_skill_review.status_code == 201

    res = await client.get(f"/skills/{seeded_skill.id}/reviews", headers=auth_headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total"] == 1
    assert all(item["feedback"] != "Review for the OTHER skill" for item in body["items"])


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
