from contextlib import asynccontextmanager

from fastapi import FastAPI
from modules.auth.routers import auth_router
from shared.config import settings
from shared.database import (
    close_db,
    close_mongo,
    init_db,
    init_mongo,
    is_mongo_connected,
)
from shared.logger import get_logger

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

    # Initialize MongoDB
    try:
        logger.info("Initializing MongoDB...")
        await init_mongo()
        if is_mongo_connected():
            logger.info("✅ MongoDB initialized successfully")
        else:
            logger.warning("⚠️ MongoDB initialization completed but not connected")
    except Exception as e:
        logger.warning(f"⚠️ MongoDB initialization failed: {e}")
        logger.warning("Continuing without MongoDB... (audit logging will be disabled)")

    logger.info("All services started successfully")
    yield

    # Shutdown
    logger.info("Shutting down services...")
    try:
        await close_db()
        logger.info("✅ PostgreSQL closed")
    except Exception as e:
        logger.error(f"Error closing PostgreSQL: {e}")

    try:
        await close_mongo()
        logger.info("✅ MongoDB closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB: {e}")

    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.project_name,
    version="2.0.0",
    description="Authentication Microservices for Otakutory",
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
app.include_router(auth_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
    )
