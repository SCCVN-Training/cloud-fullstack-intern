"""
Structured JSON logging shared by both services (identical file in
identity-service and marketplace-service - infra, not business logic).

Correlation: CorrelationIdMiddleware (added to `app` in each service's
main.py) reads X-Request-ID off the inbound request if something
upstream already set one - the local docker-compose nginx gateway mints
one via its $request_id built-in, and marketplace-service's one
outbound call to identity-service (IdentityClient) forwards the same
header rather than letting httpx omit it - or mints a fresh uuid4 if
nothing did (e.g. hitting a service directly, as in local dev or the
deployed Traefik path, which doesn't set this header). Either way the
id lands in `request_id_ctx` for the lifetime of the request, and every
log line emitted during that request picks it up automatically via the
formatter below - no need to pass request_id explicitly at each call
site.
"""
import json
import logging
import sys
import uuid
from contextvars import ContextVar

from starlette.middleware.base import BaseHTTPMiddleware

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

# A request with no business-logic log calls (e.g. a plain /health hit,
# or any successful happy path that never calls logger.warning/error)
# would otherwise leave no trace at all - this is what makes every
# request show up in the logs, request_id included, regardless of
# whether the route handler itself logs anything.
_access_logger = logging.getLogger("app.request")


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = request_id_ctx.set(request_id)
        try:
            response = await call_next(request)
            _access_logger.info("%s %s -> %s", request.method, request.url.path, response.status_code)
        finally:
            request_id_ctx.reset(token)
        response.headers["X-Request-ID"] = request_id
        return response


class JsonFormatter(logging.Formatter):
    def __init__(self, service_name: str) -> None:
        super().__init__()
        self._service_name = service_name

    def format(self, record: logging.LogRecord) -> str:
        return json.dumps({
            "timestamp": self.formatTime(record, datefmt="%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "service": self._service_name,
            "logger": record.name,
            "request_id": request_id_ctx.get(),
            "message": record.getMessage(),
        })


def configure_logging(service_name: str) -> logging.Logger:
    """
    Attaches the JSON handler to the "app" logger, not `service_name` -
    every call site in this codebase logs via `logging.getLogger(__name__)`,
    which for anything inside the `app` package (e.g. "app.core.aws_secrets",
    "app.modules.bookings.service") is a descendant of "app" and propagates
    up to it by default. This is what makes structured logging apply
    automatically to every existing/future log call without touching each
    site individually. `service_name` (e.g. "identity-service") is baked
    into every JSON line via the formatter instead, so logs from both
    services can be told apart once aggregated together (e.g. in
    CloudWatch).

    Idempotent on purpose: uvicorn --reload re-imports this module on
    every code change, and calling addHandler() again each time would
    silently stack up N duplicate handlers -> N copies of every log
    line. Guard by name instead of assuming "called once".
    """
    logger = logging.getLogger("app")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter(service_name))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        # Don't also hand records to the root logger's default handler
        # (uvicorn installs one) - that would print every line twice,
        # once as JSON and once as uvicorn's plain-text default.
        logger.propagate = False
    return logger
