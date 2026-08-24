from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from shared.database import init_db, close_db
from shared.config import settings
from shared.logger import get_logger
from modules.profile.routers import profile_router

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    logger.info(f"Starting {settings.project_name}...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")

    # Initialize PostgreSQL
    try:
        logger.info("Initializing PostgreSQL...")
        await init_db()
        logger.info("✅ PostgreSQL initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize PostgreSQL: {e}")
        raise
    logger.info("All services started successfully")
    yield

    # Shutdown
    logger.info("Shutting down services...")
    try:
        await close_db()
        logger.info("✅ PostgreSQL closed")
    except Exception as e:
        logger.error(f"Error closing PostgreSQL: {e}")

    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.project_name,
    version="2.0.0",
    description="Profile Microservices for Otakutory",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:4200",
#         "http://localhost:3000",
#         "http://localhost:5173",
#         "http://localhost:8080"
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Include API Gateway router
app.include_router(profile_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
    )
