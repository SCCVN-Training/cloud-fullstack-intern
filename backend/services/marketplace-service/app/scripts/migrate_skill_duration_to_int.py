"""
One-off migration: `Skill.duration` changed from a free-text string
(e.g. "60 min") to an integer number of minutes, so the new
duration/price validation in SkillService can actually validate and
compute on it. `Base.metadata.create_all` never ALTERs an existing
column's type, so a live database created before this change needs its
`skills.duration` column converted explicitly.

Existing values are parsed by stripping everything but digits (e.g.
"60 min" -> 60); a row with no digits at all falls back to 45 (the new
max) rather than failing the migration outright.

Run once from services/marketplace-service/:
    python -m app.scripts.migrate_skill_duration_to_int

Safe to run more than once — checks the column's current data type
before attempting the ALTER.
"""
import asyncio
import sys

from sqlalchemy import text

from app.core.database import engine

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


async def main():
    async with engine.begin() as conn:
        result = await conn.execute(
            text(
                """
                SELECT data_type
                FROM information_schema.columns
                WHERE table_schema = 'marketplace'
                    AND table_name = 'skills'
                    AND column_name = 'duration'
                """
            )
        )
        row = result.first()
        if row is None:
            print("marketplace.skills.duration column not found — nothing to do.")
            return
        if row[0] == "integer":
            print("marketplace.skills.duration is already integer — nothing to do.")
            return

        await conn.execute(
            text(
                """
                ALTER TABLE marketplace.skills
                ALTER COLUMN duration TYPE integer
                USING COALESCE(NULLIF(regexp_replace(duration, '\\D', '', 'g'), '')::integer, 45)
                """
            )
        )
        print("Converted marketplace.skills.duration from text to integer minutes.")


if __name__ == "__main__":
    asyncio.run(main())
