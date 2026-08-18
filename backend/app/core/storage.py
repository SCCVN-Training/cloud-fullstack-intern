import os
import uuid

from fastapi import UploadFile

from app.core.config import settings

ALLOWED_AVATAR_CONTENT_TYPES = {"image/jpeg", "image/png"}
MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024  # 3MB — matches the frontend's limit


async def save_avatar(user_id: uuid.UUID, file: UploadFile) -> str:
    """
    Saves an uploaded avatar to local disk and returns the URL to store on
    Profile.avatar_url. Kept deliberately small and swappable — when this
    moves to S3, only this function needs to change (upload to a bucket,
    return the S3 URL) — everything calling it stays the same.
    """
    if file.content_type not in ALLOWED_AVATAR_CONTENT_TYPES:
        raise ValueError("Only .jpg and .png images are allowed")

    contents = await file.read()
    if len(contents) > MAX_AVATAR_SIZE_BYTES:
        raise ValueError("Image must be under 3MB")

    extension = "jpg" if file.content_type == "image/jpeg" else "png"
    filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{extension}"

    avatar_dir = os.path.join(settings.MEDIA_ROOT, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)

    file_path = os.path.join(avatar_dir, filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Short, well under Profile.avatar_url's 255-char limit — unlike a
    # base64 data URL, which would be tens of thousands of characters.
    return f"{settings.MEDIA_URL_BASE}/avatars/{filename}"
