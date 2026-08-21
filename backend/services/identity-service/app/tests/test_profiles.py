async def test_get_own_profile_success(client, auth_headers, seeded_user, seeded_profile):
    res = await client.get(f"/users/{seeded_user.id}/profile", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["user_name"] == "Test User"
    assert body["skills_taught"] == ["python"]
    assert body["skills_taught_total"] == 1


async def test_get_profile_not_found(client, auth_headers, seeded_user):
    """seeded_user has no Profile row seeded in this test — should 404."""
    res = await client.get(f"/users/{seeded_user.id}/profile", headers=auth_headers)
    assert res.status_code == 404


async def test_get_other_users_profile_forbidden(
    client, auth_headers, second_user, second_user_profile
):
    """seeded_user (via auth_headers) tries to view second_user's profile."""
    res = await client.get(f"/users/{second_user.id}/profile", headers=auth_headers)
    assert res.status_code == 403


async def test_admin_can_get_any_profile(
    client, admin_auth_headers, second_user, second_user_profile
):
    res = await client.get(f"/users/{second_user.id}/profile", headers=admin_auth_headers)
    assert res.status_code == 200
    assert res.json()["user_name"] == "Second User"


async def test_update_own_profile_success(client, auth_headers, seeded_user, seeded_profile):
    res = await client.patch(
        f"/users/{seeded_user.id}/profile",
        json={"user_name": "Updated Name", "bio": "New bio"},
        headers=auth_headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["user_name"] == "Updated Name"
    assert body["bio"] == "New bio"


async def test_update_profile_is_partial(client, auth_headers, seeded_user, seeded_profile):
    """PATCH should only touch fields explicitly sent — bio stays unchanged."""
    res = await client.patch(
        f"/users/{seeded_user.id}/profile",
        json={"age": 30},
        headers=auth_headers,
    )
    assert res.status_code == 200
    body = res.json()
    assert body["age"] == 30
    assert body["bio"] == "A test bio"  # untouched from seeded_profile


async def test_update_other_users_profile_forbidden(
    client, auth_headers, second_user, second_user_profile
):
    res = await client.patch(
        f"/users/{second_user.id}/profile",
        json={"user_name": "Hacked"},
        headers=auth_headers,
    )
    assert res.status_code == 403


async def test_update_profile_requires_auth(client, seeded_user, seeded_profile):
    res = await client.patch(
        f"/users/{seeded_user.id}/profile",
        json={"user_name": "No Auth"},
    )
    assert res.status_code in (401, 403)


async def test_update_profile_invalid_age_fails_validation(
    client, auth_headers, seeded_user, seeded_profile
):
    res = await client.patch(
        f"/users/{seeded_user.id}/profile",
        json={"age": 999},  # exceeds le=150
        headers=auth_headers,
    )
    assert res.status_code == 422