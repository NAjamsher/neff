from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "NEFF"
    DEBUG: bool = True
    VERSION: str = "1.0.0"

    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "neff_db"

    JWT_SECRET_KEY: str = "change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    HF_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()