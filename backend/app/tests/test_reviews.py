async def test_create_review_success(
    client, second_user_auth_headers, seeded_user, second_user_profile
):
    """second_user reviews seeded_user."""
    res = await client.post(
        f"/users/{seeded_user.id}/reviews",
        json={"rating": 5, "comment": "Great mentor!"},
        headers=second_user_auth_headers,
    )
    assert res.status_code == 201
    body = res.json()
    assert body["rating"] == 5
    assert body["comment"] == "Great mentor!"
    assert body["reviewer_name"] == "seconduser"


async def test_cannot_review_yourself(client, auth_headers, seeded_user):
    res = await client.post(
        f"/users/{seeded_user.id}/reviews",
        json={"rating": 5, "comment": "Self praise"},
        headers=auth_headers,
    )
    assert res.status_code == 403
    assert "yourself" in res.json()["detail"].lower()


async def test_review_nonexistent_user_fails(client, auth_headers):
    import uuid
    res = await client.post(
        f"/users/{uuid.uuid4()}/reviews",
        json={"rating": 4},
        headers=auth_headers,
    )
    assert res.status_code == 404


async def test_review_rating_out_of_range_fails_validation(
    client, second_user_auth_headers, seeded_user
):
    res = await client.post(
        f"/users/{seeded_user.id}/reviews",
        json={"rating": 6},  # exceeds le=5
        headers=second_user_auth_headers,
    )
    assert res.status_code == 422


async def test_create_review_requires_auth(client, seeded_user):
    res = await client.post(
        f"/users/{seeded_user.id}/reviews",
        json={"rating": 5},
    )
    assert res.status_code in (401, 403)


async def test_get_reviews_for_user(
    client, auth_headers, second_user_auth_headers, seeded_user, second_user_profile
):
    """second_user leaves a review, then anyone authenticated can list it."""
    await client.post(
        f"/users/{seeded_user.id}/reviews",
        json={"rating": 4, "comment": "Solid session"},
        headers=second_user_auth_headers,
    )

    res = await client.get(f"/users/{seeded_user.id}/reviews", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["rating"] == 4
    assert body["items"][0]["reviewer_name"] == "Second User"  # from profile.full_name


async def test_get_reviews_empty_for_user_with_none(client, auth_headers, seeded_user):
    res = await client.get(f"/users/{seeded_user.id}/reviews", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 0
    assert body["items"] == []


async def test_get_reviews_pagination_limit(
    client, auth_headers, second_user_auth_headers, admin_auth_headers,
    seeded_user, second_user_profile, seeded_admin,
):
    """Leave 2 reviews on seeded_user, request limit=1."""
    await client.post(
        f"/users/{seeded_user.id}/reviews",
        json={"rating": 5, "comment": "First"},
        headers=second_user_auth_headers,
    )
    await client.post(
        f"/users/{seeded_user.id}/reviews",
        json={"rating": 3, "comment": "Second"},
        headers=admin_auth_headers,
    )

    res = await client.get(f"/users/{seeded_user.id}/reviews?limit=1", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 2          # count ignores limit
    assert len(body["items"]) == 1     # items respects limit