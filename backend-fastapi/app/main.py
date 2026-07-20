import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import app_settings
from app.core.database import BaseDeclarativeModel, mongodb_client, neon_async_engine
from app.modules.auth.router import auth_router

# Configure Logger to match Uvicorn's format
logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def application_lifespan(app: FastAPI):
    """Handles startup connection tests and schema migrations."""
    logger.info("⚡ Initializing database connections...")

    # 1. Verify Neon PostgreSQL Connection
    try:
        async with neon_async_engine.begin() as connection:
            # Create tables if they don't exist
            await connection.run_sync(BaseDeclarativeModel.metadata.create_all)
            # Execute a lightweight ping query
            await connection.execute(text("SELECT 1"))
        logger.info("✅ Successfully connected to Neon PostgreSQL!")
    except Exception as error:
        logger.error(f"❌ Failed to connect to Neon PostgreSQL: {error}")

    # 2. Verify MongoDB Connection
    try:
        # Ping the MongoDB admin database
        await mongodb_client.admin.command("ping")
        logger.info("✅ Successfully connected to MongoDB!")
    except Exception as error:
        logger.error(f"❌ Failed to connect to MongoDB: {error}")

    yield

    logger.info("🛑 Shutting down application resources...")


app = FastAPI(
    title=app_settings.PROJECT_NAME,
    lifespan=application_lifespan,
)

# CORS setup for HTTP-Only cookie support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Domain Routers
app.include_router(auth_router)


@app.get("/health", tags=["Health Check"])
async def application_health_check():
    return {"status": "healthy", "environment": app_settings.ENVIRONMENT}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=["app"],
    )