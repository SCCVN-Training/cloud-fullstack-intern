# tests/unit/modules/profile/test_profile_repositories.py
import pytest
from unittest.mock import MagicMock, AsyncMock
from uuid import uuid4
from datetime import datetime, timezone

from modules.profile.repositories import ProfileRepository
from modules.profile.models import UserProfileModel


@pytest.fixture
def profile_repo(mock_pg_session):
    """SUT: ProfileRepository with mocked session."""
    return ProfileRepository(mock_pg_session)


@pytest.fixture
def mock_profile():
    """Create a mock profile."""
    return UserProfileModel(
        user_id=uuid4(),
        display_name="Test User",
        bio="Test bio",
        avatar_url="https://example.com/avatar.jpg",
        banner_url="https://example.com/banner.jpg",
        profile_card_style="default",
        accent_color="#FF6B6B",
        background_color="#F5F5F5",
        is_profile_public=True,
        created_at_utc=datetime.now(timezone.utc),
        updated_at_utc=datetime.now(timezone.utc),
    )


# ==========================================
# 1. TESTS FOR get_by_user_id
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_by_user_id_success(profile_repo, mock_pg_session, mock_profile):
    """Should return profile when found by user_id."""
    # Arrange
    user_id = mock_profile.user_id

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_profile
    mock_pg_session.execute.return_value = mock_result

    # Act
    result = await profile_repo.get_by_user_id(user_id)

    # Assert
    assert result == mock_profile
    assert result.user_id == user_id
    mock_pg_session.execute.assert_awaited_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_by_user_id_not_found(profile_repo, mock_pg_session):
    """Should return None when profile not found."""
    # Arrange
    user_id = uuid4()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_pg_session.execute.return_value = mock_result

    # Act
    result = await profile_repo.get_by_user_id(user_id)

    # Assert
    assert result is None
    mock_pg_session.execute.assert_awaited_once()


# ==========================================
# 2. TESTS FOR create_profile
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_profile_success(profile_repo, mock_pg_session):
    """Should create a new profile with default values."""
    # Arrange
    user_id = uuid4()
    display_name = "New User"

    # Mock get_by_user_id to return None (no existing profile)
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_pg_session.execute.return_value = mock_result

    # Mock BaseRepository.create
    created_profile = UserProfileModel(
        user_id=user_id,
        display_name=display_name,
        bio=None,
        avatar_url=None,
        banner_url=None,
        profile_card_style="default",
        accent_color="#FF6B6B",
        background_color="#F5F5F5",
        is_profile_public=True,
        created_at_utc=datetime.now(timezone.utc),
        updated_at_utc=datetime.now(timezone.utc),
    )

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(profile_repo, "create", AsyncMock(return_value=created_profile))

        # Act
        result = await profile_repo.create_profile(user_id, display_name)

        # Assert
        assert result.user_id == user_id
        assert result.display_name == display_name
        assert result.bio is None
        assert result.avatar_url is None
        assert result.profile_card_style == "default"
        assert result.accent_color == "#FF6B6B"
        assert result.is_profile_public is True

        profile_repo.create.assert_awaited_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_profile_already_exists(profile_repo, mock_pg_session, mock_profile):
    """Should raise ValueError when profile already exists."""
    # Arrange
    user_id = mock_profile.user_id
    display_name = "New User"

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_profile
    mock_pg_session.execute.return_value = mock_result

    # Act & Assert
    with pytest.raises(ValueError) as exc_info:
        await profile_repo.create_profile(user_id, display_name)

    assert f"UserProfileModel already exists for user {user_id}" in str(exc_info.value)


# ==========================================
# 3. TESTS FOR patch_profile_by_user_id
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_patch_profile_success(profile_repo, mock_pg_session, mock_profile):
    """Should update profile fields successfully."""
    # Arrange
    user_id = mock_profile.user_id
    changes = {
        "display_name": "Updated Name",
        "bio": "Updated bio",
        "is_profile_public": False,
    }

    updated_profile = UserProfileModel(
        user_id=user_id,
        display_name="Updated Name",
        bio="Updated bio",
        avatar_url=mock_profile.avatar_url,
        banner_url=mock_profile.banner_url,
        profile_card_style=mock_profile.profile_card_style,
        accent_color=mock_profile.accent_color,
        background_color=mock_profile.background_color,
        is_profile_public=False,
        created_at_utc=mock_profile.created_at_utc,
        updated_at_utc=datetime.now(timezone.utc),
    )

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = updated_profile
    mock_pg_session.execute.return_value = mock_result

    # Act
    result = await profile_repo.patch_profile_by_user_id(user_id, changes)

    # Assert
    assert result is not None
    assert result.display_name == "Updated Name"
    assert result.bio == "Updated bio"
    assert result.is_profile_public is False
    mock_pg_session.execute.assert_awaited_once()
    mock_pg_session.commit.assert_awaited_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_patch_profile_empty_changes(profile_repo, mock_pg_session):
    """Should return False when no changes provided."""
    # Arrange
    user_id = uuid4()
    changes = {}

    # Act
    result = await profile_repo.patch_profile_by_user_id(user_id, changes)

    # Assert
    assert result is False
    mock_pg_session.execute.assert_not_called()
    mock_pg_session.commit.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_patch_profile_not_found(profile_repo, mock_pg_session):
    """Should return None when profile not found."""
    # Arrange
    user_id = uuid4()
    changes = {"display_name": "New Name"}

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_pg_session.execute.return_value = mock_result

    # Act
    result = await profile_repo.patch_profile_by_user_id(user_id, changes)

    # Assert
    assert result is None
    mock_pg_session.execute.assert_awaited_once()
    mock_pg_session.commit.assert_awaited_once()


# ==========================================
# 4. TESTS FOR delete_profile_by_user_id
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_delete_profile_success(profile_repo, mock_pg_session, mock_profile):
    """Should delete profile and return True."""
    # Arrange
    user_id = mock_profile.user_id

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = mock_profile
    mock_pg_session.execute.return_value = mock_result

    with pytest.MonkeyPatch.context() as mp:
        mp.setattr(profile_repo, "delete", AsyncMock(return_value=True))

        # Act
        result = await profile_repo.delete_profile_by_user_id(user_id)

        # Assert
        assert result is True
        mock_pg_session.execute.assert_awaited_once()
        mock_pg_session.delete.assert_awaited_once()
        mock_pg_session.commit.assert_awaited_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_delete_profile_not_found(profile_repo, mock_pg_session):
    """Should return False when profile not found."""
    # Arrange
    user_id = uuid4()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_pg_session.execute.return_value = mock_result

    # Act
    result = await profile_repo.delete_profile_by_user_id(user_id)

    # Assert
    assert result is False
    mock_pg_session.execute.assert_awaited_once()
