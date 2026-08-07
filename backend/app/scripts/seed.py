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
import uuid

from sqlalchemy import select

from app.core.database import Base, engine, AsyncSessionLocal
from app.core.security import hash_password
from app.common.enums import UserRole
from app.modules.users.models import User
from app.modules.profiles.models import Profile
from app.modules.reviews.models import Review

# (user_name, email, password, role)
SEED_USERS = [
    ("admin_user", "admin@skillverse.dev", "AdminPass123", UserRole.ADMIN),
    ("alice_dev", "alice@skillverse.dev", "AlicePass123", UserRole.USER),
    ("bob_learner", "bob@skillverse.dev", "BobPass123", UserRole.USER),
]

# keyed by email — matches a seeded user above
SEED_PROFILES = {
    "admin_user": {
        "full_name": "Admin User",
        "bio": "Platform administrator.",
        "age": 30,
        "gender": "Unspecified",
        "interests": [],
        "skills_learning": [],
        "skills_taught": [],
        "is_onboarded": True,
    },
    "alice_dev": {
        "full_name": "Alice Nguyen",
        "bio": "Backend dev learning system design, teaches Python basics.",
        "age": 26,
        "gender": "Female",
        "interests": ["hiking", "cooking"],
        "skills_learning": ["system design", "kubernetes"],
        "skills_taught": ["python", "sql"],
        "is_onboarded": True,
    },
    "bob_learner": {
        "full_name": "Bob Tran",
        "bio": "Learning backend development.",
        "age": 22,
        "gender": "Male",
        "interests": ["gaming", "music"],
        "skills_learning": ["python", "fastapi"],
        "skills_taught": [],
        "is_onboarded": True,
    },
}

# (reviewer email, reviewee email, rating, comment)
SEED_REVIEWS = [
    ("bob@skillverse.dev", "alice@skillverse.dev", 5,
     "Alice explained SQL joins so clearly, finally clicked for me."),
    ("bob@skillverse.dev", "alice@skillverse.dev", 4,
     "Great intro session on Python basics, would book again."),
]

async def seed() -> None:
    # Create tables if they don't exist yet (does NOT drop/alter existing ones —
    # for real schema changes later you'd reach for Alembic migrations instead)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        user_ids_by_email: dict[str, "uuid.UUID"] = {}

        for user_name, email, password, role in SEED_USERS:
            result = await db.execute(select(User).where(User.email == email))
            existing = result.scalar_one_or_none()

            if existing is not None:
                print(f"skip  (already exists): {email}")
                user_ids_by_email[email] = existing.id
                continue

            user = User(
                user_name=user_name,
                email=email,
                password_hash=hash_password(password),
                role=role,
            )
            db.add(user)
            await db.flush()  # get user.id before creating the profile

            profile_data = SEED_PROFILES.get(user_name, {})
            profile = Profile(user_id=user.id, **profile_data)
            db.add(profile)

            user_ids_by_email[email] = user.id
            print(f"added: {email} (role={role.value}) + profile")

        await db.commit()

        # Seed a couple of sample reviews between seeded users, so the
        # reviews endpoints/UI have something to display out of the box.
        for reviewer_email, reviewee_email, rating, comment in SEED_REVIEWS:
            reviewer_id = user_ids_by_email.get(reviewer_email)
            reviewee_id = user_ids_by_email.get(reviewee_email)
            if reviewer_id is None or reviewee_id is None:
                continue

            result = await db.execute(
                select(Review).where(
                    Review.reviewer_id == reviewer_id,
                    Review.reviewee_id == reviewee_id,
                    Review.comment == comment,
                )
            )
            if result.scalar_one_or_none() is not None:
                continue  # already seeded, keep this idempotent

            db.add(Review(
                reviewer_id=reviewer_id,
                reviewee_id=reviewee_id,
                rating=rating,
                comment=comment,
            ))
            print(f"added review: {reviewer_email} -> {reviewee_email}")

        await db.commit()

    print("\nSeed complete. Login with any of the emails above and their plaintext password.")

if __name__ == "__main__":
    asyncio.run(seed())
