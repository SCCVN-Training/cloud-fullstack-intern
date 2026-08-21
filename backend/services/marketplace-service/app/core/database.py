from sqlalchemy.ext.asyncio import ( 
    AsyncSession, 
    async_sessionmaker,
    create_async_engine
) 
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Create async database engine (connection between Python and Neon PostgreSQL)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True    # Print every SQL statement
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False
)

# schema="marketplace" — see identity-service/app/core/database.py's
# comment for the full reasoning (Neon pooler + search_path, and why
# SQLite needs schema=None instead for the test suite).
_use_schema = not settings.DATABASE_URL.startswith("sqlite")

class Base(DeclarativeBase):
    metadata = MetaData(schema="marketplace" if _use_schema else None)

# Dependency Injection
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session   