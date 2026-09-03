"""
avatar-validator — a simple, standalone Lambda function triggered by
S3 ObjectCreated events on the avatars/ prefix of the SkillVerse
avatars bucket.

Why this exists: identity-service already validates avatar size and
content-type before upload (see app/core/storage.py). This Lambda is
defense-in-depth — anything that reaches the bucket by ANY path (a
future admin tool, a misconfigured IAM policy, direct console upload)
gets checked again, independently of the API. This is a genuinely
common serverless pattern: event-driven, decoupled validation that
can't be bypassed just because a request skipped the usual API path.

Zero third-party dependencies (only boto3, which every Lambda Python
runtime ships with by default) — deployable straight from the AWS
Console's inline code editor, no zip upload or Lambda layer needed.

Trigger setup (see the Week 6 guide for full console steps):
  S3 bucket -> Properties -> Event notifications -> Create event
  notification -> Event type: "All object create events" ->
  Prefix: avatars/ -> Destination: this Lambda function

Required IAM permissions on this function's execution role:
  s3:GetObject, s3:PutObject, s3:DeleteObject — scoped to this one
  bucket only (see the guide's least-privilege policy JSON).
"""
import logging
import os
import urllib.parse

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")

# Mirrors identity-service's app/core/storage.py policy — kept as a
# literal constant here (not imported) because a Lambda deployment
# package should stay self-contained and not depend on the app's own
# source tree being packaged alongside it.
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png"}
MAX_SIZE_BYTES = 3 * 1024 * 1024  # 3MB
QUARANTINE_PREFIX = "quarantine/"


def handler(event, context):
    results = []

    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])

        # Only this function's own concern — avoid acting on objects a
        # broader event-notification rule might also deliver.
        if not key.startswith("avatars/"):
            continue

        result = _validate_object(bucket, key)
        results.append(result)

    return {"processed": len(results), "results": results}


def _validate_object(bucket: str, key: str) -> dict:
    head = s3.head_object(Bucket=bucket, Key=key)
    size = head["ContentLength"]
    content_type = head.get("ContentType", "")

    violations = []
    if size > MAX_SIZE_BYTES:
        violations.append(f"size {size} bytes exceeds {MAX_SIZE_BYTES} byte limit")
    if content_type not in ALLOWED_CONTENT_TYPES:
        violations.append(f"content-type '{content_type}' not in {ALLOWED_CONTENT_TYPES}")

    if not violations:
        logger.info("OK: s3://%s/%s (%d bytes, %s)", bucket, key, size, content_type)
        return {"key": key, "status": "ok", "violations": []}

    logger.warning("QUARANTINE: s3://%s/%s — %s", bucket, key, "; ".join(violations))
    _quarantine(bucket, key)
    return {"key": key, "status": "quarantined", "violations": violations}


def _quarantine(bucket: str, key: str) -> None:
    """Moves a policy-violating object out of avatars/ so it's never
    served as someone's avatar, while keeping it around (rather than
    hard-deleting) for the reason to be investigated."""
    quarantine_key = QUARANTINE_PREFIX + key.split("/", 1)[1]
    s3.copy_object(Bucket=bucket, CopySource={"Bucket": bucket, "Key": key}, Key=quarantine_key)
    s3.delete_object(Bucket=bucket, Key=key)
    logger.info("Moved s3://%s/%s -> s3://%s/%s", bucket, key, bucket, quarantine_key)
