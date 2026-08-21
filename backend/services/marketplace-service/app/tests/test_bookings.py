async def test_create_booking_success(client, second_user_auth_headers, seeded_skill):
    res = await client.post("/bookings", json={
        "skillId": str(seeded_skill.id),
        "sessionDate": "2026-01-01T10:00:00Z",
    }, headers=second_user_auth_headers)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "PENDING"


async def test_cannot_book_own_skill(client, auth_headers, seeded_skill):
    """seeded_skill's instructor is seeded_user — booking your own skill should fail."""
    res = await client.post("/bookings", json={
        "skillId": str(seeded_skill.id),
        "sessionDate": "2026-01-01T10:00:00Z",
    }, headers=auth_headers)
    assert res.status_code == 400
    assert "cannot book your own" in res.json()["detail"].lower()


async def test_get_booking_forbidden_for_unrelated_user(client, seeded_booking):
    """A third user who is neither learner nor mentor can't view the booking."""
    from app.tests.conftest import FakeUser, _token_for

    stranger = FakeUser()
    headers = {"Authorization": f"Bearer {_token_for(stranger)}"}

    res = await client.get(f"/bookings/{seeded_booking.id}", headers=headers)
    assert res.status_code == 403


async def test_mentor_can_confirm_booking(client, auth_headers, seeded_booking):
    """seeded_user is the mentor on seeded_booking."""
    res = await client.patch(
        f"/bookings/{seeded_booking.id}/status",
        json={"status": "CONFIRMED"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "CONFIRMED"


async def test_learner_cannot_confirm_booking(client, second_user_auth_headers, seeded_booking):
    """second_user is the learner, not the mentor — confirming should be forbidden."""
    res = await client.patch(
        f"/bookings/{seeded_booking.id}/status",
        json={"status": "CONFIRMED"},
        headers=second_user_auth_headers,
    )
    assert res.status_code == 403


async def test_learner_can_cancel_own_booking(client, second_user_auth_headers, seeded_booking):
    res = await client.patch(
        f"/bookings/{seeded_booking.id}/status",
        json={"status": "CANCELLED"},
        headers=second_user_auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["status"] == "CANCELLED"


async def test_list_my_bookings_as_learner(client, second_user_auth_headers, seeded_booking):
    res = await client.get("/bookings/me", headers=second_user_auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] == 1


async def test_list_my_bookings_as_mentor(client, auth_headers, seeded_booking):
    res = await client.get("/bookings/me?as_mentor=true", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total"] == 1