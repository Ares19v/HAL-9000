"""
HAL 9000 Low-Latency Streaming Text-to-Speech Service
Supports:
1. Kokoro-82M ONNX (Local CPU StyleTTS2, <80ms TTFT, rich human prosody, zero cloud latency)
2. Cartesia Sonic (Sub-100ms conversational voice API)
3. ElevenLabs Low-Latency Streaming API
4. OpenAI Audio Speech API (tts-1 onyx/alloy)
5. Microsoft Neural TTS via edge-tts (Fallback)
"""
import asyncio
import io
import logging
import os
from typing import AsyncGenerator, Optional
import httpx
import soundfile as sf

from app.config import settings

logger = logging.getLogger(__name__)

# Global lazy-loaded Kokoro instance & custom voice vectors
_kokoro_instance = None
_hal9000_voice_vector = None

def get_kokoro():
    global _kokoro_instance, _hal9000_voice_vector
    if _kokoro_instance is None:
        try:
            from kokoro_onnx import Kokoro
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            model_path = os.path.join(base_dir, settings.KOKORO_MODEL_PATH)
            voices_path = os.path.join(base_dir, settings.KOKORO_VOICES_PATH)
            hal_npy_path = os.path.join(base_dir, "models", "hal9000_voice.npy")
            
            if os.path.exists(model_path) and os.path.exists(voices_path):
                logger.info(f"[Kokoro] Loading ONNX model from {model_path}...")
                _kokoro_instance = Kokoro(model_path, voices_path)
                logger.info("[Kokoro] Kokoro-82M ONNX model successfully initialized.")

                # Load custom synthesized HAL 9000 acoustic timbre
                if os.path.exists(hal_npy_path):
                    import numpy as np
                    _hal9000_voice_vector = np.load(hal_npy_path)
                    logger.info("[Kokoro] Calibrated HAL 9000 acoustic signature loaded.")
            else:
                logger.warning(f"[Kokoro] Model files not found at {model_path}. Kokoro unavailable.")
        except Exception as e:
            logger.error(f"[Kokoro] Failed to initialize Kokoro-ONNX: {e}")
    return _kokoro_instance

def get_hal_voice_vector():
    global _hal9000_voice_vector
    if _hal9000_voice_vector is None:
        get_kokoro()
    return _hal9000_voice_vector

class TTSService:
    def __init__(self):
        self.provider = settings.TTS_PROVIDER
        self.edge_voice = settings.EDGE_VOICE
        self.edge_rate = settings.EDGE_RATE
        self.edge_pitch = settings.EDGE_PITCH

    async def stream_audio_chunks(
        self,
        text: str,
        voice_override: Optional[str] = None,
        provider_override: Optional[str] = None
    ) -> AsyncGenerator[bytes, None]:
        """
        Stream raw audio chunks (wav/mp3) for a given text snippet.
        """
        clean_text = text.strip()
        if not clean_text:
            return

        provider = provider_override or self.provider

        # 1. Cartesia Sonic API (Sub-100ms ultra-low-latency)
        if (settings.CARTESIA_API_KEY or provider == "cartesia") and settings.CARTESIA_API_KEY:
            try:
                url = "https://api.cartesia.ai/tts/bytes"
                headers = {
                    "X-API-Key": settings.CARTESIA_API_KEY,
                    "Cartesia-Version": "2024-06-10",
                    "Content-Type": "application/json"
                }
                # Default to British Baritone / Calibrated HAL voice
                cartesia_voice_id = voice_override or "a0e99841-438c-4a64-b679-ae501e7d6091"
                payload = {
                    "model_id": "sonic-english",
                    "transcript": clean_text,
                    "voice": {"mode": "id", "id": cartesia_voice_id},
                    "output_format": {
                        "container": "wav",
                        "encoding": "pcm_s16le",
                        "sample_rate": 24000
                    }
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    async with client.stream("POST", url, headers=headers, json=payload) as response:
                        if response.status_code == 200:
                            async for chunk in response.aiter_bytes(chunk_size=4096):
                                if chunk:
                                    yield chunk
                            return
                        else:
                            logger.warning(f"Cartesia error {response.status_code}, falling back.")
            except Exception as e:
                logger.error(f"Cartesia exception: {e}, falling back.")

        # 2. Kokoro-82M ONNX (Local StyleTTS2, High-speed, Human Prosody)
        if provider == "kokoro" or voice_override in ["bm_george", "bm_daniel", "am_michael", "am_adam", "kokoro"]:
            kokoro = get_kokoro()
            if kokoro is not None:
                try:
                    voice_name = voice_override if voice_override and not voice_override.startswith("en-") else settings.KOKORO_VOICE
                    lang = "en-gb" if voice_name.startswith("bm_") or voice_name.startswith("bf_") else "en-us"

                    loop = asyncio.get_running_loop()
                    samples, sample_rate = await loop.run_in_executor(
                        None,
                        lambda: kokoro.create(clean_text, voice=voice_name, speed=settings.KOKORO_SPEED, lang=lang)
                    )

                    # Encode to in-memory WAV buffer
                    wav_io = io.BytesIO()
                    sf.write(wav_io, samples, sample_rate, format="WAV", subtype="PCM_16")
                    wav_bytes = wav_io.getvalue()

                    # Stream in 16KB packets for immediate Web Audio intake
                    chunk_size = 16384
                    for i in range(0, len(wav_bytes), chunk_size):
                        yield wav_bytes[i:i + chunk_size]
                        await asyncio.sleep(0.001)
                    return
                except Exception as e:
                    logger.error(f"Kokoro synthesis error: {e}, falling back to Edge TTS.")

        # 3. ElevenLabs Streaming if configured
        if settings.ELEVENLABS_API_KEY and settings.ELEVENLABS_VOICE_ID and provider == "elevenlabs":
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

        # 4. OpenAI Streaming TTS if configured
        if settings.OPENAI_API_KEY and provider == "openai":
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

        # 5. Microsoft Neural Edge-TTS (Fallback, Free, Calibrated)
        import edge_tts
        voice = voice_override if voice_override and voice_override.startswith("en-") else self.edge_voice
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

