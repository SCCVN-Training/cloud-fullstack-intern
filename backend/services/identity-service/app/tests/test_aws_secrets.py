"""
Verifies load_secrets_into_environment() actually reaches Secrets
Manager and correctly populates os.environ — against moto's mocked
Secrets Manager, not real AWS.
"""
import json
import os

import boto3
import pytest
from moto import mock_aws

from app.core.aws_secrets import load_secrets_into_environment


@pytest.fixture(autouse=True)
def clean_env(monkeypatch):
    # Every test starts from a clean slate for the specific keys this
    # module reads/writes, regardless of what's in the real .env.test.
    for key in ["USE_AWS_SECRETS", "AWS_SECRET_NAME", "AWS_REGION", "DATABASE_URL_FROM_SECRET"]:
        monkeypatch.delenv(key, raising=False)


def test_noop_when_use_aws_secrets_is_unset():
    # Default state for every environment before AWS is configured —
    # must not raise, must not require boto3/network access at all.
    load_secrets_into_environment()  # should simply return


def test_noop_when_use_aws_secrets_is_false(monkeypatch):
    monkeypatch.setenv("USE_AWS_SECRETS", "false")
    load_secrets_into_environment()


def test_raises_clearly_when_secret_name_missing(monkeypatch):
    monkeypatch.setenv("USE_AWS_SECRETS", "true")
    with pytest.raises(RuntimeError, match="AWS_SECRET_NAME"):
        load_secrets_into_environment()


@mock_aws
def test_loads_secret_values_into_environment(monkeypatch):
    monkeypatch.setenv("USE_AWS_SECRETS", "true")
    monkeypatch.setenv("AWS_SECRET_NAME", "skillverse/identity-service")
    monkeypatch.setenv("AWS_REGION", "ap-southeast-1")

    client = boto3.client("secretsmanager", region_name="ap-southeast-1")
    client.create_secret(
        Name="skillverse/identity-service",
        SecretString=json.dumps({
            "DATABASE_URL": "postgresql+asyncpg://user:pw@host/db",
            "SECRET_KEY": "super-secret-from-aws",
        }),
    )

    load_secrets_into_environment()

    assert os.environ["DATABASE_URL"] == "postgresql+asyncpg://user:pw@host/db"
    assert os.environ["SECRET_KEY"] == "super-secret-from-aws"


@mock_aws
def test_secret_values_override_existing_environment(monkeypatch):
    # If enabled, Secrets Manager should win — otherwise there's no
    # point enabling it.
    monkeypatch.setenv("SECRET_KEY", "stale-local-value")
    monkeypatch.setenv("USE_AWS_SECRETS", "true")
    monkeypatch.setenv("AWS_SECRET_NAME", "skillverse/identity-service")

    client = boto3.client("secretsmanager", region_name="ap-southeast-1")
    client.create_secret(
        Name="skillverse/identity-service",
        SecretString=json.dumps({"SECRET_KEY": "fresh-aws-value"}),
    )

    load_secrets_into_environment()

    assert os.environ["SECRET_KEY"] == "fresh-aws-value"


@mock_aws
def test_raises_clearly_when_secret_does_not_exist(monkeypatch):
    monkeypatch.setenv("USE_AWS_SECRETS", "true")
    monkeypatch.setenv("AWS_SECRET_NAME", "does-not-exist")

    with pytest.raises(RuntimeError, match="Failed to fetch secret"):
        load_secrets_into_environment()


@mock_aws
def test_raises_clearly_when_secret_is_not_valid_json(monkeypatch):
    monkeypatch.setenv("USE_AWS_SECRETS", "true")
    monkeypatch.setenv("AWS_SECRET_NAME", "skillverse/broken")

    client = boto3.client("secretsmanager", region_name="ap-southeast-1")
    client.create_secret(Name="skillverse/broken", SecretString="not-json-at-all")

    with pytest.raises(RuntimeError, match="not valid JSON"):
        load_secrets_into_environment()
