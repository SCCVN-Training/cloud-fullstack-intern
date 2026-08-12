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
        "image": "http://x.com/i.jpg", "duration": "2 weeks", "level": "Beginner",
        "requirements": "none", "instructor_id": str(__import__("uuid").uuid4()),
    })
    assert res.status_code in (401, 403)


async def test_create_skill_for_self_succeeds(client, auth_headers, seeded_user):
    res = await client.post("/skills", json={
        "title": "Python Basics", "category": "Tech", "description": "desc",
        "image": "http://x.com/i.jpg", "duration": "3 weeks", "level": "Beginner",
        "requirements": "none", "instructor_id": str(seeded_user.id),
    }, headers=auth_headers)
    assert res.status_code == 201
    assert res.json()["title"] == "Python Basics"


async def test_create_skill_for_other_user_forbidden(client, auth_headers, second_user):
    """A non-admin can't create a skill on someone else's behalf."""
    res = await client.post("/skills", json={
        "title": "Should Fail", "category": "Tech", "description": "desc",
        "image": "http://x.com/i.jpg", "duration": "1 week", "level": "Beginner",
        "requirements": "none", "instructor_id": str(second_user.id),
    }, headers=auth_headers)
    assert res.status_code == 403


async def test_delete_skill_by_owner_succeeds(client, auth_headers, seeded_skill):
    res = await client.delete(f"/skills/{seeded_skill.id}", headers=auth_headers)
    assert res.status_code == 204


async def test_delete_skill_by_non_owner_forbidden(client, second_user_auth_headers, seeded_skill):
    res = await client.delete(f"/skills/{seeded_skill.id}", headers=second_user_auth_headers)
    assert res.status_code == 403