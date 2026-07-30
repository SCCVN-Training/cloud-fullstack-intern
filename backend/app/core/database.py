from sqlalchemy.ext.asyncio import ( 
    AsyncSession, 
    async_sessionmaker,
    create_async_engine
) 
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

# Base class for all database models
class Base(DeclarativeBase):
    pass

# Dependency Injection
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session   