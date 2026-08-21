import uuid
from app.modules.users.repository import UserRepository
from app.modules.users.models import User
from app.common.enums import UserRole
from app.core.security import hash_password


async def test_get_by_email_found(db_session, seeded_user):
    result = await UserRepository.get_by_email(db_session, "test@example.com")
    assert result is not None
    assert result.user_name == "testuser"


async def test_get_by_email_not_found(db_session):
    result = await UserRepository.get_by_email(db_session, "nobody@example.com")
    assert result is None


async def test_get_by_id_found(db_session, seeded_user):
    result = await UserRepository.get_by_id(db_session, seeded_user.id)
    assert result is not None
    assert result.email == "test@example.com"


async def test_get_by_id_not_found(db_session):
    result = await UserRepository.get_by_id(db_session, uuid.uuid4())
    assert result is None


async def test_create_user(db_session):
    new_user = User(
        user_name="createduser",
        email="created@example.com",
        password_hash=hash_password("password123"),
        role=UserRole.USER,
    )
    created = await UserRepository.create(db_session, new_user)
    assert created.id is not None


async def test_update_user(db_session, seeded_user):
    updated = await UserRepository.update(db_session, seeded_user, {"user_name": "renamed"})
    assert updated.user_name == "renamed"


async def test_delete_user(db_session, seeded_user):
    await UserRepository.delete(db_session, seeded_user)
    result = await UserRepository.get_by_id(db_session, seeded_user.id)
    assert result is None


async def test_get_all_pagination(db_session, seeded_user, seeded_admin):
    users, total = await UserRepository.get_all(db_session, skip=0, limit=10)
    assert total == 2
    assert len(users) == 2