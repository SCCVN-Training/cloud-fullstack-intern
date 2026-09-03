async def test_list_skills_public(client, seeded_skill):
    res = await client.get("/skills")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 1
    assert body["skills"][0]["title"] == "Intro to Guitar"


async def test_get_skill_by_id(client, seeded_skill):
    res = await client.get(f"/skills/{seeded_skill.id}")
    assert res.status_code == 200
    assert res.json()["title"] == "Intro to Guitar"


async def test_get_skill_not_found(client):
    import uuid
    res = await client.get(f"/skills/{uuid.uuid4()}")
    assert res.status_code == 404


async def test_create_skill_requires_auth(client):
    res = await client.post("/skills", json={
        "title": "New Skill", "category": "Tech", "description": "desc",
        "image": "http://x.com/i.jpg", "duration": 30, "level": "Beginner",
        "requirements": "none", "instructor_id": str(__import__("uuid").uuid4()),
    })
    assert res.status_code in (401, 403)


async def test_create_skill_for_self_succeeds(client, auth_headers, seeded_user):
    res = await client.post("/skills", json={
        "title": "Python Basics", "category": "Tech", "description": "desc",
        "image": "http://x.com/i.jpg", "duration": 45, "level": "Beginner",
        "requirements": "none", "instructor_id": str(seeded_user.id),
    }, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["title"] == "Python Basics"


async def test_create_skill_for_other_user_forbidden(client, auth_headers, second_user):
    """A non-admin can't create a skill on someone else's behalf."""
    res = await client.post("/skills", json={
        "title": "Should Fail", "category": "Tech", "description": "desc",
        "image": "http://x.com/i.jpg", "duration": 15, "level": "Beginner",
        "requirements": "none", "instructor_id": str(second_user.id),
    }, headers=auth_headers)
    assert res.status_code == 403


async def test_delete_skill_by_owner_succeeds(client, auth_headers, seeded_skill):
    res = await client.delete(f"/skills/{seeded_skill.id}", headers=auth_headers)
    assert res.status_code == 204


async def test_delete_skill_by_non_owner_forbidden(client, second_user_auth_headers, seeded_skill):
    res = await client.delete(f"/skills/{seeded_skill.id}", headers=second_user_auth_headers)
    assert res.status_code == 403


# ---------- Duration/price coupling ----------


async def test_create_skill_auto_calculates_price_from_duration(client, auth_headers, seeded_user):
    """No price supplied — server derives it from duration (45 min -> 100)."""
    res = await client.post("/skills", json={
        "title": "Derived Price Skill", "category": "Tech", "description": "desc",
        "image": "http://x.com/i.jpg", "duration": 45, "level": "Beginner",
        "requirements": "none", "instructor_id": str(seeded_user.id),
    }, headers=auth_headers)
    assert res.status_code == 201, res.text
    assert res.json()["price"] == 100


async def test_create_skill_rejects_price_above_duration_cap(client, auth_headers, seeded_user):
    """30 minutes caps at round(100*30/45)=67 — 90 must be rejected, not trusted."""
    res = await client.post("/skills", json={
        "title": "Overpriced Skill", "category": "Tech", "description": "desc",
        "image": "http://x.com/i.jpg", "duration": 30, "price": 90, "level": "Beginner",
        "requirements": "none", "instructor_id": str(seeded_user.id),
    }, headers=auth_headers)
    assert res.status_code == 422


async def test_create_skill_rejects_duration_over_45_minutes(client, auth_headers, seeded_user):
    res = await client.post("/skills", json={
        "title": "Too Long Skill", "category": "Tech", "description": "desc",
        "image": "http://x.com/i.jpg", "duration": 60, "level": "Beginner",
        "requirements": "none", "instructor_id": str(seeded_user.id),
    }, headers=auth_headers)
    assert res.status_code == 422


async def test_update_skill_by_owner_succeeds(client, auth_headers, seeded_skill):
    res = await client.patch(
        f"/skills/{seeded_skill.id}", json={"title": "Intro to Guitar (Updated)"},
        headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["title"] == "Intro to Guitar (Updated)"


async def test_update_skill_by_non_owner_forbidden(client, second_user_auth_headers, seeded_skill):
    res = await client.patch(
        f"/skills/{seeded_skill.id}", json={"title": "Hijacked"},
        headers=second_user_auth_headers,
    )
    assert res.status_code == 403


async def test_update_skill_not_found(client, auth_headers):
    import uuid
    res = await client.patch(
        f"/skills/{uuid.uuid4()}", json={"title": "Doesn't matter"}, headers=auth_headers,
    )
    assert res.status_code == 404


async def test_update_skill_duration_recomputes_price_when_price_not_given(
    client, auth_headers, seeded_skill
):
    """seeded_skill is 30 min; bumping to 45 min with no price in the
    PATCH should re-derive price to the new cap (100), not leave the old
    price stale."""
    res = await client.patch(
        f"/skills/{seeded_skill.id}", json={"duration": 45}, headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["price"] == 100


async def test_update_skill_rejects_price_above_new_duration_cap(
    client, auth_headers, seeded_skill
):
    res = await client.patch(
        f"/skills/{seeded_skill.id}", json={"duration": 15, "price": 80}, headers=auth_headers,
    )
    assert res.status_code == 422


async def test_update_skill_rejects_duration_over_45_minutes(client, auth_headers, seeded_skill):
    res = await client.patch(
        f"/skills/{seeded_skill.id}", json={"duration": 90}, headers=auth_headers,
    )
    assert res.status_code == 422


async def test_update_skill_untouched_fields_dont_recompute_price(
    client, auth_headers, seeded_skill
):
    """Patching an unrelated field (title) shouldn't silently change price."""
    original_price = seeded_skill.price
    res = await client.patch(
        f"/skills/{seeded_skill.id}", json={"title": "Retitled"}, headers=auth_headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["price"] == original_price


# ---------- instructor_id filter (powers "my skills") ----------


async def test_list_skills_filtered_by_instructor_id(
    client, auth_headers, second_user_auth_headers, seeded_user, seeded_skill, second_user
):
    other = await client.post("/skills", json={
        "title": "Someone Else's Skill", "category": "Tech", "description": "desc",
        "image": "http://x.com/i.jpg", "duration": 30, "level": "Beginner",
        "requirements": "none", "instructor_id": str(second_user.id),
    }, headers=second_user_auth_headers)
    assert other.status_code == 201, other.text

    res = await client.get("/skills", params={"instructor_id": str(seeded_user.id)})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total"] == 1
    assert body["skills"][0]["title"] == "Intro to Guitar"