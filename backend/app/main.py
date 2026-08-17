from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.database import Base, engine
from app.modules.auth.router import router as auth_router
from app.modules.users.router import router as users_router, admin_router as users_admin_router
from app.modules.profiles.router import router as profiles_router
from app.modules.reviews.router import user_reviews_router, booking_reviews_router
from app.modules.skills.router import router as skills_router
from app.modules.bookings.router import router as bookings_router
from app.modules.wallets.router import router as wallets_router
from app.modules.transactions.router import router as transactions_router
from app.modules.wallets.router import router as wallets_router
from app.core.exceptions import register_exception_handlers

from app.modules.training.router import router as training_router 

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on application startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title="SkillVerse API",
    version="1.0.0",
    lifespan=lifespan
)

# Register Global Exception Handlers
register_exception_handlers(app)

# CORS — allows the Angular dev server (localhost:4200) to call this API
# from the browser. Tighten allow_origins to your real domain(s) before
# deploying.
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

# Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(users_admin_router)
app.include_router(profiles_router)
app.include_router(user_reviews_router)
app.include_router(booking_reviews_router)
app.include_router(skills_router)
app.include_router(bookings_router)
app.include_router(wallets_router)
app.include_router(transactions_router)
app.include_router(wallets_router)

app.include_router(training_router)

# Root Endpoint
@app.get("/")
async def root():
    return{
        "message": "Welcome to SkillVerse API"
    }