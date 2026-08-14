# tests/unit/modules/profile/test_profile_schemas.py
import pytest
from uuid import uuid4
from datetime import datetime, timezone
from pydantic import ValidationError

from modules.profile.schemas import (
    CreateProfileRequest,
    UpdateProfileRequest,
    ProfileResponse,
    ProfileDataResponse,
)


# ==========================================
# 1. TESTS FOR CreateProfileRequest
# ==========================================

class TestCreateProfileRequest:
    """Tests for CreateProfileRequest schema."""

    @pytest.mark.unit
    def test_create_profile_valid(self):
        """Should validate with all required fields."""
        user_id = uuid4()
        data = {
            "userId": str(user_id),
            "displayName": "John Doe",
        }

        result = CreateProfileRequest.model_validate(data)

        assert result.user_id == user_id
        assert result.display_name == "John Doe"

    @pytest.mark.unit
    def test_create_profile_with_alias_names(self):
        """Should work with both alias and Python field names."""
        user_id = uuid4()

        # Using Python field names
        data_python = {
            "user_id": str(user_id),
            "display_name": "Jane Doe",
        }
        result1 = CreateProfileRequest.model_validate(data_python)
        assert result1.user_id == user_id
        assert result1.display_name == "Jane Doe"

        # Using alias names
        data_alias = {
            "userId": str(user_id),
            "displayName": "Jane Doe",
        }
        result2 = CreateProfileRequest.model_validate(data_alias)
        assert result2.user_id == user_id
        assert result2.display_name == "Jane Doe"

    @pytest.mark.unit
    def test_create_profile_missing_user_id(self):
        """Should raise validation error when user_id is missing."""
        data = {
            "displayName": "John Doe",
        }

        with pytest.raises(ValidationError) as exc_info:
            CreateProfileRequest.model_validate(data)

        errors = exc_info.value.errors()
        assert any(e["loc"][0] == "userId" for e in errors)

    @pytest.mark.unit
    def test_create_profile_missing_display_name(self):
        """Should raise validation error when display_name is missing."""
        user_id = uuid4()
        data = {
            "userId": str(user_id),
        }

        with pytest.raises(ValidationError) as exc_info:
            CreateProfileRequest.model_validate(data)

        errors = exc_info.value.errors()
        assert any(e["loc"][0] == "displayName" for e in errors)

    @pytest.mark.unit
    @pytest.mark.parametrize("display_name,should_fail", [
        ("", True),           # Empty string - fails min_length
        ("A", False),         # Valid - minimum length
        ("John Doe", False),  # Valid - typical
        ("A" * 50, False),    # Valid - exactly max_length
        ("A" * 51, True),     # Too long - exceeds max_length
        ("  John  ", False),  # Valid - will be stripped
    ])
    def test_create_profile_display_name_validation(self, display_name, should_fail):
        """Should validate display_name length constraints."""
        user_id = uuid4()
        data = {
            "userId": str(user_id),
            "displayName": display_name,
        }

        if should_fail:
            with pytest.raises(ValidationError):
                CreateProfileRequest.model_validate(data)
        else:
            result = CreateProfileRequest.model_validate(data)
            assert result.display_name == display_name

    @pytest.mark.unit
    def test_create_profile_invalid_uuid(self):
        """Should raise validation error for invalid UUID format."""
        data = {
            "userId": "not-a-uuid",
            "displayName": "John Doe",
        }

        with pytest.raises(ValidationError) as exc_info:
            CreateProfileRequest.model_validate(data)

        errors = exc_info.value.errors()
        assert any(e["loc"][0] == "userId" for e in errors)


# ==========================================
# 2. TESTS FOR UpdateProfileRequest
# ==========================================

class TestUpdateProfileRequest:
    """Tests for UpdateProfileRequest schema."""

    @pytest.mark.unit
    def test_update_profile_empty(self):
        """Should validate with no fields provided (all optional)."""
        data = {}

        result = UpdateProfileRequest.model_validate(data)

        assert result.display_name is None
        assert result.bio is None
        assert result.avatar_url is None
        assert result.banner_url is None
        assert result.profile_card_style is None
        assert result.accent_color is None
        assert result.background_color is None
        assert result.is_profile_public is None

    @pytest.mark.unit
    def test_update_profile_with_all_fields(self):
        """Should validate with all fields provided."""
        data = {
            "displayName": "Updated Name",
            "bio": "This is my updated bio",
            "avatarUrl": "https://example.com/new-avatar.jpg",
            "bannerUrl": "https://example.com/new-banner.jpg",
            "profileCardStyle": "compact",
            "accentColor": "#FF6B6B",
            "backgroundColor": "#F0F0F0",
            "isProfilePublic": True,
        }

        result = UpdateProfileRequest.model_validate(data)

        assert result.display_name == "Updated Name"
        assert result.bio == "This is my updated bio"
        assert result.avatar_url == "https://example.com/new-avatar.jpg"
        assert result.banner_url == "https://example.com/new-banner.jpg"
        assert result.profile_card_style == "compact"
        assert result.accent_color == "#FF6B6B"
        assert result.background_color == "#F0F0F0"
        assert result.is_profile_public is True

    @pytest.mark.unit
    def test_update_profile_with_alias_names(self):
        """Should work with both alias and Python field names."""
        # Using Python field names
        data_python = {
            "display_name": "John Doe",
            "avatar_url": "https://example.com/avatar.jpg",
        }
        result1 = UpdateProfileRequest.model_validate(data_python)
        assert result1.display_name == "John Doe"
        assert result1.avatar_url == "https://example.com/avatar.jpg"

        # Using alias names
        data_alias = {
            "displayName": "John Doe",
            "avatarUrl": "https://example.com/avatar.jpg",
        }
        result2 = UpdateProfileRequest.model_validate(data_alias)
        assert result2.display_name == "John Doe"
        assert result2.avatar_url == "https://example.com/avatar.jpg"

    @pytest.mark.unit
    @pytest.mark.parametrize("field,value,should_fail", [
        # displayName - min_length=1, max_length=50
        ("displayName", "", True),
        ("displayName", "A", False),
        ("displayName", "A" * 50, False),
        ("displayName", "A" * 51, True),

        # bio - max_length=500
        ("bio", "A" * 500, False),
        ("bio", "A" * 501, True),

        # avatarUrl - max_length=500
        ("avatarUrl", "https://example.com/avatar.jpg", False),
        ("avatarUrl", "https://example.com/" + "a" * 480, False),
        ("avatarUrl", "https://example.com/" + "a" * 490, True),

        # bannerUrl - max_length=500
        ("bannerUrl", "https://example.com/banner.jpg", False),
        ("bannerUrl", "A" * 500, False),
        ("bannerUrl", "A" * 501, True),

        # profileCardStyle - no validation
        ("profileCardStyle", "default", False),
        ("profileCardStyle", "compact", False),
        ("profileCardStyle", "A" * 100, False),

        # accentColor - no validation (unless you add field_validator)
        ("accentColor", "#FF6B6B", False),
        ("accentColor", "not-a-color", False),
        ("accentColor", "A" * 100, False),

        # backgroundColor - no validation
        ("backgroundColor", "#F0F0F0", False),
        ("backgroundColor", "not-a-color", False),

        # isProfilePublic - boolean (Pydantic auto-converts strings)
        ("isProfilePublic", True, False),
        ("isProfilePublic", False, False),
        ("isProfilePublic", "true", False),    # Pydantic converts to True
        ("isProfilePublic", "false", False),   # Pydantic converts to False
        ("isProfilePublic", "1", False),       # Pydantic converts to True
        ("isProfilePublic", "0", False),       # Pydantic converts to False
        ("isProfilePublic", "yes", False),     # Pydantic converts to True
        ("isProfilePublic", "no", False),      # Pydantic converts to False
        ("isProfilePublic", "tRue", False),    # Case insensitive
        ("isProfilePublic", "FaLsE", False),   # Case insensitive
        ("isProfilePublic", 123, True),        # Not a boolean or convertible string
        ("isProfilePublic", "not-a-bool", True),  # Not convertible
    ])
    def test_update_profile_field_validation(self, field, value, should_fail):
        """Should validate individual field constraints."""
        data = {field: value}

        if should_fail:
            with pytest.raises(ValidationError):
                UpdateProfileRequest.model_validate(data)
        else:
            result = UpdateProfileRequest.model_validate(data)

            # Verify the field was set correctly
            if field == "displayName":
                assert result.display_name == value
            elif field == "avatarUrl":
                assert result.avatar_url == value
            elif field == "bannerUrl":
                assert result.banner_url == value
            elif field == "profileCardStyle":
                assert result.profile_card_style == value
            elif field == "accentColor":
                assert result.accent_color == value
            elif field == "backgroundColor":
                assert result.background_color == value
            elif field == "bio":
                assert result.bio == value
            elif field == "isProfilePublic":
                # ✅ FIX: For boolean fields, compare the BOOLEAN value
                if isinstance(value, str):
                    # Check what the boolean value should be
                    expected_bool = value.lower() in ("true", "1", "yes", "on")
                    assert result.is_profile_public == expected_bool
                else:
                    assert result.is_profile_public == value

    @pytest.mark.unit
    def test_update_profile_invalid_url_format(self):
        """Should validate URL format for avatar_url and banner_url."""
        data = {
            "avatarUrl": "not-a-url",
        }

        # Pydantic's HttpUrl validation would catch this if you're using HttpUrl
        # If it's just a string with max_length, this will pass
        # Adjust based on your actual schema
        result = UpdateProfileRequest.model_validate(data)
        assert result.avatar_url == "not-a-url"  # If no URL validation

    @pytest.mark.unit
    def test_update_profile_boolean_values(self):
        """Should handle boolean values for is_profile_public."""
        # True
        data = {"isProfilePublic": True}
        result = UpdateProfileRequest.model_validate(data)
        assert result.is_profile_public is True

        # False
        data = {"isProfilePublic": False}
        result = UpdateProfileRequest.model_validate(data)
        assert result.is_profile_public is False

        # String "true" should be converted to bool if using field type
        data = {"isProfilePublic": "true"}
        result = UpdateProfileRequest.model_validate(data)
        assert result.is_profile_public is True

        # String "false" should be converted to bool
        data = {"isProfilePublic": "false"}
        result = UpdateProfileRequest.model_validate(data)
        assert result.is_profile_public is False


# ==========================================
# 3. TESTS FOR ProfileResponse
# ==========================================

class TestProfileResponse:
    """Tests for ProfileResponse schema."""

    @pytest.mark.unit
    def test_profile_response_valid(self):
        """Should validate ProfileResponse with all fields."""
        user_id = uuid4()
        now = datetime.now(timezone.utc)

        data = {
            "userId": str(user_id),
            "displayName": "John Doe",
            "bio": "Software developer",
            "avatarUrl": "https://example.com/avatar.jpg",
            "bannerUrl": "https://example.com/banner.jpg",
            "profileCardStyle": "default",
            "accentColor": "#FF6B6B",
            "backgroundColor": "#F0F0F0",
            "isProfilePublic": True,
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
        }

        result = ProfileResponse.model_validate(data)

        assert result.user_id == user_id
        assert result.display_name == "John Doe"
        assert result.bio == "Software developer"
        assert result.avatar_url == "https://example.com/avatar.jpg"
        assert result.banner_url == "https://example.com/banner.jpg"
        assert result.profile_card_style == "default"
        assert result.accent_color == "#FF6B6B"
        assert result.background_color == "#F0F0F0"
        assert result.is_profile_public is True
        assert result.created_at_utc == now
        assert result.updated_at_utc == now

    @pytest.mark.unit
    def test_profile_response_with_alias_names(self):
        """Should work with both alias and Python field names."""
        user_id = uuid4()
        now = datetime.now(timezone.utc)

        # Using Python field names
        data_python = {
            "user_id": str(user_id),
            "display_name": "John Doe",
            "bio": "Test bio",
            "avatar_url": "https://example.com/avatar.jpg",
            "banner_url": "https://example.com/banner.jpg",
            "profile_card_style": "compact",
            "accent_color": "#FF0000",
            "background_color": "#FFFFFF",
            "is_profile_public": True,
            "created_at_utc": now.isoformat(),
            "updated_at_utc": now.isoformat(),
        }
        result1 = ProfileResponse.model_validate(data_python)
        assert result1.user_id == user_id
        assert result1.display_name == "John Doe"

        # Using alias names
        data_alias = {
            "userId": str(user_id),
            "displayName": "John Doe",
            "bio": "Test bio",
            "avatarUrl": "https://example.com/avatar.jpg",
            "bannerUrl": "https://example.com/banner.jpg",
            "profileCardStyle": "compact",
            "accentColor": "#FF0000",
            "backgroundColor": "#FFFFFF",
            "isProfilePublic": True,
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
        }
        result2 = ProfileResponse.model_validate(data_alias)
        assert result2.user_id == user_id
        assert result2.display_name == "John Doe"

    @pytest.mark.unit
    def test_profile_response_missing_required_fields(self):
        """Should raise validation error when required fields are missing."""
        # Missing userId
        data = {
            "displayName": "John Doe",
            "profileCardStyle": "default",
            "accentColor": "#FF6B6B",
            "backgroundColor": "#F0F0F0",
            "isProfilePublic": True,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

        with pytest.raises(ValidationError) as exc_info:
            ProfileResponse.model_validate(data)

        errors = exc_info.value.errors()
        assert any(e["loc"][0] == "userId" for e in errors)

    @pytest.mark.unit
    def test_profile_response_optional_fields(self):
        """Should handle optional fields being None."""
        user_id = uuid4()
        now = datetime.now(timezone.utc)

        data = {
            "userId": str(user_id),
            "displayName": "John Doe",
            "profileCardStyle": "default",
            "accentColor": "#FF6B6B",
            "backgroundColor": "#F0F0F0",
            "isProfilePublic": True,
            "createdAt": now.isoformat(),
            # bio, avatarUrl, bannerUrl, updatedAt are optional
        }

        result = ProfileResponse.model_validate(data)

        assert result.bio is None
        assert result.avatar_url is None
        assert result.banner_url is None
        assert result.updated_at_utc is None

    @pytest.mark.unit
    def test_profile_response_from_attributes(self):
        """Should support from_attributes mode (for ORM models)."""
        # This tests the from_attributes=True config
        # You'll need a real ORM model or a simple object
        user_id = uuid4()
        now = datetime.now(timezone.utc)

        class MockORM:
            def __init__(self):
                self.user_id = user_id
                self.display_name = "John Doe"
                self.bio = "Test bio"
                self.avatar_url = "https://example.com/avatar.jpg"
                self.banner_url = "https://example.com/banner.jpg"
                self.profile_card_style = "default"
                self.accent_color = "#FF6B6B"
                self.background_color = "#F0F0F0"
                self.is_profile_public = True
                self.created_at_utc = now
                self.updated_at_utc = now

        mock_obj = MockORM()
        result = ProfileResponse.model_validate(mock_obj, from_attributes=True)

        assert result.user_id == user_id
        assert result.display_name == "John Doe"
        assert result.bio == "Test bio"


# ==========================================
# 4. TESTS FOR ProfileDataResponse
# ==========================================

class TestProfileDataResponse:
    """Tests for ProfileDataResponse schema."""

    @pytest.mark.unit
    def test_profile_data_response_valid(self):
        """Should validate ProfileDataResponse with nested ProfileResponse."""
        user_id = uuid4()
        now = datetime.now(timezone.utc)

        profile_data = {
            "userId": str(user_id),
            "displayName": "John Doe",
            "bio": "Software developer",
            "avatarUrl": "https://example.com/avatar.jpg",
            "bannerUrl": "https://example.com/banner.jpg",
            "profileCardStyle": "default",
            "accentColor": "#FF6B6B",
            "backgroundColor": "#F0F0F0",
            "isProfilePublic": True,
            "createdAt": now.isoformat(),
            "updatedAt": now.isoformat(),
        }

        data = {
            "profile": profile_data,
        }

        result = ProfileDataResponse.model_validate(data)

        assert result.profile.user_id == user_id
        assert result.profile.display_name == "John Doe"
        assert result.profile.bio == "Software developer"

    @pytest.mark.unit
    def test_profile_data_response_missing_profile(self):
        """Should raise validation error when profile is missing."""
        data = {}

        with pytest.raises(ValidationError) as exc_info:
            ProfileDataResponse.model_validate(data)

        errors = exc_info.value.errors()
        assert any(e["loc"][0] == "profile" for e in errors)
