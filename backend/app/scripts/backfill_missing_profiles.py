"""
Backfill missing `profiles` rows for existing users. Needed because
older accounts were created before AuthService.create_user started
calling ProfileService.create_default_profile() — those users have no
profile row at all, so GET/PATCH /users/{id}/profile 404s for them.

Safe to run more than once — only inserts a profile for users that
don't already have one.

Run from backend/:
    python -m app.scripts.backfill_missing_profiles
"""
import asyncio
import sys
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine
from app.modules.users.models import User
from app.modules.profiles.models import Profile

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


async def main():
    async with AsyncSessionLocal() as db:
        all_users = (await db.execute(select(User))).scalars().all()
        existing_profile_user_ids = {
            row[0] for row in (await db.execute(select(Profile.user_id))).all()
        }

        created = 0
        for user in all_users:
            if user.id in existing_profile_user_ids:
                continue
            db.add(
                Profile(
                    user_id=user.id,
                    interests=[],
                    skills_learning=[],
                    skills_taught=[],
                )
            )
            created += 1

        await db.commit()
        print(f"Backfilled {created} missing profile row(s) out of {len(all_users)} user(s).")


if __name__ == "__main__":
    asyncio.run(main())