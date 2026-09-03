"""
Seed script for marketplace-service — creates tables (if missing) and
inserts skills/bookings/reviews.

instructor_id/learner_id/mentor_id/reviewer_id/reviewee_id below are the
SAME fixed UUIDs identity-service's seed script assigns to admin_user/
alice_dev/bob_learner (see app/scripts/seed_constants.py for why they're
fixed rather than random, and why that's a seed-data-only shortcut, not
how real cross-service references work).

Run identity-service's seed script FIRST, then this one, both from each
service's own root with its own venv active:

    python -m app.scripts.seed

Safe to re-run: checks for existing rows before inserting.
"""
import asyncio
import sys
import uuid

from sqlalchemy import select

from app.core.database import Base, engine, AsyncSessionLocal
from app.modules.skills.models import Skill
from app.modules.skills.service import SkillService
from app.modules.reviews.models import Review
from app.modules.bookings.models import Booking, BookingStatus
from app.scripts.seed_constants import ALICE_DEV_ID, BOB_LEARNER_ID

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

ALICE_ID = uuid.UUID(ALICE_DEV_ID)
BOB_ID = uuid.UUID(BOB_LEARNER_ID)

# (title, category, description, duration_minutes, level, requirements, tags)
# instructor is always alice_dev for this seed set. Duration is capped at
# 45 minutes (SkillService.MAX_DURATION_MINUTES) and price is derived
# from it via the same formula the service enforces on create/update, so
# this seed data can't violate the rule it's demonstrating.
SEED_SKILLS = [
    (
        "Angular Fundamentals", "Web Development",
        "Learn Angular components, services, routing, forms, dependency "
        "injection, and the structure of a modern Angular application.",
        45, "Intermediate",
        "Basic HTML, CSS, and TypeScript knowledge.",
        ["angular", "typescript", "frontend"],
    ),
    (
        "Docker & Container Fundamentals", "DevOps",
        "Learn containers, Dockerfiles, images, volumes, networks, and "
        "Docker Compose for running multi-service applications locally.",
        40, "Intermediate",
        "Basic command-line and application development knowledge.",
        ["docker", "containers", "devops"],
    ),
    (
        "REST API Design", "Web Development",
        "Learn how to design clean REST APIs using resources, HTTP methods, "
        "status codes, DTOs, validation, pagination, and error responses.",
        30, "Intermediate",
        "Basic understanding of HTTP and backend development.",
        ["rest", "api", "backend", "web-development"],
    ),
    (
        "FastAPI Backend Development", "Programming",
        "Build modern REST APIs with Python and FastAPI, including routing, "
        "request validation, dependency injection, and API documentation.",
        35, "Intermediate",
        "Basic Python knowledge and familiarity with HTTP APIs.",
        ["python", "fastapi", "backend", "api"],
    ),
    (
        "SQL & Database Design Basics", "Programming",
        "Learn relational schema design, joins, indexes, and how to write "
        "efficient, correct SQL queries.",
        25, "Beginner",
        "None — this is an introductory session.",
        ["sql", "databases", "backend"],
    ),
]

# (reviewer, reviewee, rating, knowledge, communication, video_audio, feedback)
SEED_REVIEW = (
    BOB_ID, ALICE_ID,
    5, 5, 4, 5,
    "Alice explained SQL joins so clearly, finally clicked for me.",
)


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # ---- Skills ----
        skill_ids_by_title: dict[str, uuid.UUID] = {}
        for title, category, description, duration, level, requirements, tags in SEED_SKILLS:
            result = await db.execute(select(Skill).where(Skill.title == title))
            existing = result.scalar_one_or_none()
            if existing is not None:
                print(f"skip  (already exists): skill '{title}'")
                skill_ids_by_title[title] = existing.id
                continue

            skill = Skill(
                title=title,
                category=category,
                description=description,
                image="https://ui-avatars.com/api/?name=" + title.replace(" ", "+"),
                price=SkillService.max_price_for_duration(duration),
                duration=duration,
                level=level,
                requirements=requirements,
                instructor_id=ALICE_ID,
                available_slots=5,
                tags=tags,
            )
            db.add(skill)
            await db.flush()
            skill_ids_by_title[title] = skill.id
            print(f"added: skill '{title}' (instructor_id={ALICE_ID})")

        await db.commit()

        # ---- One completed booking, so the review below has something to
        # attach to (reviews are booking-scoped: learner reviews mentor) ----
        skill_id = skill_ids_by_title.get("SQL & Database Design Basics")

        booking = None
        if skill_id:
            result = await db.execute(
                select(Booking).where(
                    Booking.learner_id == BOB_ID,
                    Booking.mentor_id == ALICE_ID,
                    Booking.skill_id == skill_id,
                )
            )
            booking = result.scalar_one_or_none()

            if booking is None:
                from datetime import datetime, timedelta, timezone

                booking = Booking(
                    skill_id=skill_id,
                    learner_id=BOB_ID,
                    mentor_id=ALICE_ID,
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
                reviewer_id, reviewee_id, rating, knowledge, communication, video_audio, feedback = SEED_REVIEW
                db.add(Review(
                    booking_id=booking.id,
                    reviewer_id=reviewer_id,
                    reviewee_id=reviewee_id,
                    rating=rating,
                    knowledge_rating=knowledge,
                    communication_rating=communication,
                    video_audio_rating=video_audio,
                    feedback=feedback,
                ))
                print("added: review for that booking")

        await db.commit()

    print(
        "\nSeed complete. Instructor/learner display names on these "
        "records resolve via IdentityClient at request time — make sure "
        "identity-service is running (and its own seed script has run "
        "first) or they'll show as 'Unknown User'."
    )


if __name__ == "__main__":
    asyncio.run(seed())
