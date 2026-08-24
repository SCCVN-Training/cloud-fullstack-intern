"""
Structured JSON logging shared by both services (identical file in
identity-service and marketplace-service - infra, not business logic).

Correlation: the gateway (nginx) mints X-Request-ID once per inbound
request. Each service's request-id middleware (see main.py) reads that
header into `request_id_ctx` for the lifetime of the request, and every
log line emitted during that request picks it up automatically via the
formatter below - no need to pass request_id explicitly at each call
site. marketplace-service's one outbound call to identity-service
(IdentityClient) forwards the same header instead of letting httpx omit
it, so the id threads all the way through one logical request across
both services.
"""
import logging
import sys
import json
from contextvars import ContextVar

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        return json.dumps({
            "timestamp": self.formatTime(record, datefmt="%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "service": record.name,
            "request_id": request_id_ctx.get(),
            "message": record.getMessage(),
        })


def configure_logging(service_name: str) -> logging.Logger:
    """
    Idempotent on purpose: uvicorn --reload re-imports this module on
    every code change, and calling addHandler() again each time would
    silently stack up N duplicate handlers -> N copies of every log
    line. Guard by name instead of assuming "called once".
    """
    logger = logging.getLogger(service_name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        # Don't also hand records to the root logger's default handler
        # (uvicorn installs one) - that would print every line twice,
        # once as JSON and once as uvicorn's plain-text default.
        logger.propagate = False
    return logger
