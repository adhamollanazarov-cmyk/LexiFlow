from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DEEPL_API_KEY: str
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str
    OPENAI_API_KEY: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @model_validator(mode="after")
    def validate_required_settings(self) -> "Settings":
        missing = [
            name
            for name in (
                "DEEPL_API_KEY",
                "SUPABASE_URL",
                "SUPABASE_SERVICE_ROLE_KEY",
                "SUPABASE_JWT_SECRET",
            )
            if not getattr(self, name).strip()
        ]

        if missing:
            joined = ", ".join(missing)
            raise ValueError(f"Missing required environment variables: {joined}")

        return self


settings = Settings()
