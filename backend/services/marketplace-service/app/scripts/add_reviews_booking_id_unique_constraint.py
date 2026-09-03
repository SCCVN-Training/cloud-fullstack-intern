"""
One-off fix for schema drift: `Base.metadata.create_all` (used in
main.py's lifespan) only creates missing tables, it never ALTERs an
existing one. `Review.booking_id` has had `unique=True` on the model for
a while (one review per booking — a learner reviews the mentor at most
once), but the `reviews` table was created before that was added, so the
live database may still be missing the actual UNIQUE constraint even
though the Python model declares it and the application layer already
checks for an existing review before inserting.

Run once from services/marketplace-service/:
    python -m app.scripts.add_reviews_booking_id_unique_constraint

Safe to run more than once — it checks whether a unique constraint on
that column already exists before trying to add one.
"""
import asyncio
import sys

from sqlalchemy import text

from app.core.database import engine

# Windows defaults to ProactorEventLoop, which psycopg's async driver
# can't use. uvicorn sets a compatible policy internally; this
# standalone script needs to do it explicitly.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

CONSTRAINT_NAME = "reviews_booking_id_key"


async def main():
    async with engine.begin() as conn:
        result = await conn.execute(
            text(
                """
                SELECT tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.table_schema = 'marketplace'
                    AND tc.table_name = 'reviews'
                    AND tc.constraint_type = 'UNIQUE'
                    AND kcu.column_name = 'booking_id'
                """
            )
        )
        if result.first():
            print("reviews.booking_id already has a unique constraint — nothing to do.")
            return

        await conn.execute(
            text(
                f"ALTER TABLE marketplace.reviews "
                f"ADD CONSTRAINT {CONSTRAINT_NAME} UNIQUE (booking_id)"
            )
        )
        print(f"Added unique constraint {CONSTRAINT_NAME} on reviews.booking_id.")


if __name__ == "__main__":
    asyncio.run(main())
