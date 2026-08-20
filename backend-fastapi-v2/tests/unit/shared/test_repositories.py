# tests/unit/shared/test_repositories.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from sqlalchemy import Column, String, Boolean, UUID, Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, declarative_base

from shared.repositories import BaseRepository


# ============ Create a Real SQLAlchemy Model for Testing ============
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass

class MockModel(Base):
    """Mock SQLAlchemy model for testing BaseRepository."""
    __tablename__ = "mock_models"

    id = Column(UUID, primary_key=True, default=uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    is_active = Column(Boolean, default=True)


# ============ Concrete Repository ============
class MockRepository(BaseRepository[MockModel]):
    """Concrete repository for testing BaseRepository."""
    pass


# ============ Fixtures ============
@pytest.fixture
def mock_session():
    """Mock async session."""
    session = AsyncMock(spec=AsyncSession)
    session.add = MagicMock()
    session.add_all = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    session.execute = AsyncMock()
    return session


@pytest.fixture
def repo(mock_session):
    """SUT: BaseRepository with mock session."""
    return MockRepository(MockModel, mock_session)


# ==========================================
# 1. CREATE TESTS
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_success(repo, mock_session):
    """Should add and commit a new model instance."""
    # Arrange
    model_data = {"name": "john", "email": "john@example.com"}

    # Act
    result = await repo.create(**model_data)

    # Assert
    mock_session.add.assert_called_once()
    mock_session.commit.assert_awaited_once()
    mock_session.refresh.assert_awaited_once()
    assert result.name == "john"
    assert result.email == "john@example.com"


@pytest.mark.unit
@pytest.mark.asyncio
async def test_create_many_success(repo, mock_session):
    """Should add and commit multiple model instances."""
    # Arrange
    items = [
        {"name": "user1", "email": "user1@example.com"},
        {"name": "user2", "email": "user2@example.com"},
    ]

    # Act
    results = await repo.create_many(items)

    # Assert
    mock_session.add_all.assert_called_once()
    mock_session.commit.assert_awaited_once()
    assert len(results) == 2
    assert results[0].name == "user1"
    assert results[1].name == "user2"
    assert mock_session.refresh.await_count == 2


# ==========================================
# 2. READ TESTS
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_by_id_success(repo, mock_session):
    """Should return model when found by ID."""
    # Arrange
    model_id = uuid4()
    expected_model = MockModel(id=model_id, name="test", email="test@example.com")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = expected_model
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.get_by_id(model_id)

    # Assert
    mock_session.execute.assert_awaited_once()
    assert result == expected_model


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_by_id_not_found(repo, mock_session):
    """Should return None when model not found."""
    # Arrange
    model_id = uuid4()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.get_by_id(model_id)

    # Assert
    assert result is None


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_by_ids_success(repo, mock_session):
    """Should return multiple models by IDs."""
    # Arrange
    ids = [uuid4(), uuid4()]
    expected_models = [
        MockModel(id=ids[0], name="user1", email="user1@example.com"),
        MockModel(id=ids[1], name="user2", email="user2@example.com"),
    ]

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = expected_models
    mock_session.execute.return_value = mock_result

    # Act
    results = await repo.get_by_ids(ids)

    # Assert
    mock_session.execute.assert_awaited_once()
    assert len(results) == 2
    assert results == expected_models


@pytest.mark.unit
@pytest.mark.asyncio
async def test_get_all_success(repo, mock_session):
    """Should return paginated results."""
    # Arrange
    expected_models = [
        MockModel(name=f"user{i}", email=f"user{i}@example.com")
        for i in range(3)
    ]
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = expected_models
    mock_session.execute.return_value = mock_result

    # Act
    results = await repo.get_all(skip=10, limit=5)

    # Assert
    mock_session.execute.assert_awaited_once()
    assert len(results) == 3


@pytest.mark.unit
@pytest.mark.asyncio
async def test_count_success(repo, mock_session):
    """Should return total record count."""
    # Arrange
    mock_result = MagicMock()
    mock_result.scalar.return_value = 42
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.count()

    # Assert
    mock_session.execute.assert_awaited_once()
    assert result == 42


@pytest.mark.unit
@pytest.mark.asyncio
async def test_exists_true(repo, mock_session):
    """Should return True when record exists."""
    # Arrange
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = MockModel()
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.exists(email="test@example.com")

    # Assert
    assert result is True
    mock_session.execute.assert_awaited_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_exists_false(repo, mock_session):
    """Should return False when record does not exist."""
    # Arrange
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.exists(email="nonexistent@example.com")

    # Assert
    assert result is False


# ==========================================
# 3. UPDATE TESTS
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_update_success(repo, mock_session):
    """Should update model attributes and commit."""
    # Arrange
    model_id = uuid4()
    existing_model = MockModel(id=model_id, name="old_name", email="old@example.com")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_model
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.update(model_id, name="new_name", email="new@example.com")

    # Assert
    assert result is not None
    assert result.name == "new_name"
    assert result.email == "new@example.com"
    mock_session.commit.assert_awaited_once()
    mock_session.refresh.assert_awaited_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_update_not_found(repo, mock_session):
    """Should return None when model not found."""
    # Arrange
    model_id = uuid4()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.update(model_id, name="new_name")

    # Assert
    assert result is None
    mock_session.commit.assert_not_called()
    mock_session.refresh.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_update_ignores_invalid_fields(repo, mock_session):
    """Should ignore fields that don't exist on the model."""
    # Arrange
    model_id = uuid4()
    existing_model = MockModel(id=model_id, name="old_name", email="old@example.com")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_model
    mock_session.execute.return_value = mock_result

    # Act - trying to update non-existent field "invalid_field"
    result = await repo.update(
        model_id,
        name="new_name",
        invalid_field="should_be_ignored"
    )

    # Assert
    assert result.name == "new_name"
    assert not hasattr(result, "invalid_field")


@pytest.mark.unit
@pytest.mark.asyncio
async def test_update_bulk_success(repo, mock_session):
    """Should update multiple records at once."""
    # Arrange
    ids = [uuid4(), uuid4()]
    updated_models = [
        MockModel(id=ids[0], name="user1_updated", email="user1@example.com"),
        MockModel(id=ids[1], name="user2_updated", email="user2@example.com"),
    ]

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = updated_models
    mock_session.execute.return_value = mock_result

    # Act
    results = await repo.update_bulk(ids, is_active=False)

    # Assert
    mock_session.execute.assert_awaited_once()
    mock_session.commit.assert_awaited_once()
    assert len(results) == 2


# ==========================================
# 4. DELETE TESTS
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_delete_success(repo, mock_session):
    """Should delete model and return True."""
    # Arrange
    model_id = uuid4()
    existing_model = MockModel(id=model_id, name="to_delete", email="delete@example.com")

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_model
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.delete(model_id)

    # Assert
    assert result is True
    mock_session.delete.assert_called_once_with(existing_model)
    mock_session.commit.assert_awaited_once()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_delete_not_found(repo, mock_session):
    """Should return False when model not found."""
    # Arrange
    model_id = uuid4()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.delete(model_id)

    # Assert
    assert result is False
    mock_session.delete.assert_not_called()
    mock_session.commit.assert_not_called()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_delete_bulk_success(repo, mock_session):
    """Should delete multiple records and return count."""
    # Arrange
    ids = [uuid4(), uuid4(), uuid4()]
    mock_result = MagicMock()
    mock_result.rowcount = 3
    mock_session.execute.return_value = mock_result

    # Act
    result = await repo.delete_bulk(ids)

    # Assert
    mock_session.execute.assert_awaited_once()
    mock_session.commit.assert_awaited_once()
    assert result == 3


# ==========================================
# 5. FULL CRUD FLOW TEST
# ==========================================

@pytest.mark.unit
@pytest.mark.asyncio
async def test_full_crud_flow(repo, mock_session):
    """Test complete CRUD flow: create → read → update → delete."""
    # 1. Create
    created = await repo.create(name="flow_user", email="flow@example.com")
    assert created.name == "flow_user"

    # 2. Read
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = created
    mock_session.execute.return_value = mock_result

    found = await repo.get_by_id(created.id)
    assert found is not None
    assert found.email == "flow@example.com"

    # 3. Update
    mock_result.scalar_one_or_none.return_value = created
    mock_session.execute.return_value = mock_result

    updated = await repo.update(created.id, name="updated_user")
    assert updated.name == "updated_user"

    # 4. Delete
    mock_result.scalar_one_or_none.return_value = updated
    mock_session.execute.return_value = mock_result

    deleted = await repo.delete(updated.id)
    assert deleted is True
