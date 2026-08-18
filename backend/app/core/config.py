from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    TRAINING_API_KEY: str = "demo-key-123"

    # Local file storage — pre-S3 stand-in for avatar uploads (see
    # profiles/router.py). MEDIA_URL_BASE is what's prefixed onto the
    # stored relative path when building the URL returned to clients;
    # override in .env once this moves behind a real domain/CDN.
    MEDIA_ROOT: str = "media"
    MEDIA_URL_BASE: str = "http://localhost:8000/media"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()