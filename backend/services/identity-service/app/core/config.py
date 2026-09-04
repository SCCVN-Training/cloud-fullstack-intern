from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # CORS allowed frontend origins.
    # Comma-separated so it can be configured easily through .env
    # or Kubernetes Secrets.
    #ALLOWED_ORIGINS: str = "http://localhost:4200,http://127.0.0.1:4200"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    TRAINING_API_KEY: str = "demo-key-123"

    # Local file storage — pre-S3 stand-in for avatar uploads (see
    # profiles/router.py). MEDIA_URL_BASE is what's prefixed onto the
    # stored relative path when building the URL returned to clients;
    # override in .env once this moves behind a real domain/CDN.
    MEDIA_ROOT: str = "media"
    MEDIA_URL_BASE: str = "http://localhost:8001/media"

    # Avatar storage backend: "local" (disk, default — matches every
    # environment before AWS was introduced) or "s3" (see
    # app/core/storage.py). Switching this one value is the entire
    # migration — no caller of save_avatar()/get_avatar_url() changes.
    STORAGE_BACKEND: str = "local"
    S3_BUCKET_NAME: str = ""
    S3_REGION: str = "ap-southeast-1"

    # Read directly via os.environ in aws_secrets.py (it must run before
    # this class is ever instantiated) — declared here too only so
    # they're visible/typed if other code wants to reference them.
    USE_AWS_SECRETS: bool = False
    AWS_SECRET_NAME: str = ""
    AWS_REGION: str = "ap-southeast-1"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()