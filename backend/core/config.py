from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    app_name: str = "TasteFlix API"
    app_env: str = "development"
    debug: bool = True
    database_url: str = f"sqlite:///{BASE_DIR / 'tasteflix.db'}"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    frontend_url: str = "http://localhost:3000"
    metadata_csv_path: str = str(BASE_DIR / "data" / "movielens_enriched.csv")
    model_artifact_path: str = str(BASE_DIR / "ml" / "artifacts" / "hybrid_recommender.pkl")
    tmdb_api_key: str | None = None
    tmdb_base_url: str = "https://api.themoviedb.org/3"
    tmdb_image_base_url: str = "https://image.tmdb.org/t/p/w500"
    youtube_api_key: str | None = None
    youtube_base_url: str = "https://www.googleapis.com/youtube/v3"
    unsplash_access_key: str | None = None
    unsplash_secret_key: str | None = None
    unsplash_base_url: str = "https://api.unsplash.com"

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str) and value.lower() in {"release", "production", "prod"}:
            return False
        return value

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=("settings_",),
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
