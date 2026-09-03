import os
import uuid

from fastapi import UploadFile

from app.core.config import settings

ALLOWED_AVATAR_CONTENT_TYPES = {"image/jpeg", "image/png"}
MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024  # 3MB — matches the frontend's limit

# How long a presigned S3 URL stays valid before the browser needs a
# fresh one. Short enough that a leaked URL (browser history, a shared
# screenshot) stops working soon; long enough that a page load doesn't
# race against expiry. Profile.avatar_url is re-resolved into a fresh
# presigned URL on every read (see get_avatar_url) — nothing caches
# this value long-term, so shortening it later is a one-line change.
PRESIGNED_URL_EXPIRY_SECONDS = 3600


async def save_avatar(user_id: uuid.UUID, file: UploadFile) -> str:
    """
    Saves an uploaded avatar and returns the value to store on
    Profile.avatar_url. What that value actually IS depends on
    STORAGE_BACKEND:
      - "local": a full URL, ready to use directly in an <img src>
      - "s3":    a bare object key (e.g. "avatars/xyz.jpg") — the
                 bucket is private, so this is NOT a usable URL by
                 itself; callers must resolve it via get_avatar_url()
                 to get a working (temporary, presigned) URL.
    Swappable by design: every caller already goes through save_avatar()
    and get_avatar_url() rather than touching a URL/path directly, so
    this file is the only one that needed to change for this migration.
    """
    if file.content_type not in ALLOWED_AVATAR_CONTENT_TYPES:
        raise ValueError("Only .jpg and .png images are allowed")

    contents = await file.read()
    if len(contents) > MAX_AVATAR_SIZE_BYTES:
        raise ValueError("Image must be under 3MB")

    extension = "jpg" if file.content_type == "image/jpeg" else "png"
    filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{extension}"

    if settings.STORAGE_BACKEND == "s3":
        return _save_to_s3(filename, contents, file.content_type)
    return _save_to_local_disk(filename, contents)


def get_avatar_url(stored_value: str | None) -> str | None:
    """
    Resolves whatever is stored in Profile.avatar_url into something a
    browser can actually load. For STORAGE_BACKEND="local" (or any
    already-absolute URL, e.g. from before a backend switch), the stored
    value already IS the URL — returned unchanged. For "s3", the stored
    value is a bare object key, and this generates a fresh presigned URL
    for it — the bucket is private (block-all-public-access, per the
    Week 6 guide), so there is no other way to reach the object from a
    browser.

    Called every place Profile.avatar_url is exposed in an API response
    (ProfileResponse, PublicProfileResponse) — never store a presigned
    URL itself, since it would silently stop working after
    PRESIGNED_URL_EXPIRY_SECONDS.
    """
    if not stored_value:
        return stored_value

    if settings.STORAGE_BACKEND != "s3" or stored_value.startswith("http"):
        return stored_value

    import boto3
    from botocore.client import Config

    # Explicit SigV4 — boto3's default can fall back to legacy SigV2
    # presigned URLs depending on region/config, and some AWS regions
    # only accept SigV4. Pinning this avoids a presigned URL that works
    # in dev but silently breaks after a region change.
    client = boto3.client(
        "s3", region_name=settings.S3_REGION, config=Config(signature_version="s3v4")
    )
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": stored_value},
        ExpiresIn=PRESIGNED_URL_EXPIRY_SECONDS,
    )


def _save_to_local_disk(filename: str, contents: bytes) -> str:
    avatar_dir = os.path.join(settings.MEDIA_ROOT, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)

    file_path = os.path.join(avatar_dir, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    return f"{settings.MEDIA_URL_BASE}/avatars/{filename}"


def _save_to_s3(filename: str, contents: bytes, content_type: str) -> str:
    import boto3
    from botocore.client import Config

    if not settings.S3_BUCKET_NAME:
        raise RuntimeError(
            "STORAGE_BACKEND=s3 but S3_BUCKET_NAME is not set — check .env"
        )

    client = boto3.client(
        "s3", region_name=settings.S3_REGION, config=Config(signature_version="s3v4")
    )
    key = f"avatars/{filename}"

    client.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=contents,
        ContentType=content_type,
        # Deliberately no ACL="public-read" — the bucket blocks all
        # public access (see the guide's bucket setup). Access is only
        # ever through the presigned URL in get_avatar_url(), which is
        # both time-limited and requires knowing the exact object key.
    )
    return key
