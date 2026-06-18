import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # JWT
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "CHANGE_ME_IN_PRODUCTION_USE_A_LONG_RANDOM_STRING")
    ALGORITHM: str = "HS256"
    TUTOR_TOKEN_EXPIRE_HOURS: int = 12
    PARENT_TOKEN_EXPIRE_HOURS: int = 24

    # Database
    DATABASE_URL: str = "sqlite:///./tutor.db"
    DB_PATH: str = "./tutor.db"

    # App
    APP_NAME: str = "WebKhata"
    PORT: int = 6540
    DEBUG: bool = os.environ.get("DEBUG", "false").lower() == "true"

    # Default tutor credentials (only used on first run)
    DEFAULT_TUTOR_USERNAME: str = "admin"
    DEFAULT_TUTOR_PASSWORD: str = "changeme"
    
    # External APIs
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
