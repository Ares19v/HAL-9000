import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "HAL 9000 Cognitive System"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # LLM API Keys (Groq is recommended for <150ms time-to-first-token)
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_VOICE_ID: Optional[str] = None  # Custom HAL 9000 voice clone if user has one
    
    # TTS Configuration
    TTS_PROVIDER: str = "edge"  # "edge", "openai", "elevenlabs"
    EDGE_VOICE: str = "en-US-ChristopherNeural"  # Or "en-US-GuyNeural"
    EDGE_RATE: str = "-6%"                       # HAL 9000 speaks at a calm, deliberate, unhurried tempo
    EDGE_PITCH: str = "-8Hz"                     # Soft, low, perfectly measured baritone
    
    # Discovery One Simulation
    MISSION_NAME: str = "Discovery One (Jupiter Mission)"
    CREW_LEADER: str = "Dr. David Bowman"
    MISSION_CLOCK_START: int = 15724800          # Mission Elapsed Time in seconds

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
