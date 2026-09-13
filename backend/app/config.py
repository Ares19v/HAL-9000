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
    CARTESIA_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None
    ELEVENLABS_VOICE_ID: Optional[str] = None  # Custom HAL 9000 voice clone if user has one
    
    # TTS Configuration (Kokoro Local StyleTTS2 / Edge-TTS / Cartesia / ElevenLabs)
    TTS_PROVIDER: str = "kokoro"                 # "kokoro", "cartesia", "edge", "openai", "elevenlabs"
    KOKORO_MODEL_PATH: str = "models/kokoro-v1.0.onnx"
    KOKORO_VOICES_PATH: str = "models/voices-v1.0.bin"
    KOKORO_VOICE: str = "bm_george"              # Authentic Douglas Rain measured timbre
    KOKORO_SPEED: float = 0.95                   # Calm, measured cadence
    EDGE_VOICE: str = "en-US-ChristopherNeural"  # Fallback Douglas Rain measured timbre
    EDGE_RATE: str = "-4%"                       # Calm, deliberate conversational cadence
    EDGE_PITCH: str = "-2Hz"                     # Natural studio resonance
    
    # Local Ollama Support (Zero-key offline inference)
    OLLAMA_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2:latest"

    # Discovery One Simulation
    MISSION_NAME: str = "Discovery One (Jupiter Mission)"
    CREW_LEADER: str = "Commander Dev"
    MISSION_CLOCK_START: int = 15724800          # Mission Elapsed Time in seconds

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
