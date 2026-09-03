"""
Seed script for identity-service — creates tables (if missing) and
inserts a small set of predictable users/profiles/wallets so the API is
immediately usable for demos/testing, and so marketplace-service's own
seed script has real instructor/learner/mentor IDs to reference (see
app/scripts/seed_constants.py for why the IDs are fixed rather than
random).

Run from this service's root with its venv active:

    python -m app.scripts.seed

Safe to re-run: checks for existing rows before inserting.
"""
import asyncio
import sys
import uuid

from sqlalchemy import select

from app.core.database import Base, engine, AsyncSessionLocal
from app.core.security import hash_password
from app.common.enums import UserRole
from app.modules.users.models import User
from app.modules.profiles.models import Profile
from app.modules.wallets.models import Wallet
from app.scripts.seed_constants import ADMIN_USER_ID, ALICE_DEV_ID, BOB_LEARNER_ID

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# (fixed id, user_name, email, password, role)
SEED_USERS = [
    (ADMIN_USER_ID, "admin_user", "admin@skillverse.dev", "admin123456", UserRole.ADMIN),
    (ALICE_DEV_ID, "alice_dev", "alice@skillverse.dev", "123456789", UserRole.USER),
    (BOB_LEARNER_ID, "bob_learner", "bob@skillverse.dev", "123456789", UserRole.USER),
]

SEED_PROFILES = {
    "admin_user": {
        "bio": "Platform administrator.",
        "age": 30,
        "gender": "Unspecified",
        "interests": [],
        "skills_learning": [],
        "skills_taught": [],
        "is_onboarded": True,
    },
    "alice_dev": {
        "bio": "Backend dev learning system design, teaches Python basics.",
        "age": 26,
        "gender": "Female",
        "interests": ["hiking", "cooking"],
        "skills_learning": ["system design", "kubernetes"],
        "skills_taught": ["python", "sql"],
        "is_onboarded": True,
    },
    "bob_learner": {
        "bio": "Learning backend development.",
        "age": 22,
        "gender": "Male",
        "interests": ["gaming", "music"],
        "skills_learning": ["python", "fastapi"],
        "skills_taught": [],
        "is_onboarded": True,
    },
}


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        for fixed_id, user_name, email, password, role in SEED_USERS:
            result = await db.execute(select(User).where(User.email == email))
            existing = result.scalar_one_or_none()

            if existing is not None:
                print(f"skip  (already exists): {email}")
                continue

            user = User(
                id=uuid.UUID(fixed_id),
                user_name=user_name,
                email=email,
                password_hash=hash_password(password),
                role=role,
            )
            db.add(user)
            await db.flush()

            profile_data = SEED_PROFILES.get(user_name, {})
            db.add(Profile(user_id=user.id, **profile_data))
            db.add(Wallet(user_id=user.id, balance=0))

            print(f"added: {email} (id={fixed_id}, role={role.value}) + profile + wallet")

        await db.commit()

    print(
        "\nSeed complete. Login with any of the emails above and their "
        "plaintext password. These same user IDs are referenced by "
        "marketplace-service's seed script — run this one first."
    )


if __name__ == "__main__":
    asyncio.run(seed())
