from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from modules.anime.routers import anime_router
from shared.config import settings
from shared.logger import get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events."""
    # Startup
    logger.info(f"Starting {settings.project_name}...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")

    logger.info("All services started successfully")
    yield

    # Shutdown
    logger.info("Shutting down services...")

    logger.info("Shutdown complete")


app = FastAPI(
    title=settings.project_name,
    version="2.0.0",
    description="Anime Microservices for Otakutory",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

from starlette.exceptions import HTTPException as StarletteHTTPException


# Standardize HTTP Exceptions
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": f"ERR_{exc.status_code}",
            "message": exc.detail,
            "details": None,
        },
    )


# Standardize Validation Errors (e.g., wrong payload format)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": "Invalid request payload",
            "details": exc.errors(),
        },
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
app.include_router(anime_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
    )
