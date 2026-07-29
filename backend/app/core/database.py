from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.core.config import DATABASE_URL

# Create database engine (connection between Python and Neon PostgreSQL)
engine = create_engine(
    DATABASE_URL,
    echo=True    # Print every SQL statement
)

# Create database session factory (each request gets its own session)
SessionLocal = sessionmaker(
    autoflush=False,
    autocommit=False,
    bind=engine
)

# Base class for all database models
class Base(DeclarativeBase):
    pass

# Dependency Injection
def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()