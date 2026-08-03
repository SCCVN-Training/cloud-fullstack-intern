from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr, PostgresDsn


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

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )


settings = Settings()
