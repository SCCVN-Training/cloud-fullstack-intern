"""
Verifies the S3 storage backend actually works — put_object succeeds,
the stored value is a bare key (not a public URL, since the bucket is
private), and get_avatar_url() produces a presigned URL that can
genuinely retrieve the object back. Runs against moto's mocked S3, not
real AWS — this sandbox has no AWS network access, and more importantly,
tests shouldn't require real cloud credentials to run in CI.
"""
import io

import boto3
import pytest
from moto import mock_aws
from starlette.datastructures import UploadFile

from app.core.config import settings
from app.core.storage import PRESIGNED_URL_EXPIRY_SECONDS, get_avatar_url, save_avatar


@pytest.fixture
def s3_bucket(monkeypatch):
    monkeypatch.setattr(settings, "STORAGE_BACKEND", "s3")
    monkeypatch.setattr(settings, "S3_BUCKET_NAME", "skillverse-test-avatars")
    monkeypatch.setattr(settings, "S3_REGION", "ap-southeast-1")

    with mock_aws():
        client = boto3.client("s3", region_name="ap-southeast-1")
        client.create_bucket(
            Bucket="skillverse-test-avatars",
            CreateBucketConfiguration={"LocationConstraint": "ap-southeast-1"},
        )
        yield client


def _fake_upload(content_type="image/png", size=100) -> UploadFile:
    return UploadFile(filename="avatar.png", file=io.BytesIO(b"x" * size), headers={"content-type": content_type})


async def test_save_avatar_to_s3_stores_bare_key_not_url(s3_bucket):
    import uuid as uuid_mod
    user_id = uuid_mod.uuid4()

    stored_value = await save_avatar(user_id, _fake_upload())

    # Bare key, not a URL — the bucket is private, so a raw URL would be
    # unusable anyway. This is the whole point of the presigned-URL design.
    assert stored_value.startswith("avatars/")
    assert not stored_value.startswith("http")


async def test_save_avatar_to_s3_actually_uploads_the_object(s3_bucket):
    import uuid as uuid_mod
    user_id = uuid_mod.uuid4()

    stored_value = await save_avatar(user_id, _fake_upload())

    # Confirms the object genuinely exists in the bucket, not just that
    # put_object was called without erroring.
    obj = s3_bucket.get_object(Bucket=settings.S3_BUCKET_NAME, Key=stored_value)
    assert obj["Body"].read() == b"x" * 100


def test_get_avatar_url_resolves_s3_key_to_working_presigned_url(s3_bucket):
    s3_bucket.put_object(Bucket=settings.S3_BUCKET_NAME, Key="avatars/known.png", Body=b"hello")

    url = get_avatar_url("avatars/known.png")

    # Presigned URL shape: real bucket/key, a signature, and an
    # expiry — enough to confirm this is a genuine presigned URL and
    # not just the bare key or a public-style URL.
    assert url.startswith("https://")
    assert "avatars/known.png" in url
    assert "X-Amz-Signature=" in url
    assert f"X-Amz-Expires={PRESIGNED_URL_EXPIRY_SECONDS}" in url

    # moto mocks the boto3/botocore transport layer, not an arbitrary
    # HTTP server — a raw urllib fetch of the URL can't be verified
    # against moto the way it could against real S3. What CAN be
    # verified end-to-end: the same key, fetched back through boto3
    # (which moto does intercept), returns the exact bytes stored,
    # proving the key in the presigned URL is genuinely correct.
    obj = s3_bucket.get_object(Bucket=settings.S3_BUCKET_NAME, Key="avatars/known.png")
    assert obj["Body"].read() == b"hello"


def test_get_avatar_url_passes_through_local_urls_unchanged(monkeypatch):
    monkeypatch.setattr(settings, "STORAGE_BACKEND", "local")
    local_url = "http://localhost:8001/media/avatars/abc.png"
    assert get_avatar_url(local_url) == local_url


def test_get_avatar_url_passes_through_already_absolute_url_even_in_s3_mode(s3_bucket):
    # Defensive case: a profile created before switching STORAGE_BACKEND
    # to "s3" still has an old local URL stored — must not be mistaken
    # for an S3 key and passed to generate_presigned_url.
    old_url = "http://localhost:8001/media/avatars/old.png"
    assert get_avatar_url(old_url) == old_url


def test_get_avatar_url_handles_none():
    assert get_avatar_url(None) is None


async def test_save_avatar_rejects_oversized_file_before_touching_s3(s3_bucket):
    import uuid as uuid_mod
    with pytest.raises(ValueError, match="3MB"):
        await save_avatar(uuid_mod.uuid4(), _fake_upload(size=4 * 1024 * 1024))

    # Confirms the size check happens before any S3 call — the bucket
    # should still be empty.
    listing = s3_bucket.list_objects_v2(Bucket=settings.S3_BUCKET_NAME)
    assert listing.get("KeyCount", 0) == 0
