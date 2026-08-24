import logging
import sys

from shared.config import settings


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
    logger = logging.getLogger(name or __name__)

    # Only configure if no handlers exist (prevent duplicate logs)
    if not logger.handlers:
        # Set level based on environment
        if settings.is_development:
            logger.setLevel(logging.DEBUG)
        else:
            logger.setLevel(logging.INFO)

        # Console handler
        handler = logging.StreamHandler(sys.stdout)

        # Formatter with timestamp and context
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)

        # Prevent propagation to root logger
        logger.propagate = False

    return logger
