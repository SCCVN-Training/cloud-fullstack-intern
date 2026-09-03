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

# schema="identity" makes every generated statement fully-qualified
# (e.g. "identity"."users") rather than relying on the Postgres session
# variable search_path.
#
# This matters specifically because Neon's pooled (-pooler) endpoint
# runs PgBouncer in transaction mode, which does NOT reliably honor
# search_path set via the connection string or a session-level SET —
# Neon's own docs list "fully qualify schema names" as the recommended
# workaround for exactly this. Schema-qualified metadata does that
# automatically, for every query, with no reliance on pooler behavior.
#
# SQLite (used by the test suite — see tests/conftest.py) has no
# equivalent concept of schemas the way Postgres does, so schema=None
# there, or CREATE TABLE "identity"."users" fails outright against
# SQLite with "unknown database identity".
_use_schema = not settings.DATABASE_URL.startswith("sqlite")

class Base(DeclarativeBase):
    metadata = MetaData(schema="identity" if _use_schema else None)

# Dependency Injection
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session   