from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str

    # Must match identity-service's SECRET_KEY exactly — both services
    # verify the same JWT independently (stateless auth), so a mismatch
    # here means every request from this service looks unauthenticated.
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    TRAINING_API_KEY: str = "demo-key-123"

    # Base URL this service uses to reach identity-service for the one
    # synchronous cross-service call it needs (public instructor/user
    # display info — see app/clients/identity_client.py).
    IDENTITY_SERVICE_URL: str = "http://localhost:8001"

    # Read directly via os.environ in aws_secrets.py (must run before
    # this class is instantiated) — declared here too for visibility.
    USE_AWS_SECRETS: bool = False
    AWS_SECRET_NAME: str = ""
    AWS_REGION: str = "ap-southeast-1"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
