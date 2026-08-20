from typing import Optional, Dict, Tuple
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # ============ Project ============
    project_name: str = "backend-v2"
    environment: str = "development"
    debug: bool = True
    port: int = 8000

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
        description="PostgreSQL connection string with asyncpg driver"
    )

    # ============ MongoDB ============
    mongodb_connection_uri: str = Field(
        default="mongodb://admin:admin@localhost:27017",
        description="MongoDB connection URI"
    )
    mongodb_database_name: str = "logs"
    mongodb_cache_database_name: str = "cache"
    mongodb_cache_collection_name: str = "cache_entries"

    # ============ Upstash Redis ============
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL for rate limiting and caching"
    )

    # ============ Security ============
    jwt_secret_key: SecretStr = Field(
        ...,
        min_length=32,
        description="JWT secret key (must be at least 32 characters)"
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # ============ Feature Flags ============
    enable_auth: bool = True
    enable_profile: bool = True
    enable_anime: bool = False
    enable_manga: bool = False
    enable_music: bool = False
    enable_news: bool = False

    # ====================================================================
    # 1. INTERNAL RATE LIMITING (Protect your own endpoints)
    #    Pattern: rate_limit_<module>_<endpoint>_limit
    #            rate_limit_<module>_<endpoint>_window
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

    # ---------- Anime Module (Future) ----------
    rate_limit_anime_search_limit: int = 30
    rate_limit_anime_search_window: int = 60
    rate_limit_anime_seasonal_limit: int = 10
    rate_limit_anime_seasonal_window: int = 60
    rate_limit_anime_details_limit: int = 60
    rate_limit_anime_details_window: int = 60

    # ---------- Manga Module (Future) ----------
    rate_limit_manga_search_limit: int = 30
    rate_limit_manga_search_window: int = 60
    rate_limit_manga_details_limit: int = 60
    rate_limit_manga_details_window: int = 60

    # ---------- Music Module (Future) ----------
    rate_limit_music_search_limit: int = 20
    rate_limit_music_search_window: int = 60
    rate_limit_music_preview_limit: int = 50
    rate_limit_music_preview_window: int = 60

    # ---------- News Module (Future) ----------
    rate_limit_news_latest_limit: int = 30
    rate_limit_news_latest_window: int = 60
    rate_limit_news_encyclopedia_limit: int = 20
    rate_limit_news_encyclopedia_window: int = 60

    # ====================================================================
    # 2. EXTERNAL API CONFIGURATIONS
    # ====================================================================

    # ---------- AniList (Anime + Manga) ----------
    anilist_graphql_url: str = "https://graphql.anilist.co"
    anilist_rate_limit: int = 90
    anilist_rate_window: int = 60
    anilist_cache_ttl_l1: int = 300
    anilist_cache_ttl_l2: int = 0

    # ---------- Deezer (Music) ----------
    deezer_base_url: str = "https://api.deezer.com"
    deezer_rate_limit: int = 50
    deezer_rate_window: int = 5
    deezer_cache_ttl_l1: int = 300
    deezer_cache_ttl_l2: int = 0

    # ---------- ANN (News) ----------
    ann_base_url: str = "https://cdn.animenewsnetwork.com/encyclopedia/api.xml"
    ann_rate_limit: int = 0
    ann_rate_window: int = 1
    ann_cache_ttl_l1: int = 21600
    ann_cache_ttl_l2: int = 604800

    # ====================================================================
    # 3. INFRASTRUCTURE / PERFORMANCE
    # ====================================================================
    dedup_window_ms: int = 100
    cache_prefix_rate_limit: str = "rate_limit"
    cache_prefix_l1: str = "l1"
    cache_prefix_l2: str = "l2"
    cache_prefix_dedup: str = "dedup"

    # ====================================================================
    # 4. FUTURE MICROSERVICES (commented out in .env)
    # ====================================================================
    service_auth_url: Optional[str] = None
    service_profile_url: Optional[str] = None
    service_anime_url: Optional[str] = None
    service_manga_url: Optional[str] = None
    service_music_url: Optional[str] = None
    service_news_url: Optional[str] = None
    service_logging_url: Optional[str] = None
    service_api_gateway_url: Optional[str] = None


    # In Settings class
    ssl_verify: bool = Field(True, description="Enable SSL certificate verification")

    # ====================================================================
    # 5. HELPER METHODS
    # ====================================================================

    def get_rate_limit(self, module: str, endpoint: str) -> Tuple[int, int]:
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

    def get_external_api_config(self, api_name: str) -> Dict[str, any]:
        """
        Get external API configuration.

        Example:
            config = settings.get_external_api_config("anilist")
            # returns {"url": "...", "rate_limit": 90, ...}
        """
        prefix = api_name.lower()
        return {
            "url": getattr(self, f"{prefix}_graphql_url", None) or getattr(self, f"{prefix}_base_url", None),
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
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )


settings = Settings()
