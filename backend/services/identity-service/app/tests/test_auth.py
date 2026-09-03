async def test_register_user_success(client):
    res = await client.post("/auth/register", json={
        "user_name": "newuser",
        "email": "newuser@example.com",
        "password": "supersecret123",
    })
    assert res.status_code == 201
    body = res.json()
    assert body["user_name"] == "newuser"
    assert body["email"] == "newuser@example.com"
    assert "password" not in body
    assert "password_hash" not in body


async def test_register_grants_welcome_bonus_wallet(client):
    res = await client.post("/auth/register", json={
        "user_name": "bonususer",
        "email": "bonususer@example.com",
        "password": "supersecret123",
    })
    assert res.status_code == 201
    user_id = res.json()["id"]

    login = await client.post("/auth/login", json={
        "email": "bonususer@example.com",
        "password": "supersecret123",
    })
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    wallet = await client.get(f"/users/{user_id}/wallet", headers=headers)
    assert wallet.status_code == 200, wallet.text
    assert wallet.json()["balance"] == 100


async def test_register_duplicate_email_fails(client, seeded_user):
    res = await client.post("/auth/register", json={
        "user_name": "anotherguy",
        "email": "test@example.com",
        "password": "supersecret123",
    })
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()


async def test_register_password_too_short_fails_validation(client):
    res = await client.post("/auth/register", json={
        "user_name": "shortpw",
        "email": "shortpw@example.com",
        "password": "abc123",
    })
    assert res.status_code == 422


async def test_login_success(client, seeded_user):
    res = await client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "secret123",
    })
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert "access_token" in body


async def test_login_wrong_password_fails(client, seeded_user):
    res = await client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert res.status_code == 401
    assert "invalid" in res.json()["detail"].lower()


async def test_login_unknown_email_fails(client):
    res = await client.post("/auth/login", json={
        "email": "doesnotexist@example.com",
        "password": "whatever123",
    })
    assert res.status_code == 401


async def test_get_me_requires_auth(client):
    res = await client.get("/auth/me")
    assert res.status_code in (401, 403)


async def test_get_me_with_valid_token(client, auth_headers):
    res = await client.get("/auth/me", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == "test@example.com"
    assert body["user_name"] == "testuser"