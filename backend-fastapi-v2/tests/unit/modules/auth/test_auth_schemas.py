# tests/unit/modules/auth/test_schemas.py
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from modules.auth.schemas import UserResponse

@pytest.mark.unit
def test_user_response_schema():
    """Should create UserResponse from model."""
    user = MagicMock()
    user.id = uuid4()
    user.email = "test@example.com"
    user.is_active = True

    response = UserResponse.model_validate(user)
    assert response.email == user.email
    assert response.id == user.id
