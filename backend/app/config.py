from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Google AI Studio API
    google_ai_studio_api_key: str
    gemma_model_id: str = "gemma-4-12b-unified"
    
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    
    # Cloudflare R2
    r2_account_id: str
    r2_access_key: str
    r2_secret_key: str
    r2_bucket: str = "sachcheck-media"
    
    # Ollama (fallback)
    ollama_base_url: str = "http://localhost:11434"
    
    # Sentry
    sentry_dsn: str = ""
    
    # Environment
    environment: str = "development"
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()