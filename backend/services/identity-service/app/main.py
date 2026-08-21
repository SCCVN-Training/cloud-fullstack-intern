from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi.errors import RateLimitExceeded
import os

# Must run before ANY app.core.config import, anywhere — this is what
# populates the environment Settings() reads from. See the module
# docstring in aws_secrets.py: a complete no-op unless
# USE_AWS_SECRETS=true is set, so local dev is unaffected by default.
from app.core.aws_secrets import load_secrets_into_environment
load_secrets_into_environment()

from app.core.database import Base, engine
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.exceptions import register_exception_handlers

from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router, admin_router as users_admin_router
from app.modules.profiles.router import router as profiles_router, internal_router as profiles_internal_router
from app.modules.wallets.router import router as wallets_router
from app.modules.transactions.router import router as transactions_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # CREATE SCHEMA first — create_all() below only creates TABLES,
        # it assumes the schema itself already exists. On Postgres this
        # runs "CREATE SCHEMA IF NOT EXISTS identity". On SQLite (test
        # suite) Base.metadata.schema is None (see database.py), so
        # this is skipped entirely — SQLAlchemy has no equivalent
        # concept to create there.
        if Base.metadata.schema:
            from sqlalchemy.schema import CreateSchema
            await conn.execute(CreateSchema(Base.metadata.schema, if_not_exists=True))

        # Create this service's own tables. Only identity-owned models
        # (User, Profile, Wallet, Transaction) are imported anywhere in
        # this service, so Base.metadata only ever describes this
        # service's schema — marketplace-service's tables are never
        # touched from here.
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="SkillVerse Identity Service",
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

os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
app.mount("/media", StaticFiles(directory=settings.MEDIA_ROOT), name="media")

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

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(users_admin_router)
app.include_router(profiles_router)
app.include_router(profiles_internal_router)
app.include_router(wallets_router)
app.include_router(transactions_router)


@app.get("/health")
async def health():
    return {"service": "identity-service", "status": "ok"}


@app.get("/")
async def root():
    return {"message": "SkillVerse Identity Service"}
