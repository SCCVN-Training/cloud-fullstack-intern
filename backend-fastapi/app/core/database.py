from typing import AsyncGenerator
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import app_settings

# --- Neon PostgreSQL Setup ---
neon_async_engine: AsyncEngine = create_async_engine(
    app_settings.NEON_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={"ssl": "require"}
)

async_session_factory = async_sessionmaker(
    bind=neon_async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class BaseDeclarativeModel(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


async def get_neon_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an asynchronous Neon PostgreSQL session."""
    async with async_session_factory() as active_session:
        yield active_session


# --- MongoDB Setup ---
mongodb_client = AsyncIOMotorClient(app_settings.MONGODB_CONNECTION_URI)
mongodb_database: AsyncIOMotorDatabase = mongodb_client[
    app_settings.MONGODB_DATABASE_NAME
]


def get_mongodb_database() -> AsyncIOMotorDatabase:
    """Dependency that returns the MongoDB database instance."""
    return mongodb_database