import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # LLM Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4")
    
    # OpenAI-Compatible API Configuration
    LLM_API_TYPE = os.getenv("LLM_API_TYPE", "openai")  # "openai", "anthropic", or "openai-compatible"
    LLM_API_BASE_URL = os.getenv("LLM_API_BASE_URL", "https://api.openai.com/v1")
    LLM_API_KEY = os.getenv("LLM_API_KEY", os.getenv("OPENAI_API_KEY"))  # Falls back to OPENAI_API_KEY
    
    # Service Configuration
    PORT = int(os.getenv("PORT", 8001))
    HOST = os.getenv("HOST", "0.0.0.0")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    
    # CORS Settings
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # LangGraph Configuration
    TEMPERATURE = 0  # For consistent parsing
    MAX_RETRIES = 3
    
    @classmethod
    def validate(cls):
        """Validate required configuration"""
        if cls.LLM_API_TYPE == "openai-compatible":
            if not cls.LLM_API_KEY:
                raise ValueError("LLM_API_KEY must be set for OpenAI-compatible APIs")
            if not cls.LLM_API_BASE_URL:
                raise ValueError("LLM_API_BASE_URL must be set for OpenAI-compatible APIs")
        elif cls.LLM_API_TYPE == "openai":
            if not cls.OPENAI_API_KEY:
                raise ValueError("OPENAI_API_KEY must be set")
        elif cls.LLM_API_TYPE == "anthropic":
            if not cls.ANTHROPIC_API_KEY:
                raise ValueError("ANTHROPIC_API_KEY must be set")
        else:
            raise ValueError(f"Invalid LLM_API_TYPE: {cls.LLM_API_TYPE}")
        
        return True

config = Config()
