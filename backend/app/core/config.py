from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os
import tempfile

class Settings(BaseSettings):
    APP_NAME: str = "SPECTRA"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    APP_ENV: str = "development"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    UPLOAD_MAX_MB: int = 25
    TEMP_DATA_DIR: str = os.path.join(tempfile.gettempdir(), "spectra_cache")
    SAMPLES_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "samples"))
    
    # Adaption Labs integration
    ADAPTION_API_KEY: str = ""
    ADAPTION_MODEL: str = "Qwen/Qwen3.5-9B"
    ADAPTION_DATASET_ID: str = ""
    ADAPTION_TIMEOUT_SECONDS: int = 25

    model_config = SettingsConfigDict(
        env_file=[os.path.join(os.path.dirname(__file__), "..", "..", ".env"), ".env"],
        extra="ignore"
    )

settings = Settings()
os.makedirs(settings.TEMP_DATA_DIR, exist_ok=True)
