import json
import os

from dotenv import load_dotenv
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load shared first
load_dotenv(dotenv_path="../.env.shared")

# Load secrets
load_dotenv(dotenv_path="../.env.secrets")

# Load specific env
load_dotenv(dotenv_path=".env", override=True)


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # ============ Project ============
    project_name: str = "otakutory-auth-service"
    environment: str = "development"
    debug: bool = True
    port: int = 8001

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def is_staging(self) -> bool:
        return self.environment.lower() == "staging"

    # ============ Neon PostgreSQL ============
    neon_database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/main",
        description="PostgreSQL connection string with asyncpg driver",
        validation_alias="AUTH_NEON_DATABASE_URL",
    )

    # ============ MongoDB ============
    mongodb_connection_uri: str = Field(
        default="mongodb://admin:admin@localhost:27017",
        description="MongoDB connection URI",
    )
    mongodb_database_name: str = "logs"
    mongodb_cache_database_name: str = "cache"
    mongodb_cache_collection_name: str = "cache_entries"

    # ============ Upstash Redis ============
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL for rate limiting and caching",
    )

    # ============ Security ============
    jwt_secret_key: SecretStr = Field(
        ...,
        min_length=32,
        description="JWT secret key (must be at least 32 characters)",
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ============ Feature Flags ============
    enable_auth: bool = True

    # ====================================================================
    # 1. INTERNAL RATE LIMITING (Protect your own endpoints)
    # ====================================================================

    # ---------- Auth Module ----------
    rate_limit_auth_login_limit: int = 5
    rate_limit_auth_login_window: int = 60
    rate_limit_auth_login_ip_limit: int = 20
    rate_limit_auth_login_ip_window: int = 60

    rate_limit_auth_register_limit: int = 3
    rate_limit_auth_register_window: int = 60

    rate_limit_auth_password_reset_limit: int = 3
    rate_limit_auth_password_reset_window: int = 3600

    rate_limit_auth_refresh_limit: int = 10
    rate_limit_auth_refresh_window: int = 60

    # ====================================================================
    # 3. INFRASTRUCTURE / PERFORMANCE
    # ====================================================================
    dedup_window_ms: int = 100
    cache_prefix_rate_limit: str = "rate_limit"
    cache_prefix_l1: str = "l1"
    cache_prefix_l2: str = "l2"
    cache_prefix_dedup: str = "dedup"

    # In Settings class
    ssl_verify: bool = Field(True, description="Enable SSL certificate verification")

    # ====================================================================
    # 5. HELPER METHODS
    # ====================================================================

    def get_rate_limit(self, module: str, endpoint: str) -> tuple[int, int]:
        limit_key = f"rate_limit_{module}_{endpoint}_limit"
        window_key = f"rate_limit_{module}_{endpoint}_window"

        limit = getattr(self, limit_key, 5)
        window = getattr(self, window_key, 60)

        return limit, window

    model_config = SettingsConfigDict(
        # env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow",
    )

    # ====================================================================
    # 6. AWS SECRETS MANAGER FALLBACK
    # ====================================================================
    @classmethod
    def load_with_fallback(cls) -> "Settings":
        current_env = os.getenv("ENVIRONMENT", "development").lower()

        if current_env in ["production", "staging"]:
            try:
                import boto3

                print("🔄 Fetching secrets from AWS Secrets Manager...")
                client = boto3.client("secretsmanager", region_name="ap-southeast-1")

                response = client.get_secret_value(
                    SecretId="du-otakutory-microservices-secrets"
                )
                aws_secrets = json.loads(response["SecretString"])

                # Inject AWS secrets directly into the OS environment variables
                # This allows Pydantic to naturally parse aliases and handle case insensitivity
                for key, value in aws_secrets.items():
                    os.environ[key] = str(value)

                print("✅ Successfully loaded secrets from AWS and injected to OS.")

                # Let Pydantic initialize normally by reading from the newly populated os.environ
                return cls()

            except ImportError:
                print("⚠️ Boto3 is not installed. Falling back to OS environments...")
            except Exception as e:
                print(
                    f"⚠️ Failed to fetch from AWS: {e}. Falling back to OS environments..."
                )

        return cls()

settings = Settings.load_with_fallback()
