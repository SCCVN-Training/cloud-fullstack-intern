"""
Optional AWS Secrets Manager bootstrap.

This has to run BEFORE app.core.config is imported anywhere — it's what
populates the environment that pydantic-settings' Settings() then reads
from. Settings itself is completely unaware AWS exists; this module is
the only place that knows.

Controlled by two env vars, read directly via os.environ (not through
Settings, since Settings doesn't exist yet when this runs):

  USE_AWS_SECRETS=true            fetch from Secrets Manager
  AWS_SECRET_NAME=<secret-name>   which secret to fetch
  AWS_REGION=<region>             defaults to ap-southeast-1

When USE_AWS_SECRETS is unset or not "true" (the default), this is a
complete no-op — local development keeps reading straight from .env,
identical to every service in this project before AWS was introduced.
AWS is entirely optional infrastructure, never a hard dependency to
run the app locally.

The secret itself is expected to be a single JSON object, e.g.:
  {"DATABASE_URL": "postgresql+asyncpg://...", "SECRET_KEY": "..."}
Each key becomes an environment variable, overriding anything already
set — that's the point of turning this on.
"""
import json
import logging
import os

logger = logging.getLogger(__name__)


def load_secrets_into_environment() -> None:
    if os.environ.get("USE_AWS_SECRETS", "false").lower() != "true":
        return

    secret_name = os.environ.get("AWS_SECRET_NAME")
    region = os.environ.get("AWS_REGION", "ap-southeast-1")

    if not secret_name:
        raise RuntimeError(
            "USE_AWS_SECRETS=true but AWS_SECRET_NAME is not set — "
            "nothing to fetch. Set AWS_SECRET_NAME to the secret's name "
            "or ARN in Secrets Manager."
        )

    # Imported here, not at module top, so importing this file never
    # requires boto3 to be installed when USE_AWS_SECRETS is off —
    # matches the "AWS is optional" principle above.
    import boto3
    from botocore.exceptions import ClientError

    client = boto3.client("secretsmanager", region_name=region)

    try:
        response = client.get_secret_value(SecretId=secret_name)
    except ClientError as exc:
        # Fail loudly and immediately. Starting the app with half its
        # config silently missing (e.g. no DATABASE_URL) produces a
        # confusing pydantic ValidationError far from the real cause —
        # better to say exactly what went wrong, here, now.
        raise RuntimeError(
            f"Failed to fetch secret '{secret_name}' from Secrets Manager "
            f"in region '{region}': {exc}"
        ) from exc

    secret_string = response.get("SecretString")
    if not secret_string:
        raise RuntimeError(
            f"Secret '{secret_name}' has no SecretString (is it a binary "
            f"secret? this loader only supports JSON string secrets)"
        )

    try:
        secret_dict = json.loads(secret_string)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"Secret '{secret_name}' is not valid JSON: {exc}"
        ) from exc

    for key, value in secret_dict.items():
        os.environ[key] = str(value)

    logger.info(
        "Loaded %d value(s) from Secrets Manager secret '%s'",
        len(secret_dict), secret_name,
    )
