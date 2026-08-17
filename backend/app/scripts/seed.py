"""
Seed script — creates tables (if missing) and inserts a small set of
predictable test data so the API is immediately usable for demos/testing.

Run from the `backend/` folder with your venv active:

    python -m app.scripts.seed

Safe to re-run: it checks for existing rows before inserting, so running
it twice won't create duplicates or crash on a unique constraint violation.
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
from app.modules.skills.models import Skill
from app.modules.reviews.models import Review
from app.modules.bookings.models import Booking, BookingStatus

# Windows defaults to ProactorEventLoop, which psycopg's async driver can't
# use. uvicorn sets a compatible policy internally; this standalone script
# needs to do it explicitly.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# (user_name, email, password, role)
SEED_USERS = [
    ("admin_user", "admin@skillverse.dev", "AdminPass123", UserRole.ADMIN),
    ("alice_dev", "alice@skillverse.dev", "AlicePass123", UserRole.USER),
    ("bob_learner", "bob@skillverse.dev", "BobPass123", UserRole.USER),
]

# keyed by user_name — full_name is gone from Profile (identity now lives
# only on User.user_name), so this no longer sets it.
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

# (title, category, description, instructor user_name, price, duration,
#  level, requirements, tags)
SEED_SKILLS = [
    (
        "Python Fundamentals for Beginners",
        "Programming",
        "Learn Python from scratch: variables, control flow, functions, and "
        "basic data structures, with hands-on exercises every session.",
        "alice_dev",
        25,
        "60 min",
        "Beginner",
        "A laptop with Python 3.10+ installed. No prior experience needed.",
        ["python", "programming", "beginner"],
    ),
    (
        "SQL & Database Design Basics",
        "Programming",
        "Understand relational databases, write real SQL queries, and learn "
        "how to design a normalized schema for a small application.",
        "alice_dev",
        30,
        "45 min",
        "Beginner",
        "Basic comfort with a computer. No SQL experience required.",
        ["sql", "databases"],
    ),
    (
        "Intro to System Design",
        "Programming",
        "A practical walkthrough of how to approach system design "
        "interviews and real-world architecture decisions.",
        "alice_dev",
        45,
        "90 min",
        "Intermediate",
        "Comfortable with at least one backend language and basic databases.",
        ["system-design", "architecture"],
    ),
]

# (reviewer email, reviewee email, rating, knowledge, communication,
#  video_audio, feedback) — attached to the first seeded booking below.
SEED_REVIEW = (
    "bob@skillverse.dev", "alice@skillverse.dev",
    5, 5, 4, 5,
    "Alice explained SQL joins so clearly, finally clicked for me.",
)


async def seed() -> None:
    # Create tables if they don't exist yet (does NOT alter existing ones —
    # for real schema changes you'd reach for Alembic migrations instead)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        user_ids_by_name: dict[str, uuid.UUID] = {}

        # ---- Users, profiles, wallets ----
        for user_name, email, password, role in SEED_USERS:
            result = await db.execute(select(User).where(User.email == email))
            existing = result.scalar_one_or_none()

            if existing is not None:
                print(f"skip  (already exists): {email}")
                user_ids_by_name[user_name] = existing.id
                continue

            user = User(
                user_name=user_name,
                email=email,
                password_hash=hash_password(password),
                role=role,
            )
            db.add(user)
            await db.flush()  # get user.id before creating profile/wallet

            profile_data = SEED_PROFILES.get(user_name, {})
            db.add(Profile(user_id=user.id, **profile_data))
            db.add(Wallet(user_id=user.id, balance=0))

            user_ids_by_name[user_name] = user.id
            print(f"added: {email} (role={role.value}) + profile + wallet")

        await db.commit()

        # ---- Skills ----
        skill_ids_by_title: dict[str, uuid.UUID] = {}
        for title, category, description, instructor_name, price, duration, level, requirements, tags in SEED_SKILLS:
            result = await db.execute(select(Skill).where(Skill.title == title))
            existing = result.scalar_one_or_none()
            if existing is not None:
                print(f"skip  (already exists): skill '{title}'")
                skill_ids_by_title[title] = existing.id
                continue

            instructor_id = user_ids_by_name.get(instructor_name)
            if instructor_id is None:
                print(f"skip  (no such instructor '{instructor_name}'): skill '{title}'")
                continue

            skill = Skill(
                title=title,
                category=category,
                description=description,
                image="https://ui-avatars.com/api/?name=" + title.replace(" ", "+"),
                price=price,
                duration=duration,
                level=level,
                requirements=requirements,
                instructor_id=instructor_id,
                available_slots=5,
                tags=tags,
            )
            db.add(skill)
            await db.flush()
            skill_ids_by_title[title] = skill.id
            print(f"added: skill '{title}' (instructor={instructor_name})")

        await db.commit()

        # ---- One completed booking, so the review below has something to
        # attach to (reviews are booking-scoped: learner reviews mentor) ----
        learner_id = user_ids_by_name.get("bob_learner")
        mentor_id = user_ids_by_name.get("alice_dev")
        skill_id = skill_ids_by_title.get("SQL & Database Design Basics")

        booking = None
        if learner_id and mentor_id and skill_id:
            result = await db.execute(
                select(Booking).where(
                    Booking.learner_id == learner_id,
                    Booking.mentor_id == mentor_id,
                    Booking.skill_id == skill_id,
                )
            )
            booking = result.scalar_one_or_none()

            if booking is None:
                from datetime import datetime, timedelta, timezone

                booking = Booking(
                    skill_id=skill_id,
                    learner_id=learner_id,
                    mentor_id=mentor_id,
                    session_date=datetime.now(timezone.utc) - timedelta(days=1),
                    duration=45,
                    session_notes="Great first session.",
                    status=BookingStatus.COMPLETED,
                    price_paid=30,
                )
                db.add(booking)
                await db.flush()
                print("added: completed booking (bob_learner <- alice_dev, SQL & Database Design Basics)")

        await db.commit()

        # ---- Review, tied to that booking ----
        if booking is not None:
            result = await db.execute(select(Review).where(Review.booking_id == booking.id))
            if result.scalar_one_or_none() is None:
                _, _, rating, knowledge, communication, video_audio, feedback = SEED_REVIEW
                db.add(Review(
                    booking_id=booking.id,
                    reviewer_id=learner_id,
                    reviewee_id=mentor_id,
                    rating=rating,
                    knowledge_rating=knowledge,
                    communication_rating=communication,
                    video_audio_rating=video_audio,
                    feedback=feedback,
                ))
                print("added: review for that booking")

        await db.commit()

    print("\nSeed complete. Login with any of the emails above and their plaintext password.")


if __name__ == "__main__":
    asyncio.run(seed())
