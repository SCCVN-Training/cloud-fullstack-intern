from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.core.database import Base, engine
from app.routers.auth import router as auth_router

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

app.include_router(auth_router)

@app.get("/")
def root():
    return{
        "message": "Welcome to SkillVerse API"
    }