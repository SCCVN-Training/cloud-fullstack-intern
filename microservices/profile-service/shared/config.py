import json
import os

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv(dotenv_path="../.env.shared")

load_dotenv(dotenv_path="../.env.secrets")

load_dotenv(dotenv_path=".env", override=True)


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # ============ Project ============
    project_name: str = "otakutory-profile-service"
    environment: str = "development"
    debug: bool = True
    port: int = 8002

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
        validation_alias="PROFILE_NEON_DATABASE_URL",
    )

    # ============ Upstash Redis ============
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL for rate limiting and caching",
    )

    # ============ Feature Flags ============
    enable_profile: bool = True

    # ====================================================================
    # 1. INTERNAL RATE LIMITING (Protect your own endpoints)
    #    Pattern: rate_limit_<module>_<endpoint>_limit
    #            rate_limit_<module>_<endpoint>_window
    # ====================================================================
    # ---------- Profile Module ----------
    rate_limit_profile_get_limit: int = 60
    rate_limit_profile_get_window: int = 60

    rate_limit_profile_update_limit: int = 30
    rate_limit_profile_update_window: int = 60

    rate_limit_profile_delete_limit: int = 3
    rate_limit_profile_delete_window: int = 60

    rate_limit_profile_create_limit: int = 3
    rate_limit_profile_create_window: int = 60

    rate_limit_profile_avatar_limit: int = 10
    rate_limit_profile_avatar_window: int = 60

    rate_limit_profile_banner_limit: int = 5
    rate_limit_profile_banner_window: int = 60

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
        """
        Get rate limit and window for a specific module endpoint.

        Example:
            limit, window = settings.get_rate_limit("auth", "login")
            # returns (5, 60)
        """
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

                normalized_secrets = {k.lower(): v for k, v in aws_secrets.items()}

                print("✅ Successfully loaded secrets from AWS.")
                return cls(**normalized_secrets)

            except ImportError:
                print("⚠️ Boto3 is not installed. Falling back to OS environments...")
            except Exception as e:
                print(
                    f"⚠️ Failed to fetch from AWS: {e}. Falling back to OS environments..."
                )

        return cls()


settings = Settings.load_with_fallback()
