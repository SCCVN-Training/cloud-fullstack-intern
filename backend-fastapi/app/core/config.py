from pydantic_settings import BaseSettings, SettingsConfigDict


class ApplicationSettings(BaseSettings):
    PROJECT_NAME: str = "Otakutory Backend"
    ENVIRONMENT: str = "development"

    # Database Credentials
    NEON_DATABASE_URL: str
    MONGODB_CONNECTION_URI: str
    MONGODB_DATABASE_NAME: str = "auth_audit_logs"

    # Security Configuration
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Load configuration from .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


# Global singleton instance
app_settings = ApplicationSettings()