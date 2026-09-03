from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
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

# if not settings.is_development:
#     try:
#         from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

#         # Attach X-Ray tracking to all FastAPI endpoints automatically
#         FastAPIInstrumentor.instrument_app(app)
#         logger.info(
#             "✅ OpenTelemetry instrumentation is ENABLED for cloud environment."
#         )
#     except ImportError:
#         logger.error(
#             "❌ OpenTelemetry packages are not installed. Tracing is DISABLED."
#         )
# else:
#     logger.info("⚠️ Running in DEVELOPMENT mode. OpenTelemetry tracing is DISABLED.")

import os

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

if not settings.is_development:
    try:
        resource = Resource.create(
            attributes={
                "service.name": os.getenv("OTEL_SERVICE_NAME", settings.project_name)
            }
        )

        provider = TracerProvider(resource=resource)

        otlp_endpoint = os.getenv(
            "OTEL_EXPORTER_OTLP_ENDPOINT",
            "http://adot-collector-opentelemetry-collector.amazon-cloudwatch.svc.cluster.local:4317",
        )
        exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)

        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)

        FastAPIInstrumentor.instrument_app(app)
        logger.info("✅ OpenTelemetry is ENABLED via MANUAL SDK setup (CLI bypassed).")
    except Exception as e:
        logger.error(f"❌ Failed to initialize OpenTelemetry manually: {e}")
else:
    logger.info("⚠️ Running in DEVELOPMENT mode. OpenTelemetry tracing is DISABLED.")
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
app.include_router(auth_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.debug,
    )
