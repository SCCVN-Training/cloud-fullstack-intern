"""
One-off fix for schema drift: `Base.metadata.create_all` (used in main.py's
lifespan) only creates missing tables, it never ALTERs an existing one. The
`profiles` table was created before `is_onboarded` was added to the model,
so the live database is missing that column even though the Python model
has it.

Run once from backend_app/:
    python -m app.scripts.add_is_onboarded_column

Safe to run more than once — it checks whether the column already exists
before trying to add it.
"""
import asyncio
import sys
from sqlalchemy import text
from app.core.database import engine

# Windows defaults to ProactorEventLoop, which psycopg's async driver can't
# use. uvicorn sets a compatible policy internally; this standalone script
# needs to do it explicitly.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


async def main():
    async with engine.begin() as conn:
        result = await conn.execute(
            text(
                """
                SELECT column_name FROM information_schema.columns
                WHERE table_name = 'profiles' AND column_name = 'is_onboarded'
                """
            )
        )
        if result.first():
            print("profiles.is_onboarded already exists — nothing to do.")
            return

        await conn.execute(
            text(
                "ALTER TABLE profiles ADD COLUMN is_onboarded BOOLEAN NOT NULL DEFAULT false"
            )
        )
        print("Added profiles.is_onboarded (default false).")


if __name__ == "__main__":
    asyncio.run(main())