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
    project_name: str = "otakutory-anime-service"
    environment: str = "development"
    debug: bool = True
    port: int = 8003

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def is_staging(self) -> bool:
        return self.environment.lower() == "staging"

    # ============ Upstash Redis ============
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL for rate limiting and caching",
    )
    # ============ Feature Flags ============
    enable_anime: bool = True

    # ====================================================================
    # 1. INTERNAL RATE LIMITING (Protect your own endpoints)
    #    Pattern: rate_limit_<module>_<endpoint>_limit
    #            rate_limit_<module>_<endpoint>_window
    # ====================================================================

    # ---------- Anime Module (Future) ----------
    rate_limit_anime_search_limit: int = 30
    rate_limit_anime_search_window: int = 60
    rate_limit_anime_seasonal_limit: int = 10
    rate_limit_anime_seasonal_window: int = 60
    rate_limit_anime_details_limit: int = 60
    rate_limit_anime_details_window: int = 60

    # ====================================================================
    # 2. EXTERNAL API CONFIGURATIONS
    # ====================================================================

    # ---------- AniList (Anime + Manga) ----------
    anilist_graphql_url: str = "https://graphql.anilist.co"
    anilist_rate_limit: int = 90
    anilist_rate_window: int = 60
    anilist_cache_ttl_l1: int = 300
    anilist_cache_ttl_l2: int = 0

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

    def get_external_api_config(self, api_name: str) -> dict[str, any]:
        """
        Get external API configuration.

        Example:
            config = settings.get_external_api_config("anilist")
            # returns {"url": "...", "rate_limit": 90, ...}
        """
        prefix = api_name.lower()
        return {
            "url": getattr(self, f"{prefix}_graphql_url", None)
            or getattr(self, f"{prefix}_base_url", None),
            "rate_limit": getattr(self, f"{prefix}_rate_limit", 0),
            "rate_window": getattr(self, f"{prefix}_rate_window", 60),
            "cache_ttl_l1": getattr(self, f"{prefix}_cache_ttl_l1", 0),
            "cache_ttl_l2": getattr(self, f"{prefix}_cache_ttl_l2", 0),
        }

    def get_cache_ttl(self, api_name: str, tier: str = "L1") -> int:
        """
        Get cache TTL for a specific API and tier.

        Example:
            ttl = settings.get_cache_ttl("anilist", "L1")  # returns 300
        """
        ttl_key = f"{api_name.lower()}_cache_ttl_{tier.lower()}"
        return getattr(self, ttl_key, 0)

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

                response = client.get_secret_value(SecretId="du-otakutory-microservices-secrets")
                aws_secrets = json.loads(response["SecretString"])

                print("✅ Successfully loaded secrets from AWS.")
                return cls(**aws_secrets)

            except ImportError:
                print("⚠️ Boto3 is not installed. Falling back to OS environments...")
            except Exception as e:
                print(
                    f"⚠️ Failed to fetch from AWS: {e}. Falling back to OS environments..."
                )

        return cls()


settings = Settings.load_with_fallback()
