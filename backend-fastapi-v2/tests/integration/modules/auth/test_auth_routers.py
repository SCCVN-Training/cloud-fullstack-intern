# tests/integration/modules/auth/test_routers.py
import pytest
from httpx import AsyncClient, ASGITransport
from uuid import uuid4

from main import app


# ---------- Helper Functions ----------
def get_cookie_value(response, key: str) -> str | None:
    """
    Extract cookie value from response headers.
    Checks the cookie NAME (not the value) to avoid false matches.
    """
    for header, value in response.headers.items():
        if header.lower() == "set-cookie":
            # Parse the cookie string properly
            # Format: "key=value; Path=/; HttpOnly; ..."
            parts = value.split(";")
            for part in parts:
                part = part.strip()
                if part.startswith(f"{key}="):
                    # Extract just the value (remove the key= prefix)
                    return part.split("=", 1)[1]
    return None

def get_cookie_value_by_path(response, key: str, path: str) -> str | None:
    """
    Extract cookie value with a specific path.
    Useful for refresh_token which is path-bound to /api/v1/auth/refresh-session.
    """
    for header, value in response.headers.items():
        if header.lower() == "set-cookie":
            # Check if this cookie has the right path
            if path not in value:
                continue
            # Parse the cookie string
            parts = value.split(";")
            for part in parts:
                part = part.strip()
                if part.startswith(f"{key}="):
                    return part.split("=", 1)[1]
    return None

def get_cookie_value_from_jar(cookies, key: str) -> str | None:
    """
    Extract cookie value from httpx cookie jar.
    """
    for cookie in cookies.jar:
        if cookie.name == key:
            return cookie.value
    return None


def assert_cookie_is_httponly(response, key: str):
    """Ensure the cookie has HttpOnly flag."""
    for header, value in response.headers.items():
        if header.lower() == "set-cookie" and key in value:
            assert "HttpOnly" in value
            return
    pytest.fail(f"Cookie {key} not found or not HttpOnly")


# ---------- Fixtures ----------
@pytest.fixture
async def client():
    """Async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# ==========================================
# 1. REGISTRATION TESTS (covers line 34)
# ==========================================

@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_register_success(client):
    """Should register a new user, set cookies, and return user data."""
    payload = {
        "email": f"integration_{uuid4()}@example.com",
        "password": "SecurePass123!"
    }

    response = await client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "User registration successful. Please create your profile."
    assert data["data"]["user"]["email"] == payload["email"]

    # Verify cookies were set
    # access_token = get_cookie_value(response, "access_token")
    # refresh_token = get_cookie_value_by_path(
    #     response,
    #     "refresh_token",
    #     "/api/v1/auth/refresh-session"
    # )
    access_token = get_cookie_value_from_jar(client.cookies, "access_token")
    refresh_token = get_cookie_value_from_jar(client.cookies, "refresh_token")

    assert access_token is not None
    assert refresh_token is not None


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    """Should return 400 if email is already registered."""
    email = f"duplicate_{uuid4()}@example.com"
    password = "SecurePass123!"

    # Register first user
    await client.post("/api/v1/auth/register", json={"email": email, "password": password})

    # Try to register again
    response = await client.post("/api/v1/auth/register", json={"email": email, "password": password})

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_register_invalid_email(client):
    """Should return 422 for invalid email format. (covers line 34)"""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "notanemail", "password": "SecurePass123!"}
    )
    assert response.status_code == 422


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_register_missing_password(client):
    """Should return 422 for missing password. (covers line 34)"""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": f"test_{uuid4()}@example.com"}
    )
    assert response.status_code == 422


# ==========================================
# 2. LOGIN TESTS (covers lines 59-67)
# ==========================================

@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_login_success(client):
    """Should login with valid credentials and set cookies."""
    email = f"login_{uuid4()}@example.com"
    password = "SecurePass123!"

    # Register
    await client.post("/api/v1/auth/register", json={"email": email, "password": password})

    # Login
    response = await client.post("/api/v1/auth/login", json={"email": email, "password": password})

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "User login successful."
    assert data["data"]["user"]["email"] == email

    access_token = get_cookie_value_from_jar(client.cookies, "access_token")
    refresh_token = get_cookie_value_from_jar(client.cookies, "refresh_token")

    # Verify cookies
    assert access_token is not None
    assert refresh_token is not None


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_login_wrong_password(client):
    """Should return 401 for invalid credentials."""
    email = f"wrongpass_{uuid4()}@example.com"
    password = "SecurePass123!"

    # Register
    await client.post("/api/v1/auth/register", json={"email": email, "password": password})

    # Login with wrong password
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPassword!"}
    )

    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]
    assert get_cookie_value(response, "access_token") is None


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_login_user_not_found(client):
    """Should return 401 for non-existent user."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "anything"}
    )

    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


# ==========================================
# 3. RATE LIMITING TESTS (covers lines 91-99)
# ==========================================

@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_login_rate_limit(client):
    """Should return 429 after exceeding login rate limit (5 attempts)."""
    email = f"ratelimit_{uuid4()}@example.com"
    password = "SecurePass123!"

    # Register user
    await client.post("/api/v1/auth/register", json={"email": email, "password": password})

    # Attempt 6 logins with wrong password
    for i in range(5):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": f"WrongPass{i}!"}
        )
        # First 5 attempts: 401 Unauthorized (not rate limited yet)
        assert response.status_code == 401

    # 6th attempt: Should hit rate limit
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "WrongPass6!"}
    )
    assert response.status_code == 429
    assert "Too many login attempts. Please try again later." in response.json()["detail"]


# ==========================================
# 4. REFRESH SESSION TESTS (covers lines 91-99)
# ==========================================

@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_refresh_session_success(client):
    """Should refresh session with valid refresh token. (covers lines 91-99)"""
    email = f"refresh_{uuid4()}@example.com"
    password = "SecurePass123!"

    # Register (sets both cookies)
    register_response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password}
    )

    refresh_token = get_cookie_value_from_jar(client.cookies, "refresh_token")

    # Refresh session
    response = await client.post(
        "/api/v1/auth/refresh-session",
        cookies={"refresh_token": refresh_token}
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Session refreshed successfully."
    # Should set new access_token
    assert get_cookie_value(response, "access_token") is not None


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_refresh_session_missing_cookie(client):
    """Should return 401 if refresh token cookie is missing. (covers lines 91-99)"""
    response = await client.post("/api/v1/auth/refresh-session")
    assert response.status_code == 401
    assert "Refresh token cookie missing" in response.json()["detail"]


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_refresh_session_invalid_cookie(client):
    """Should return 401 if refresh token is invalid. (covers lines 91-99)"""
    response = await client.post(
        "/api/v1/auth/refresh-session",
        cookies={"refresh_token": "invalid_token_12345"}
    )
    assert response.status_code == 401
    assert "Invalid or expired refresh token" in response.json()["detail"]


# ==========================================
# 5. LOGOUT TESTS (covers lines 122-129)
# ==========================================

@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_logout_success(client):
    """Should clear cookies on logout."""
    email = f"logout_{uuid4()}@example.com"
    password = "SecurePass123!"

    # Register
    register_response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password}
    )
    # access_token = get_cookie_value(register_response, "access_token")

    access_token = get_cookie_value_from_jar(client.cookies, "access_token")
    # Logout
    response = await client.post(
        "/api/v1/auth/logout",
        cookies={"access_token": access_token}
    )

    assert response.status_code == 200
    assert response.json()["message"] == "User logout successful."

    # Verify cookie cleared (max-age=0)
    for header, value in response.headers.items():
        if header.lower() == "set-cookie" and "access_token" in value:
            assert "max-age=0" in value or "expires=" in value
            return
    pytest.fail("Access token cookie not cleared")


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_logout_without_auth(client):
    """Should return 401 if trying to logout without authentication. (covers lines 122-129)"""
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 401


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_logout_with_invalid_token(client):
    """Should return 401 if trying to logout with invalid token. (covers lines 122-129)"""
    response = await client.post(
        "/api/v1/auth/logout",
        cookies={"access_token": "invalid_token"}
    )
    assert response.status_code == 401


# ==========================================
# 6. CURRENT USER TESTS (covers lines 149, 167-174)
# ==========================================

@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_get_current_user_success(client):
    """Should return current user when access token cookie is present."""
    email = f"me_{uuid4()}@example.com"
    password = "SecurePass123!"

    # Register (auto-login sets cookies)
    register_response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password}
    )
    # access_token = get_cookie_value(register_response, "access_token")

    access_token = get_cookie_value_from_jar(client.cookies, "access_token")

    # Get current user
    response = await client.get(
        "/api/v1/auth/me",
        cookies={"access_token": access_token}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["data"]["user"]["email"] == email


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_get_current_user_missing_cookie(client):
    """Should return 401 if access token cookie is missing. (covers line 149)"""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Not authenticated" in response.json()["detail"]


@pytest.mark.integration_fast
@pytest.mark.asyncio
async def test_get_current_user_invalid_token(client):
    """Should return 401 if access token is invalid. (covers lines 167-174)"""
    response = await client.get(
        "/api/v1/auth/me",
        cookies={"access_token": "invalid_token_12345"}
    )
    assert response.status_code == 401
    assert "Invalid or expired token" in response.json()["detail"]
