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


# ---------- Wallet charge on booking creation ----------


async def test_create_booking_charges_the_learner(
    client, second_user_auth_headers, seeded_skill, monkeypatch
):
    from app.clients.identity_client import IdentityClient

    calls = []

    async def spy_charge_booking(learner_id, amount, booking_id):
        calls.append((learner_id, amount, booking_id))

    monkeypatch.setattr(IdentityClient, "charge_booking", staticmethod(spy_charge_booking))

    res = await client.post(
        "/bookings",
        json={"skillId": str(seeded_skill.id), "sessionDate": "2026-01-01T10:00:00Z"},
        headers=second_user_auth_headers,
    )
    assert res.status_code == 201, res.text
    assert len(calls) == 1
    learner_id, amount, booking_id = calls[0]
    assert amount == seeded_skill.price
    assert str(booking_id) == res.json()["id"]


async def test_create_booking_fails_when_charge_fails(
    client, second_user_auth_headers, seeded_skill, monkeypatch
):
    from app.clients.identity_client import IdentityClient, BookingPaymentError

    async def failing_charge(learner_id, amount, booking_id):
        raise BookingPaymentError(422, "Insufficient balance: wallet has 0, booking costs 40")

    monkeypatch.setattr(IdentityClient, "charge_booking", staticmethod(failing_charge))

    res = await client.post(
        "/bookings",
        json={"skillId": str(seeded_skill.id), "sessionDate": "2026-01-01T10:00:00Z"},
        headers=second_user_auth_headers,
    )
    assert res.status_code == 422
    assert "insufficient balance" in res.json()["detail"].lower()


async def test_create_booking_does_not_create_a_row_when_charge_fails(
    client, second_user_auth_headers, seeded_skill, monkeypatch
):
    """A failed charge must not leave a PENDING booking behind — verified
    via the learner's own booking list, not just the response status."""
    from app.clients.identity_client import IdentityClient, BookingPaymentError

    async def failing_charge(learner_id, amount, booking_id):
        raise BookingPaymentError(422, "Insufficient balance")

    monkeypatch.setattr(IdentityClient, "charge_booking", staticmethod(failing_charge))

    await client.post(
        "/bookings",
        json={"skillId": str(seeded_skill.id), "sessionDate": "2026-01-01T10:00:00Z"},
        headers=second_user_auth_headers,
    )

    res = await client.get("/bookings/me", headers=second_user_auth_headers)
    assert res.json()["total"] == 0


# ---------- Overlap check ----------


async def test_cannot_create_overlapping_booking_for_same_mentor(
    client, second_user_auth_headers, seeded_skill
):
    """A second booking for the same mentor at the exact same
    session_date must be rejected. Both requests go through the same
    POST /bookings path (rather than seeding the first one directly via
    the ORM) so the two session_date values are guaranteed to be stored
    identically — SQLite's string-based DateTime comparison can
    otherwise mismatch on microsecond formatting between an
    ORM-constructed datetime and one round-tripped through JSON."""
    same_time = "2029-06-15T10:00:00Z"

    first = await client.post(
        "/bookings",
        json={"skillId": str(seeded_skill.id), "sessionDate": same_time},
        headers=second_user_auth_headers,
    )
    assert first.status_code == 201, first.text

    second = await client.post(
        "/bookings",
        json={"skillId": str(seeded_skill.id), "sessionDate": same_time},
        headers=second_user_auth_headers,
    )
    assert second.status_code == 409
    assert "already has a booking" in second.json()["detail"].lower()


async def test_can_book_same_mentor_at_a_different_time(
    client, second_user_auth_headers, seeded_skill, seeded_booking
):
    res = await client.post(
        "/bookings",
        json={"skillId": str(seeded_skill.id), "sessionDate": "2030-01-01T10:00:00Z"},
        headers=second_user_auth_headers,
    )
    assert res.status_code == 201, res.text


# ---------- Wallet credit on completion ----------


async def test_completing_a_booking_credits_the_mentor(client, auth_headers, seeded_booking, monkeypatch):
    from app.clients.identity_client import IdentityClient

    calls = []

    async def spy_credit_booking(mentor_id, amount, booking_id):
        calls.append((mentor_id, amount, booking_id))

    monkeypatch.setattr(IdentityClient, "credit_booking", staticmethod(spy_credit_booking))

    res = await client.patch(
        f"/bookings/{seeded_booking.id}/status",
        json={"status": "COMPLETED"},
        headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["creditStatus"] == "CREDITED"
    assert len(calls) == 1
    mentor_id, amount, booking_id = calls[0]
    assert amount == seeded_booking.price_paid


async def test_completing_a_booking_still_succeeds_when_credit_fails(
    client, auth_headers, seeded_booking, monkeypatch
):
    """The session already happened — a wallet-side failure must not
    block the booking from being marked COMPLETED, only be surfaced via
    creditStatus for manual follow-up."""
    from app.clients.identity_client import IdentityClient, BookingPaymentError

    async def failing_credit(mentor_id, amount, booking_id):
        raise BookingPaymentError(503, "Could not reach the payments service.")

    monkeypatch.setattr(IdentityClient, "credit_booking", staticmethod(failing_credit))

    res = await client.patch(
        f"/bookings/{seeded_booking.id}/status",
        json={"status": "COMPLETED"},
        headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "COMPLETED"
    assert res.json()["creditStatus"] == "FAILED"


async def test_confirming_a_booking_does_not_touch_credit_status(client, auth_headers, seeded_booking):
    """creditStatus is only meaningful on a COMPLETED transition."""
    res = await client.patch(
        f"/bookings/{seeded_booking.id}/status",
        json={"status": "CONFIRMED"},
        headers=auth_headers,
    )
    assert res.status_code == 200, res.text


# ---------- GET /bookings (admin-only, all bookings) ----------


async def test_admin_can_list_all_bookings(client, admin_auth_headers, seeded_booking):
    res = await client.get("/bookings", headers=admin_auth_headers)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total"] == 1
    assert body["bookings"][0]["id"] == str(seeded_booking.id)


async def test_non_admin_cannot_list_all_bookings(client, auth_headers, seeded_booking):
    res = await client.get("/bookings", headers=auth_headers)
    assert res.status_code == 403


async def test_admin_list_all_bookings_filters_by_status(
    client, admin_auth_headers, second_user_auth_headers, seeded_skill
):
    booking_res = await client.post(
        "/bookings",
        json={"skillId": str(seeded_skill.id), "sessionDate": "2026-01-01T10:00:00Z"},
        headers=second_user_auth_headers,
    )
    assert booking_res.status_code == 201, booking_res.text

    res = await client.get("/bookings", params={"status": "PENDING"}, headers=admin_auth_headers)
    assert res.status_code == 200, res.text
    assert res.json()["total"] == 1

    res = await client.get("/bookings", params={"status": "COMPLETED"}, headers=admin_auth_headers)
    assert res.status_code == 200, res.text
    assert res.json()["total"] == 0