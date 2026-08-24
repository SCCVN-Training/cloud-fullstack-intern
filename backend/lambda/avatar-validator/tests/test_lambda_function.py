"""
Simulates real S3 ObjectCreated events (the same shape S3 actually
sends) against moto's mocked S3 — verifies the Lambda handler's logic
end-to-end without needing a real AWS account or a real Lambda deploy.
"""
import boto3
import pytest
from moto import mock_aws

import lambda_function as fn

BUCKET = "skillverse-test-avatars"


def _s3_event(key: str) -> dict:
    """Shape matches what S3 actually sends to a Lambda on
    ObjectCreated — see AWS's S3 event notification structure docs."""
    return {
        "Records": [
            {
                "eventName": "ObjectCreated:Put",
                "s3": {
                    "bucket": {"name": BUCKET},
                    "object": {"key": key},
                },
            }
        ]
    }


@pytest.fixture
def bucket():
    with mock_aws():
        client = boto3.client("s3", region_name="ap-southeast-1")
        client.create_bucket(
            Bucket=BUCKET,
            CreateBucketConfiguration={"LocationConstraint": "ap-southeast-1"},
        )
        yield client


def test_valid_avatar_passes_untouched(bucket, monkeypatch):
    monkeypatch.setattr(fn, "s3", bucket)
    bucket.put_object(Bucket=BUCKET, Key="avatars/user1.png", Body=b"x" * 1000, ContentType="image/png")

    result = fn.handler(_s3_event("avatars/user1.png"), None)

    assert result["results"][0]["status"] == "ok"
    listing = bucket.list_objects_v2(Bucket=BUCKET, Prefix="avatars/")
    assert listing["KeyCount"] == 1


def test_oversized_avatar_gets_quarantined(bucket, monkeypatch):
    monkeypatch.setattr(fn, "s3", bucket)
    oversized = b"x" * (4 * 1024 * 1024)
    bucket.put_object(Bucket=BUCKET, Key="avatars/user2.png", Body=oversized, ContentType="image/png")

    result = fn.handler(_s3_event("avatars/user2.png"), None)

    assert result["results"][0]["status"] == "quarantined"
    assert "exceeds" in result["results"][0]["violations"][0]

    avatars_listing = bucket.list_objects_v2(Bucket=BUCKET, Prefix="avatars/")
    assert avatars_listing["KeyCount"] == 0
    quarantine_listing = bucket.list_objects_v2(Bucket=BUCKET, Prefix="quarantine/")
    assert quarantine_listing["KeyCount"] == 1
    assert quarantine_listing["Contents"][0]["Key"] == "quarantine/user2.png"


def test_wrong_content_type_gets_quarantined(bucket, monkeypatch):
    monkeypatch.setattr(fn, "s3", bucket)
    bucket.put_object(
        Bucket=BUCKET, Key="avatars/user3.exe", Body=b"not-an-image", ContentType="application/octet-stream"
    )

    result = fn.handler(_s3_event("avatars/user3.exe"), None)

    assert result["results"][0]["status"] == "quarantined"
    assert "content-type" in result["results"][0]["violations"][0]


def test_ignores_objects_outside_avatars_prefix(bucket, monkeypatch):
    monkeypatch.setattr(fn, "s3", bucket)
    bucket.put_object(Bucket=BUCKET, Key="other/unrelated.txt", Body=b"hello")

    result = fn.handler(_s3_event("other/unrelated.txt"), None)

    assert result["processed"] == 0


def test_quarantined_object_bytes_are_preserved(bucket, monkeypatch):
    monkeypatch.setattr(fn, "s3", bucket)
    oversized = b"y" * (4 * 1024 * 1024)
    bucket.put_object(Bucket=BUCKET, Key="avatars/user4.png", Body=oversized, ContentType="image/png")

    fn.handler(_s3_event("avatars/user4.png"), None)

    obj = bucket.get_object(Bucket=BUCKET, Key="quarantine/user4.png")
    assert obj["Body"].read() == oversized
