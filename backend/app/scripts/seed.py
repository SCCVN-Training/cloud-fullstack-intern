"""
Seed script — creates tables (if missing) and inserts a small set of
predictable test data so the API is immediately usable for demos/testing.

Run from the `backend/` folder with your venv active:

    python -m app.scripts.seed

Safe to re-run: it checks for existing users by email before inserting,
so running it twice won't create duplicates or crash on a unique
constraint violation.
"""
import asyncio

from sqlalchemy import select

from app.core.database import Base, engine, AsyncSessionLocal
from app.core.security import hash_password
from app.common.enums import UserRole
from app.modules.users.models import User

# (user_name, email, password, role)
SEED_USERS = [
    ("admin_user", "admin@skillverse.dev", "AdminPass123", UserRole.ADMIN),
    ("alice_dev", "alice@skillverse.dev", "AlicePass123", UserRole.USER),
    ("bob_learner", "bob@skillverse.dev", "BobPass123", UserRole.USER),
]


async def seed() -> None:
    # Create tables if they don't exist yet (does NOT drop/alter existing ones —
    # for real schema changes later you'd reach for Alembic migrations instead)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        for user_name, email, password, role in SEED_USERS:
            result = await db.execute(select(User).where(User.email == email))
            existing = result.scalar_one_or_none()

            if existing is not None:
                print(f"skip  (already exists): {email}")
                continue

            user = User(
                user_name=user_name,
                email=email,
                password_hash=hash_password(password),
                role=role,
            )
            db.add(user)
            print(f"added: {email} (role={role.value})")

        await db.commit()

    print("\nSeed complete. Login with any of the emails above and their plaintext password.")


if __name__ == "__main__":
    asyncio.run(seed())
