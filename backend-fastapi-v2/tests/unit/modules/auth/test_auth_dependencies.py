# tests/unit/modules/auth/test_dependencies.py
import pytest
from unittest.mock import MagicMock, AsyncMock
from uuid import uuid4
from fastapi import HTTPException, status
from fastapi import Request

from modules.auth.dependencies import get_current_user, get_current_user_optional


# ---------- Helper to create a mock user ----------
def create_mock_user(user_id=None, email="test@example.com", is_active=True):
    user = MagicMock()
    user.id = user_id or uuid4()
    user.email = email
    user.is_active = is_active
    return user


# ============================================================
# 1. TESTS FOR get_current_user (Required Auth)
# ============================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_success(mocker, mock_pg_session):
    """
    Should decode JWT, fetch user from DB (or cache), check is_active, and return the user.
    """
    # Arrange
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {"access_token": "valid_token_here"}

    mock_user = create_mock_user()

    # Mock the JWT verification to return the user_id
    mocker.patch("modules.auth.dependencies.verify_token", return_value=mock_user.id)

    # Mock the AuthRepository.get_by_id
    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = mock_user

    # Patch the AuthRepository instantiation inside the dependency
    mocker.patch("modules.auth.dependencies.AuthRepository", return_value=mock_repo)

    # Act
    result = await get_current_user(request=mock_request, db=mock_pg_session)

    # Assert
    assert result == mock_user
    mock_repo.get_by_id.assert_awaited_once_with(mock_user.id)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_missing_cookie(mocker, mock_pg_session):
    """
    Should raise 401 if 'access_token' cookie is missing.
    """
    # Arrange
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {}  # No cookie

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(request=mock_request, db=mock_pg_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Not authenticated" in exc_info.value.detail


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_invalid_token(mocker, mock_pg_session):
    """
    Should raise 401 if the JWT is invalid or expired.
    """
    # Arrange
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {"access_token": "invalid_token"}

    # Mock the JWT verification to return None (invalid)
    mocker.patch("modules.auth.dependencies.verify_token", return_value=None)

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(request=mock_request, db=mock_pg_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid or expired token" in exc_info.value.detail


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_user_not_found(mocker, mock_pg_session):
    """
    Should raise 401 if the user ID from the token does not exist in the DB.
    """
    # Arrange
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {"access_token": "valid_token"}

    mocker.patch("modules.auth.dependencies.verify_token", return_value=uuid4())

    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = None  # User not found
    mocker.patch("modules.auth.dependencies.AuthRepository", return_value=mock_repo)

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(request=mock_request, db=mock_pg_session)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "User not found" in exc_info.value.detail


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_inactive(mocker, mock_pg_session):
    """
    Should raise 403 if the user exists but is inactive (is_active=False).
    """
    # Arrange
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {"access_token": "valid_token"}

    mock_user = create_mock_user(is_active=False)  # Inactive user

    mocker.patch("modules.auth.dependencies.verify_token", return_value=mock_user.id)

    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = mock_user
    mocker.patch("modules.auth.dependencies.AuthRepository", return_value=mock_repo)

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(request=mock_request, db=mock_pg_session)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "disabled" in exc_info.value.detail


# ============================================================
# 2. TESTS FOR get_current_user_optional (Optional Auth)
# ============================================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_optional_no_cookie(mocker, mock_pg_session):
    """
    Should return None (not raise) when cookie is missing.
    """
    # Arrange
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {}

    # Act
    result = await get_current_user_optional(request=mock_request, db=mock_pg_session)

    # Assert
    assert result is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_optional_invalid_token(mocker, mock_pg_session):
    """
    Should return None when token is invalid (instead of raising 401).
    """
    # Arrange
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {"access_token": "bad_token"}

    mocker.patch("modules.auth.dependencies.verify_token", return_value=None)

    # Act
    result = await get_current_user_optional(request=mock_request, db=mock_pg_session)

    # Assert
    assert result is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_optional_user_not_found(mocker, mock_pg_session):
    """
    Should return None when user ID exists but user is deleted from DB.
    """
    # Arrange
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {"access_token": "valid_token"}

    mocker.patch("modules.auth.dependencies.verify_token", return_value=uuid4())

    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = None
    mocker.patch("modules.auth.dependencies.AuthRepository", return_value=mock_repo)

    # Act
    result = await get_current_user_optional(request=mock_request, db=mock_pg_session)

    # Assert
    assert result is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_optional_success(mocker, mock_pg_session):
    """
    Should return the user when valid token is present (same as required, but no raise).
    """
    # Arrange
    mock_request = MagicMock(spec=Request)
    mock_request.cookies = {"access_token": "valid_token"}

    mock_user = create_mock_user()
    mocker.patch("modules.auth.dependencies.verify_token", return_value=mock_user.id)

    mock_repo = AsyncMock()
    mock_repo.get_by_id.return_value = mock_user
    mocker.patch("modules.auth.dependencies.AuthRepository", return_value=mock_repo)

    # Act
    result = await get_current_user_optional(request=mock_request, db=mock_pg_session)

    # Assert
    assert result == mock_user
