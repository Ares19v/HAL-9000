"""
HAL 9000 Real-Time Speech-to-Text Service
Powered by Groq Whisper (whisper-large-v3-turbo)
Latency: ~120-180ms with human-level accuracy
"""
import io
import time
import logging
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

class STTService:
    def __init__(self):
        self.endpoint = "https://api.groq.com/openai/v1/audio/transcriptions"
        self.model = "whisper-large-v3-turbo"

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        file_format: str = "webm",
        api_key: Optional[str] = None
    ) -> str:
        """
        Transcribe raw audio bytes using Groq Whisper.
        Accepts webm, wav, mp3, ogg, or m4a audio formats.
        """
        key = api_key or settings.GROQ_API_KEY
        if not key:
            logger.warning("[STT] No Groq API key available for Whisper transcription.")
            return ""

        if not audio_bytes or len(audio_bytes) < 100:
            return ""

        filename = f"speech.{file_format}"
        mime_type = f"audio/{file_format}"
        if file_format == "webm":
            mime_type = "audio/webm;codecs=opus"

        headers = {
            "Authorization": f"Bearer {key}"
        }
        files = {
            "file": (filename, audio_bytes, mime_type)
        }
        data = {
            "model": self.model,
            "language": "en",
            "temperature": "0.0"
        }

        t0 = time.time()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    data=data,
                    files=files
                )
                if response.status_code == 200:
                    result = response.json()
                    raw_text = result.get("text", "").strip()
                    elapsed = (time.time() - t0) * 1000
                    logger.info(f"[Groq Whisper] Transcribed in {elapsed:.1f}ms: '{raw_text}'")
                    return raw_text
                else:
                    logger.error(f"[Groq Whisper] HTTP {response.status_code}: {response.text}")
                    return ""
        except Exception as e:
            logger.error(f"[Groq Whisper] Exception: {e}")
            return ""

stt_service = STTService()
