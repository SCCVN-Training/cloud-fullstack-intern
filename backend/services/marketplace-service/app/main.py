from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi.errors import RateLimitExceeded

# Must run before ANY app.core.config import, anywhere. See
# aws_secrets.py's docstring — a no-op unless USE_AWS_SECRETS=true.
from app.core.aws_secrets import load_secrets_into_environment
load_secrets_into_environment()

from app.core.database import Base, engine
from app.core.rate_limit import limiter
from app.core.exceptions import register_exception_handlers

from app.modules.skills.router import router as skills_router
from app.modules.bookings.router import router as bookings_router
from app.modules.reviews.router import user_reviews_router, booking_reviews_router
from app.modules.training.router import router as training_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # CREATE SCHEMA first — see identity-service/app/main.py's
        # comment for the full reasoning. Skipped entirely on SQLite
        # (test suite), where Base.metadata.schema is None.
        if Base.metadata.schema:
            from sqlalchemy.schema import CreateSchema
            await conn.execute(CreateSchema(Base.metadata.schema, if_not_exists=True))

        # Only marketplace-owned models (Skill, Booking, Review) are
        # imported anywhere in this service, so this only ever creates
        # this service's own tables — identity-service's schema is
        # never touched from here.
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="SkillVerse Marketplace Service",
    version="1.0.0",
    lifespan=lifespan,
)

register_exception_handlers(app)

app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": f"Rate limit exceeded: {exc.detail}. Please slow down and try again shortly."},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(skills_router)
app.include_router(bookings_router)
app.include_router(user_reviews_router)
app.include_router(booking_reviews_router)
app.include_router(training_router)


@app.get("/health")
async def health():
    return {"service": "marketplace-service", "status": "ok"}


@app.get("/")
async def root():
    return {"message": "SkillVerse Marketplace Service"}
