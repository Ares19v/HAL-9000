"""
HAL 9000 Low-Latency Streaming Text-to-Speech Service
Supports:
1. Microsoft Neural TTS via edge-tts (Free, zero-setup, calibrated Douglas Rain timbre)
2. OpenAI Audio Speech API (tts-1 onyx/alloy)
3. ElevenLabs Low-Latency Streaming API
"""
import asyncio
import base64
import logging
from typing import AsyncGenerator, Optional
import edge_tts
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

class TTSService:
    def __init__(self):
        self.provider = settings.TTS_PROVIDER
        self.edge_voice = settings.EDGE_VOICE
        self.edge_rate = settings.EDGE_RATE
        self.edge_pitch = settings.EDGE_PITCH

    async def stream_audio_chunks(self, text: str, voice_override: Optional[str] = None) -> AsyncGenerator[bytes, None]:
        """
        Stream raw audio chunks (mp3) for a given text snippet.
        Pipelined at sentence level for zero perceived latency.
        """
        clean_text = text.strip()
        if not clean_text:
            return

        # 1. ElevenLabs Streaming if configured
        if settings.ELEVENLABS_API_KEY and settings.ELEVENLABS_VOICE_ID and self.provider == "elevenlabs":
            try:
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}/stream"
                headers = {
                    "xi-api-key": settings.ELEVENLABS_API_KEY,
                    "Content-Type": "application/json"
                }
                payload = {
                    "text": clean_text,
                    "model_id": "eleven_turbo_v2_5",
                    "voice_settings": {
                        "stability": 0.85,
                        "similarity_boost": 0.90,
                        "style": 0.05
                    }
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    async with client.stream("POST", url, headers=headers, json=payload) as response:
                        if response.status_code == 200:
                            async for chunk in response.aiter_bytes():
                                if chunk:
                                    yield chunk
                            return
                        else:
                            logger.warning(f"ElevenLabs error {response.status_code}, falling back to Edge TTS")
            except Exception as e:
                logger.error(f"ElevenLabs streaming exception: {e}, falling back to Edge-TTS")

        # 2. OpenAI Streaming TTS if configured
        if settings.OPENAI_API_KEY and self.provider == "openai":
            try:
                url = "https://api.openai.com/v1/audio/speech"
                headers = {
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "tts-1",
                    "voice": "onyx",
                    "input": clean_text,
                    "speed": 0.92
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    async with client.stream("POST", url, headers=headers, json=payload) as response:
                        if response.status_code == 200:
                            async for chunk in response.aiter_bytes():
                                if chunk:
                                    yield chunk
                            return
                        else:
                            logger.warning(f"OpenAI TTS error {response.status_code}, falling back to Edge TTS")
            except Exception as e:
                logger.error(f"OpenAI TTS streaming exception: {e}, falling back to Edge-TTS")

        # 3. Microsoft Neural Edge-TTS (Default, Free, Ultra-high quality)
        voice = voice_override or self.edge_voice
        try:
            communicate = edge_tts.Communicate(
                text=clean_text,
                voice=voice,
                rate=self.edge_rate,
                pitch=self.edge_pitch
            )
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
        except Exception as e:
            logger.error(f"Edge-TTS streaming failed: {e}")

tts_service = TTSService()
