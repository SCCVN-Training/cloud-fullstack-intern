from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.core.database import Base, engine
from app.modules.auth.router import router as auth_router
from app.core.exceptions import register_exception_handlers

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

# Routers
app.include_router(auth_router)

# Root Endpoint
@app.get("/")
async def root():
    return{
        "message": "Welcome to SkillVerse API"
    }