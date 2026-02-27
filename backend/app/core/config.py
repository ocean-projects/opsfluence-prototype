from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Core
    ENV: str = "dev"

    # Database
    DATABASE_URL: str

    # AWS Cognito
    COGNITO_REGION: str
    COGNITO_USER_POOL_ID: str
    COGNITO_APP_CLIENT_ID: str

    # CORS (comma-separated)
    CORS_ORIGINS: str = "http://localhost:3000"

    # Optional seed helper
    SEED_ADMIN_COGNITO_SUB: str | None = None

    class Config:
        env_file = ".env"


settings = Settings()
