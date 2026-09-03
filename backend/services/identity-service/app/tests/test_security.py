from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)
from app.core.exceptions import InvalidTokenException


def test_hash_password_produces_different_string():
    assert hash_password("secret123") != "secret123"


def test_verify_password_correct():
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed) is True


def test_verify_password_incorrect():
    hashed = hash_password("secret123")
    assert verify_password("wrongpass", hashed) is False


def test_create_and_decode_access_token_roundtrip():
    token = create_access_token({"sub": "user-id-123", "role": "USER"})
    payload = decode_access_token(token)
    assert payload["sub"] == "user-id-123"
    assert payload["role"] == "USER"


def test_decode_invalid_token_raises():
    try:
        decode_access_token("not-a-real-token")
        assert False, "expected InvalidTokenException"
    except InvalidTokenException:
        pass