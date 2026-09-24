from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "HR-Connect API"
    API_V1_STR: str = "/api/v1"

    COGNITO_USER_POOL_ID: str = ""
    COGNITO_CLIENT_ID: str = ""
    COGNITO_REGION: str = "ap-northeast-1"

    SUPABASE_JWT_SECRET: str = ""

    DATABASE_URL: str = "sqlite+aiosqlite:///./hr_connect.db"
    
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_S3_BUCKET: str = "hrconnect-storage"
    AWS_REGION: str = "ap-northeast-1"
    DYNAMODB_TABLE_NAME: str = "HRConnectTable"
    DYNAMODB_ENDPOINT_URL: str | None = None

    
    # Security: SECRET_KEY should be loaded from environment variables in production.
    # We provide a default for local development convenience but log a warning.
    SECRET_KEY: str = "hrconnect-secure-dev-secret-key-9x$2P!w9a#K9x$2P"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days

    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

    def __init__(self, **data):
        super().__init__(**data)
        if self.SECRET_KEY == "your-secret-key-for-dev":
            import warnings
            warnings.warn(
                "WARNING: You are using the default insecure SECRET_KEY. "
                "Update .env with a strong SECRET_KEY for production.",
                UserWarning
            )

settings = Settings()
