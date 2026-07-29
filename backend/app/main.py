from fastapi import FastAPI

from app.core.database import Base, engine
from app.models.user import User
from app.routers.auth import router as auth_router

app = FastAPI(
    title="SkillVerse API",
    version="1.0.0"
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)

@app.get("/")
def root():
    return{
        "message": "Welcome to SkillVerse API"
    }