# tests/unit/modules/auth/test_services.py
import pytest
from unittest.mock import MagicMock, AsyncMock, PropertyMock
from uuid import uuid4
from fastapi import HTTPException, status
from datetime import timedelta

from shared.config import settings


# ---------- Helper: Create a mock user ----------
def create_mock_user(user_id=None, email="test@example.com", is_active=True):
    user = MagicMock()
    user.id = user_id or uuid4()
    user.email = email
    user.is_active = is_active
    user.hashed_password = "hashed_password"
    return user


# ==========================================
# 1. TESTS FOR `register`
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_register_success(auth_service, mock_auth_repo, mock_audit_repo, mock_response, mocker):
    """Should create user, log to audit, set cookies, and return user."""
    # Arrange
    mock_user = create_mock_user()
    mock_auth_repo.check_email_exists.return_value = False
    mock_auth_repo.create.return_value = mock_user

    # Mock security functions
    mocker.patch("modules.auth.services.get_password_hash", return_value="hashed_mock")
    mock_set_cookies = mocker.patch.object(auth_service, "_set_authentication_cookies", return_value=("at", "rt"))

    request_data = MagicMock(email="test@example.com", password="plainpass")

    # Act
    result = await auth_service.register(
        request=request_data,
        response=mock_response,
        ip_address="127.0.0.1",
        user_agent="test-agent"
    )

    # Assert
    assert result["message"] == "User registration successful. Please create your profile."
    assert result["data"]["user"]["email"] == "test@example.com"

    # Verify repository calls
    mock_auth_repo.check_email_exists.assert_awaited_once_with("test@example.com")
    mock_auth_repo.create.assert_awaited_once_with(
        email="test@example.com",
        hashed_password="hashed_mock",
        is_active=True
    )

    # Verify audit log
    mock_audit_repo.log_registration.assert_awaited_once_with(
        user_id=mock_user.id,
        email="test@example.com",
        ip_address="127.0.0.1",
        user_agent="test-agent"
    )

    # Verify cookies set (via internal method call)
    mock_set_cookies.assert_called_once_with(
        response=mock_response,
        user_id=mock_user.id,
        email=mock_user.email
    )


@pytest.mark.unit
@pytest.mark.asyncio
async def test_register_email_already_exists(auth_service, mock_auth_repo, mock_response, mocker):
    """Should raise 400 if email exists."""
    # Arrange
    mock_auth_repo.check_email_exists.return_value = True
    mocker.patch("modules.auth.services.get_password_hash")  # Should NOT be called

    request_data = MagicMock(email="exists@example.com", password="pass")

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.register(request=request_data, response=mock_response)

    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "already exists" in exc_info.value.detail
    mock_auth_repo.create.assert_not_called()  # Ensure no user created


# ==========================================
# 2. TESTS FOR `login`
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_login_success(auth_service, mock_auth_repo, mock_audit_repo, mock_response, mocker):
    """Should verify password, set cookies, log success."""
    # Arrange
    mock_user = create_mock_user()
    mock_auth_repo.get_by_email.return_value = mock_user

    mocker.patch("modules.auth.services.verify_password", return_value=True)
    mock_set_cookies = mocker.patch.object(auth_service, "_set_authentication_cookies", return_value=("at", "rt"))

    request_data = MagicMock(email="test@example.com", password="plainpass")

    # Act
    result = await auth_service.login(
        request=request_data,
        response=mock_response,
        ip_address="192.168.1.1",
        user_agent="chrome"
    )

    # Assert
    assert result["message"] == "User login successful."
    assert result["data"]["user"]["email"] == "test@example.com"

    mock_auth_repo.get_by_email.assert_awaited_once_with("test@example.com")
    mock_audit_repo.log_login_attempt.assert_awaited_once_with(
        email="test@example.com",
        success=True,
        ip_address="192.168.1.1",
        user_agent="chrome",
        user_id=mock_user.id
    )
    mock_set_cookies.assert_called_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_login_wrong_password(auth_service, mock_auth_repo, mock_audit_repo, mock_response, mocker):
    """Should raise 401 and log failed attempt."""
    # Arrange
    mock_user = create_mock_user()
    mock_auth_repo.get_by_email.return_value = mock_user
    mocker.patch("modules.auth.services.verify_password", return_value=False)

    request_data = MagicMock(email="test@example.com", password="wrongpass")

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.login(request=request_data, response=mock_response)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid email or password" in exc_info.value.detail

    # Verify audit logs the failed attempt
    mock_audit_repo.log_login_attempt.assert_awaited_once_with(
        email="test@example.com",
        success=False,
        ip_address=None,
        user_agent=None,
        user_id=mock_user.id
    )


@pytest.mark.unit
@pytest.mark.asyncio
async def test_login_user_not_found(auth_service, mock_auth_repo, mock_audit_repo, mock_response, mocker):
    """Should raise 401 if user doesn't exist. Should NOT verify password."""
    # Arrange
    mock_auth_repo.get_by_email.return_value = None
    spy_verify = mocker.patch("modules.auth.services.verify_password")  # Ensure this is never called

    request_data = MagicMock(email="ghost@example.com", password="pass")

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.login(request=request_data, response=mock_response)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    spy_verify.assert_not_called()  # Password verification should be skipped if user not found

    # Audit log should NOT include user_id (since it's None)
    mock_audit_repo.log_login_attempt.assert_awaited_once_with(
        email="ghost@example.com",
        success=False,
        ip_address=None,
        user_agent=None,
        user_id=None
    )


@pytest.mark.unit
@pytest.mark.asyncio
async def test_login_user_inactive(auth_service, mock_auth_repo, mock_response, mocker):
    """Should raise 403 if user exists but is inactive."""
    # Arrange
    mock_user = create_mock_user(is_active=False)
    mock_auth_repo.get_by_email.return_value = mock_user
    mocker.patch("modules.auth.services.verify_password", return_value=True)

    request_data = MagicMock(email="test@example.com", password="pass")

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.login(request=request_data, response=mock_response)

    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "disabled" in exc_info.value.detail


# ==========================================
# 3. TESTS FOR `refresh_session`
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_refresh_session_success(auth_service, mock_auth_repo, mock_request, mock_response, mocker):
    """Should verify refresh token, fetch user, set new cookies."""
    # Arrange
    mock_user = create_mock_user()
    mock_request.cookies = {"refresh_token": "valid_refresh_token"}

    mocker.patch("modules.auth.services.verify_token", return_value=mock_user.id)
    mock_auth_repo.get_by_id.return_value = mock_user
    mock_set_cookies = mocker.patch.object(auth_service, "_set_authentication_cookies")

    # Act
    result = await auth_service.refresh_session(request=mock_request, response=mock_response)

    # Assert
    assert result["message"] == "Session refreshed successfully."
    mock_auth_repo.get_by_id.assert_awaited_once_with(mock_user.id)
    mock_set_cookies.assert_called_once_with(
        response=mock_response,
        user_id=mock_user.id,
        email=mock_user.email
    )


@pytest.mark.unit
@pytest.mark.asyncio
async def test_refresh_session_missing_cookie(auth_service, mock_request):
    """Should raise 401 if refresh token cookie is missing."""
    # Arrange
    mock_request.cookies = {}

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.refresh_session(request=mock_request, response=MagicMock())

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Refresh token cookie missing" in exc_info.value.detail


@pytest.mark.unit
@pytest.mark.asyncio
async def test_refresh_session_invalid_token(auth_service, mock_request, mock_response, mocker):
    """Should raise 401 if verify_token returns None."""
    # Arrange
    mock_request.cookies = {"refresh_token": "invalid"}
    mocker.patch("modules.auth.services.verify_token", return_value=None)

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.refresh_session(request=mock_request, response=mock_response)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid or expired refresh token" in exc_info.value.detail


@pytest.mark.unit
@pytest.mark.asyncio
async def test_refresh_session_user_inactive(auth_service, mock_auth_repo, mock_request, mock_response, mocker):
    """Should raise 401 if user exists but is inactive during refresh."""
    # Arrange
    mock_user = create_mock_user(is_active=False)
    mock_request.cookies = {"refresh_token": "valid_refresh"}

    mocker.patch("modules.auth.services.verify_token", return_value=mock_user.id)
    mock_auth_repo.get_by_id.return_value = mock_user

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.refresh_session(request=mock_request, response=mock_response)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "User not found or inactive" in exc_info.value.detail


# ==========================================
# 4. TESTS FOR `get_current_user` (Service method)
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_success(auth_service, mock_auth_repo, mock_request, mocker):
    """Should verify access token, fetch user, return user data."""
    # Arrange
    mock_user = create_mock_user()
    mock_request.cookies = {"access_token": "valid_access"}

    mocker.patch("modules.auth.services.verify_token", return_value=mock_user.id)
    mock_auth_repo.get_by_id.return_value = mock_user

    # Act
    result = await auth_service.get_current_user(request=mock_request)

    # Assert
    assert result["message"] == "Current user retrieved successfully."
    assert result["data"]["user"]["email"] == mock_user.email
    mock_auth_repo.get_by_id.assert_awaited_once_with(mock_user.id)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_missing_cookie(auth_service, mock_request):
    """Should raise 401 if access token cookie is missing."""
    # Arrange
    mock_request.cookies = {}

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.get_current_user(request=mock_request)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Access token cookie missing" in exc_info.value.detail


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_invalid_token(auth_service, mock_request, mocker):
    """Should raise 401 if token is invalid."""
    # Arrange
    mock_request.cookies = {"access_token": "bad_token"}
    mocker.patch("modules.auth.services.verify_token", return_value=None)

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.get_current_user(request=mock_request)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid or expired access token" in exc_info.value.detail


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_user_not_found(auth_service, mock_auth_repo, mock_request, mocker):
    """Should raise 401 if user is deleted (not found in DB)."""
    # Arrange
    mock_request.cookies = {"access_token": "valid"}
    mocker.patch("modules.auth.services.verify_token", return_value=uuid4())
    mock_auth_repo.get_by_id.return_value = None

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.get_current_user(request=mock_request)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "User not found or inactive" in exc_info.value.detail


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_current_user_inactive(auth_service, mock_auth_repo, mock_request, mocker):
    """Should raise 401 if user is inactive."""
    # Arrange
    mock_user = create_mock_user(is_active=False)
    mock_request.cookies = {"access_token": "valid"}
    mocker.patch("modules.auth.services.verify_token", return_value=mock_user.id)
    mock_auth_repo.get_by_id.return_value = mock_user

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.get_current_user(request=mock_request)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "User not found or inactive" in exc_info.value.detail


# ==========================================
# 5. TESTS FOR `logout`
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_logout_success(auth_service, mock_request, mock_response, mocker):
    """
    Should validate token, clear authentication cookies, and return success.
    (Does NOT fetch user from DB - only validates token)
    """
    # Arrange
    mock_user_id = uuid4()
    mock_request.cookies = {"access_token": "valid_access_token"}

    mocker.patch("modules.auth.services.verify_token", return_value=mock_user_id)
    mock_clear = mocker.patch.object(auth_service, "_clear_authentication_cookies")

    # Act
    result = await auth_service.logout(request=mock_request, response=mock_response)

    # Assert
    assert result["message"] == "User logout successful."
    mock_clear.assert_called_once_with(mock_response)


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logout_missing_cookie(auth_service, mock_request, mock_response):
    """Should raise 401 if no access token is present."""
    # Arrange
    mock_request.cookies = {}

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.logout(request=mock_request, response=mock_response)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Access token cookie missing" in exc_info.value.detail


@pytest.mark.unit
@pytest.mark.asyncio
async def test_logout_invalid_token(auth_service, mock_request, mock_response, mocker):
    """Should raise 401 if the access token is invalid."""
    # Arrange
    mock_request.cookies = {"access_token": "invalid_token"}
    mocker.patch("modules.auth.services.verify_token", return_value=None)

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        await auth_service.logout(request=mock_request, response=mock_response)

    assert exc_info.value.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Invalid or expired access token" in exc_info.value.detail

# ==========================================
# 6. TESTS FOR INTERNAL HELPER METHODS
# ==========================================

def test_set_authentication_cookies(auth_service, mocker):
    """
    Verify cookies are set with correct names, httponly, and max_age.
    """
    # ---- 1. MOCK PROPERTIES (using PropertyMock on the CLASS) ----
    mocker.patch.object(
        type(settings),  # The Settings class
        "is_production",
        new_callable=PropertyMock,
        return_value=False
    )

    # ---- 2. MOCK PLAIN ATTRIBUTES (direct value assignment) ----
    # These are just ints, so we patch them directly on the instance.
    mocker.patch.object(settings, "access_token_expire_minutes", 30)
    mocker.patch.object(settings, "refresh_token_expire_days", 7)
    # ---------------------------------------------------------------

    response = MagicMock()
    mocker.patch("modules.auth.services.create_access_token", return_value="at_mock")
    mocker.patch("modules.auth.services.create_refresh_token", return_value="rt_mock")

    user_id = uuid4()
    email = "test@x.com"

    # Act
    at, rt = auth_service._set_authentication_cookies(
        response=response, user_id=user_id, email=email
    )

    # Assert tokens returned
    assert at == "at_mock"
    assert rt == "rt_mock"

    # Assert response.set_cookie called correctly for access_token
    response.set_cookie.assert_any_call(
        key="access_token",
        value="at_mock",
        httponly=True,
        secure=False,  # Now we know it's False
        samesite="lax",
        max_age=30 * 60,  # 30 minutes
        path="/"
    )
    # Check refresh_token call
    response.set_cookie.assert_any_call(
        key="refresh_token",
        value="rt_mock",
        httponly=True,
        secure=False,
        samesite="lax",
        path="/api/v1/auth/refresh-session",
        max_age=7 * 24 * 60 * 60  # 7 days
    )

def test_clear_authentication_cookies(auth_service):
    """Verify delete_cookie is called for both access and refresh tokens with correct paths."""
    response = MagicMock()

    auth_service._clear_authentication_cookies(response)

    response.delete_cookie.assert_any_call("access_token", path="/")
    response.delete_cookie.assert_any_call("refresh_token", path="/api/v1/auth/refresh-session")
