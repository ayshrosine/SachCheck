from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # Google AI Studio API (primary model) - DISABLED FOR OFFLINE MODE
    google_ai_studio_api_key: Optional[str] = None  # Set to None to force Ollama
    gemma_model_id: str = "gemma-4-12b-unified"
    
    # Supabase
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    
    # Cloudflare R2
    r2_account_id: Optional[str] = None
    r2_access_key: Optional[str] = None
    r2_secret_key: Optional[str] = None
    r2_bucket: str = "sachcheck-media"
    
    # Ollama (fallback)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "gemma3:4b"  # Use available gemma3:4b model
    
    # Sentry
    sentry_dsn: str = ""
    
    # Environment
    environment: str = "development"
    allowed_origins: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()