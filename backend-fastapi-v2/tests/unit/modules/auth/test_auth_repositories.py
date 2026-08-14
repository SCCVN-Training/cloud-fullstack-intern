# tests/unit/modules/auth/test_repositories.py
import pytest
from uuid import uuid4
from unittest.mock import MagicMock
from sqlalchemy import select, text
from sqlalchemy.dialects import postgresql

from modules.auth.repositories import AuthRepository
from modules.auth.models import UserAccountModel


# ---------- HELPER: Compile SQL for comparison ----------
def compile_sql(select_obj):
    """Compile a SQLAlchemy Select object to a string with literal binds."""
    return str(select_obj.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True}))


@pytest.fixture
def auth_repo(mock_pg_session):
    """SUT: AuthRepository with a mocked async session."""
    return AuthRepository(mock_pg_session)


# ==========================================
# 1. TESTS FOR get_by_email
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_by_email_found(auth_repo, mock_pg_session):
    """Should execute SELECT with WHERE email = :email and return the user."""
    # Arrange
    email = "john@example.com"
    expected_user = UserAccountModel(id=uuid4(), email=email)

    mock_result = mock_pg_session.execute.return_value
    mock_result.scalar_one_or_none.return_value = expected_user

    # Act
    result = await auth_repo.get_by_email(email)

    # Assert (Return value)
    assert result is expected_user
    assert result.email == email

    # Assert (Query construction - COMPARE SQL STRINGS)
    mock_pg_session.execute.assert_awaited_once()

    # Grab the actual Select object passed to execute()
    actual_select = mock_pg_session.execute.call_args.args[0]

    # Build the expected Select object in the test
    expected_select = select(UserAccountModel).where(UserAccountModel.email == email)

    # Compare the compiled SQL (this ignores memory addresses)
    assert compile_sql(actual_select) == compile_sql(expected_select)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_by_email_not_found(auth_repo, mock_pg_session):
    """Should return None when email does not exist."""
    # Arrange
    email = "ghost@example.com"
    mock_result = mock_pg_session.execute.return_value
    mock_result.scalar_one_or_none.return_value = None

    # Act
    result = await auth_repo.get_by_email(email)

    # Assert
    assert result is None
    mock_pg_session.execute.assert_awaited_once()


# ==========================================
# 2. TESTS FOR check_email_exists
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_check_email_exists_true(auth_repo, mock_pg_session):
    """Should return True if the email's ID exists in DB."""
    # Arrange
    email = "exists@example.com"
    fake_user_id = uuid4()

    mock_result = mock_pg_session.execute.return_value
    mock_result.scalar_one_or_none.return_value = fake_user_id

    # Act
    result = await auth_repo.check_email_exists(email)

    # Assert
    assert result is True

    # Assert (Query construction - verify SELECT ID and LIMIT 1)
    mock_pg_session.execute.assert_awaited_once()

    actual_select = mock_pg_session.execute.call_args.args[0]
    expected_select = select(UserAccountModel.id).where(UserAccountModel.email == email).limit(1)

    assert compile_sql(actual_select) == compile_sql(expected_select)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_check_email_exists_false(auth_repo, mock_pg_session):
    """Should return False if no ID is found."""
    # Arrange
    email = "ghost@example.com"
    mock_result = mock_pg_session.execute.return_value
    mock_result.scalar_one_or_none.return_value = None

    # Act
    result = await auth_repo.check_email_exists(email)

    # Assert
    assert result is False
    mock_pg_session.execute.assert_awaited_once()
