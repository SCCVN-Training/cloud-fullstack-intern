from typing import TypeVar, Generic, Type, Optional, List, Any
from uuid import UUID
from sqlalchemy import delete, select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

# Type variable for the model class
# This allows the repository to work with any model type
ModelType = TypeVar("ModelType")

class BaseRepository(Generic[ModelType]):
    """
    Generic async repository with CRUD operations.

    This class provides common database operations that can be
    inherited by any module-specific repository.

    Type Parameters:
        ModelType: The SQLAlchemy model class

    Example:
        class UserRepository(BaseRepository[User]):
            def __init__(self, session: AsyncSession):
                super().__init__(User, session)

            async def get_by_email(self, email: str) -> Optional[User]:
                # Custom method specific to User model
                ...
    """

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        """
        Initialize repository with model and session.

        Args:
            model: SQLAlchemy model class (e.g., User)
            session: Async database session
        """
        self.model = model
        self.session = session

    # ============ Create ============

    async def create(self, **kwargs) -> ModelType:
        """
        Create a new record.

        Args:
            **kwargs: Model field values (e.g., email="test@example.com")

        Returns:
            Created model instance with ID populated

        Example:
            user = await repo.create(
                email="john@example.com",
                username="john_doe",
                hashed_password="..."
            )
        """
        instance = self.model(**kwargs)
        self.session.add(instance)
        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def create_many(self, items: List[dict]) -> List[ModelType]:
        """
        Create multiple records at once.

        Args:
            items: List of dictionaries with field values

        Returns:
            List of created model instances

        Example:
            users = await repo.create_many([
                {"email": "user1@example.com", "username": "user1"},
                {"email": "user2@example.com", "username": "user2"},
            ])
        """
        instances = [self.model(**item) for item in items]
        self.session.add_all(instances)
        await self.session.commit()
        for instance in instances:
            await self.session.refresh(instance)
        return instances

    # ============ Read ============

    async def get_by_id(self, id: UUID) -> Optional[ModelType]:
        """
        Get a record by its primary key ID.

        Args:
            id: Record ID

        Returns:
            Model instance if found, None otherwise
        """
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()

    async def get_by_ids(self, ids: List[UUID]) -> List[ModelType]:
        """
        Get multiple records by their IDs.

        Args:
            ids: List of record IDs

        Returns:
            List of model instances (only those found)
        """
        result = await self.session.execute(
            select(self.model).where(self.model.id.in_(ids))
        )
        return result.scalars().all()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """
        Get all records with pagination.

        Args:
            skip: Number of records to skip (offset)
            limit: Maximum number of records to return

        Returns:
            List of model instances

        Example:
            # Get first 10 users
            users = await repo.get_all(limit=10)

            # Get next 10 users (page 2)
            users = await repo.get_all(skip=10, limit=10)
        """
        result = await self.session.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def count(self) -> int:
        """
        Count total number of records.

        Returns:
            Total record count
        """
        result = await self.session.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar()

    async def exists(self, **filters) -> bool:
        """
        Check if any record exists with given filters.

        Args:
            **filters: Field-value pairs to filter by

        Returns:
            True if at least one record exists, False otherwise

        Example:
            exists = await repo.exists(email="john@example.com")
        """
        query = select(self.model)
        for key, value in filters.items():
            query = query.where(getattr(self.model, key) == value)
        result = await self.session.execute(query.limit(1))
        return result.scalar_one_or_none() is not None

    # ============ Update ============

    async def update(self, id: UUID, **kwargs) -> Optional[ModelType]:
        """
        Update a record by ID.

        Args:
            id: Record ID to update
            **kwargs: Field-value pairs to update

        Returns:
            Updated model instance if found, None otherwise

        Example:
            user = await repo.update(
                user_id,
                full_name="John Smith",
                is_active=False
            )
        """
        instance = await self.get_by_id(id)
        if not instance:
            return None

        # Update only fields that exist on the model
        for key, value in kwargs.items():
            if hasattr(instance, key):
                setattr(instance, key, value)

        await self.session.commit()
        await self.session.refresh(instance)
        return instance

    async def update_bulk(self, ids: List[UUID], **kwargs) -> List[ModelType]:
        """
        Update multiple records at once.

        Args:
            ids: List of record IDs to update
            **kwargs: Field-value pairs to update

        Returns:
            List of updated model instances
        """
        result = await self.session.execute(
            update(self.model)
            .where(self.model.id.in_(ids))
            .values(**kwargs)
            .returning(self.model)
        )
        await self.session.commit()
        return result.scalars().all()

    # ============ Delete ============

    async def delete(self, id: UUID) -> bool:
        """
        Delete a record by ID.

        Args:
            id: Record ID to delete

        Returns:
            True if deleted, False if not found
        """
        instance = await self.get_by_id(id)
        if not instance:
            return False

        await self.session.delete(instance)
        await self.session.commit()
        return True

    async def delete_bulk(self, ids: List[UUID]) -> int:
        """
        Delete multiple records by IDs.

        Args:
            ids: List of record IDs to delete

        Returns:
            Number of records deleted
        """
        result = await self.session.execute(
            delete(self.model).where(self.model.id.in_(ids))
        )
        await self.session.commit()
        return result.rowcount
