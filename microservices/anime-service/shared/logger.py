import logging
import sys

from opentelemetry import trace

from shared.config import settings

# _IS_LOGGING_INSTRUMENTED = False


class OTelFallbackFilter(logging.Filter):
    """
    Safety net:
    Ensures OTel variables always exist in the LogRecord even during application
    startup when OpenTelemetry might not be fully initialized by Uvicorn.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        span = trace.get_current_span()
        ctx = span.get_span_context()

        if ctx.is_valid:
            record.otelTraceID = trace.format_trace_id(ctx.trace_id)
            record.otelSpanID = trace.format_span_id(ctx.span_id)
        else:
            record.otelTraceID = "0"
            record.otelSpanID = "0"
        return True


def get_logger(name: str | None = None) -> logging.Logger:
    """
    Get a configured logger instance.

    Args:
        name: Logger name (usually __name__ of the module)

    Returns:
        Configured logger instance

    Usage:
        from shared.utils import get_logger

        logger = get_logger(__name__)
        logger.info("Application started")
    """
    # global _IS_LOGGING_INSTRUMENTED
    logger = logging.getLogger(name or __name__)

    # Only configure if no handlers exist (prevent duplicate logs)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)

        # Attach the fallback filter to prevent KeyError crashes
        handler.addFilter(OTelFallbackFilter())

        # Set level and formatter based on environment
        if settings.is_development:
            logger.setLevel(logging.DEBUG)
            # Standard clean format for local development
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        else:
            logger.setLevel(logging.INFO)
            # Cloud format: Inject OpenTelemetry trace and span IDs for AWS CloudWatch
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - [trace_id=%(otelTraceID)s span_id=%(otelSpanID)s] - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )

            # Instrument the built-in logging module globally
            # if not _IS_LOGGING_INSTRUMENTED:
            #     try:
            #         from opentelemetry.instrumentation.logging import (
            #             LoggingInstrumentor,
            #         )

            #         LoggingInstrumentor().instrument(set_logging_format=False)
            #         _IS_LOGGING_INSTRUMENTED = True
            #     except ImportError:
            #         # Fallback just in case dependencies are missing
            #         pass

        handler.setFormatter(formatter)
        logger.addHandler(handler)

        # Prevent propagation to root logger
        logger.propagate = False

    return logger
