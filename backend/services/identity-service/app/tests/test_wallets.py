import uuid

import pytest_asyncio

from app.modules.wallets.models import Wallet


@pytest_asyncio.fixture
async def seeded_wallet(db_session, seeded_user):
    """A wallet for seeded_user with a known starting balance. Not
    created automatically by the seeded_user fixture (that only inserts
    a User row directly, bypassing AuthService.create_user, which is
    where a wallet normally gets created on real registration)."""
    wallet = Wallet(user_id=seeded_user.id, balance=100)
    db_session.add(wallet)
    await db_session.commit()
    await db_session.refresh(wallet)
    return wallet


@pytest_asyncio.fixture
async def second_user_wallet(db_session, second_user):
    wallet = Wallet(user_id=second_user.id, balance=0)
    db_session.add(wallet)
    await db_session.commit()
    await db_session.refresh(wallet)
    return wallet


# ---------- GET /users/{id}/wallet ----------


async def test_get_own_wallet_success(client, auth_headers, seeded_user, seeded_wallet):
    res = await client.get(f"/users/{seeded_user.id}/wallet", headers=auth_headers)
    assert res.status_code == 200, res.text
    assert res.json()["balance"] == 100


async def test_get_other_users_wallet_forbidden(
    client, second_user_auth_headers, seeded_user, seeded_wallet
):
    res = await client.get(f"/users/{seeded_user.id}/wallet", headers=second_user_auth_headers)
    assert res.status_code == 403


async def test_admin_can_get_any_wallet(client, admin_auth_headers, seeded_user, seeded_wallet):
    res = await client.get(f"/users/{seeded_user.id}/wallet", headers=admin_auth_headers)
    assert res.status_code == 200, res.text


async def test_get_wallet_not_found(client, auth_headers, seeded_user):
    # No seeded_wallet fixture used — seeded_user has no wallet row.
    res = await client.get(f"/users/{seeded_user.id}/wallet", headers=auth_headers)
    assert res.status_code == 404


# ---------- POST /users/{id}/wallet/topup ----------


async def test_top_up_own_wallet_succeeds(client, auth_headers, seeded_user, seeded_wallet):
    res = await client.post(
        f"/users/{seeded_user.id}/wallet/topup",
        json={"amount": 50, "description": "Test top-up"},
        headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["balance"] == 150


async def test_top_up_other_users_wallet_forbidden(
    client, second_user_auth_headers, seeded_user, seeded_wallet
):
    res = await client.post(
        f"/users/{seeded_user.id}/wallet/topup",
        json={"amount": 50},
        headers=second_user_auth_headers,
    )
    assert res.status_code == 403


# ---------- POST /internal/wallets/charge ----------
# No auth header on any of these — internal endpoints, same as
# /internal/users/{id}/public.


async def test_charge_wallet_success(client, seeded_user, seeded_wallet):
    booking_id = uuid.uuid4()
    res = await client.post(
        "/internal/wallets/charge",
        json={"user_id": str(seeded_user.id), "amount": 30, "booking_id": str(booking_id)},
    )
    assert res.status_code == 200, res.text
    assert res.json()["balance"] == 70


async def test_charge_wallet_insufficient_balance(client, seeded_user, seeded_wallet):
    booking_id = uuid.uuid4()
    res = await client.post(
        "/internal/wallets/charge",
        json={"user_id": str(seeded_user.id), "amount": 1000, "booking_id": str(booking_id)},
    )
    assert res.status_code == 422
    assert "insufficient" in res.json()["detail"].lower()


async def test_charge_wallet_not_found(client):
    res = await client.post(
        "/internal/wallets/charge",
        json={"user_id": str(uuid.uuid4()), "amount": 10, "booking_id": str(uuid.uuid4())},
    )
    assert res.status_code == 404


async def test_charge_wallet_is_idempotent_on_booking_id(client, seeded_user, seeded_wallet):
    booking_id = uuid.uuid4()
    payload = {"user_id": str(seeded_user.id), "amount": 30, "booking_id": str(booking_id)}

    first = await client.post("/internal/wallets/charge", json=payload)
    assert first.status_code == 200, first.text
    assert first.json()["balance"] == 70

    # Retried request for the SAME booking_id — must not charge again.
    second = await client.post("/internal/wallets/charge", json=payload)
    assert second.status_code == 200, second.text
    assert second.json()["balance"] == 70


# ---------- POST /internal/wallets/credit ----------


async def test_credit_wallet_success(client, seeded_user, seeded_wallet):
    booking_id = uuid.uuid4()
    res = await client.post(
        "/internal/wallets/credit",
        json={"user_id": str(seeded_user.id), "amount": 40, "booking_id": str(booking_id)},
    )
    assert res.status_code == 200, res.text
    assert res.json()["balance"] == 140


async def test_credit_wallet_not_found(client):
    res = await client.post(
        "/internal/wallets/credit",
        json={"user_id": str(uuid.uuid4()), "amount": 10, "booking_id": str(uuid.uuid4())},
    )
    assert res.status_code == 404


async def test_credit_wallet_is_idempotent_on_booking_id(client, seeded_user, seeded_wallet):
    booking_id = uuid.uuid4()
    payload = {"user_id": str(seeded_user.id), "amount": 40, "booking_id": str(booking_id)}

    first = await client.post("/internal/wallets/credit", json=payload)
    assert first.status_code == 200, first.text
    assert first.json()["balance"] == 140

    second = await client.post("/internal/wallets/credit", json=payload)
    assert second.status_code == 200, second.text
    assert second.json()["balance"] == 140
