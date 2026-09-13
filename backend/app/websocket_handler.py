"""
HAL 9000 Real-Time WebSocket Controller
Manages:
- Token-to-sentence streaming pipeline with intelligent abbreviation handling
- Pipelined parallel sentence TTS synthesis
- Audio chunk delivery to frontend Web Audio API player
- Real-time Discovery One telemetry broadcast
- Instant user interruption handling
"""
import asyncio
import base64
import json
import logging
import re
from typing import Set, List, Tuple
from fastapi import WebSocket, WebSocketDisconnect

from app.llm_streamer import llm_streamer
from app.tts_service import tts_service
from app.stt_service import stt_service
from app.telemetry import telemetry_engine

logger = logging.getLogger(__name__)

# Common abbreviations that should NOT trigger a sentence split
ABBREVIATIONS = {
    "dr.", "mr.", "mrs.", "ms.", "u.s.", "u.s.s.c.", "jan.", "feb.", "mar.", 
    "apr.", "jun.", "jul.", "aug.", "sep.", "sept.", "oct.", "nov.", "dec.", 
    "no.", "etc.", "e.g.", "i.e.", "vs.", "st.", "col.", "gen.", "capt.", "cmdr."
}

def extract_complete_sentences(buffer: str) -> Tuple[List[str], str]:
    """
    Intelligently split buffer into complete sentences while respecting
    abbreviations and short acronyms. Returns (complete_sentences, remaining_buffer).
    """
    # Look for sentence boundary punctuation followed by space or newline
    matches = list(re.finditer(r'([.?!;]+)(?:\s+|$)', buffer))
    if not matches:
        return [], buffer

    sentences = []
    last_idx = 0

    for match in matches:
        end_pos = match.end()
        candidate = buffer[last_idx:end_pos].strip()
        
        # Check if candidate ends with an abbreviation
        words = candidate.split()
        if words:
            last_word = words[-1].lower()
            if last_word in ABBREVIATIONS:
                # Do not split on this punctuation
                continue
            # Check for single-letter initials like "C." or "E."
            if len(last_word) == 2 and last_word[0].isalpha() and last_word[1] == '.':
                continue

        # Valid sentence found
        if candidate:
            sentences.append(candidate)
            last_idx = end_pos

    remaining = buffer[last_idx:]
    return sentences, remaining

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: dict):
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active_connections.discard(ws)

manager = ConnectionManager()

async def telemetry_broadcaster():
    """Periodically push Discovery One telemetry snapshots to all clients."""
    while True:
        try:
            if manager.active_connections:
                snapshot = telemetry_engine.get_snapshot()
                await manager.broadcast({
                    "type": "telemetry",
                    "data": snapshot
                })
            await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Telemetry broadcast error: {e}")
            await asyncio.sleep(2.0)

async def handle_hal_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    # Send initial greeting and telemetry
    await websocket.send_json({
        "type": "system_ready",
        "message": "HAL 9000 Cognitive Subsystem Online",
        "telemetry": telemetry_engine.get_snapshot()
    })

    current_task: asyncio.Task | None = None
    interrupted = False

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                payload = json.loads(raw_data)
            except Exception:
                continue

            event_type = payload.get("type")

            # 1. Handle user interruption
            if event_type == "interrupt":
                interrupted = True
                if current_task and not current_task.done():
                    current_task.cancel()
                await websocket.send_json({"type": "interrupted"})
                await websocket.send_json({"type": "status", "state": "idle"})
                continue

            # 2. Handle Subsystem commands (AE-35, Pod Bays)
            if event_type == "command":
                cmd = payload.get("action")
                if cmd == "trigger_ae35":
                    telemetry_engine.trigger_ae35_fault()
                elif cmd == "reset_ae35":
                    telemetry_engine.reset_ae35()
                elif cmd == "reset_history":
                    llm_streamer.reset_history()
                await websocket.send_json({
                    "type": "telemetry",
                    "data": telemetry_engine.get_snapshot()
                })
                continue

            # 3. Handle Optical Vision Frame update
            if event_type == "vision_frame":
                scene_desc = payload.get("description", "")
                if scene_desc:
                    setattr(websocket, "_cached_vision_desc", scene_desc)
                continue

            # Helper to execute conversation reasoning & voice synthesis
            async def run_conversation_flow(prompt_text: str, keys_dict: dict, voice_pref: str | None, vis_context: str | None):
                nonlocal interrupted, current_task
                try:
                    await websocket.send_json({"type": "status", "state": "thinking"})
                    
                    full_text = ""
                    async for token in llm_streamer.stream_tokens(
                        prompt=prompt_text,
                        groq_key=keys_dict.get("groq"),
                        openai_key=keys_dict.get("openai"),
                        gemini_key=keys_dict.get("gemini"),
                        visual_context=vis_context
                    ):
                        if interrupted:
                            break

                        full_text += token
                        await websocket.send_json({
                            "type": "llm_delta",
                            "delta": token
                        })

                    clean_full_text = full_text.strip()
                    if clean_full_text and not interrupted:
                        # Synthesize complete coherent phrase in one unified audio stream
                        # to eliminate choppy sentence-by-sentence gaps and pauses
                        await synthesize_and_send_sentence(
                            websocket, 1, clean_full_text, voice_pref
                        )

                    if not interrupted:
                        await websocket.send_json({"type": "stream_complete"})

                except asyncio.CancelledError:
                    logger.info("HAL conversation task cancelled due to interruption.")
                except Exception as err:
                    logger.error(f"Error processing speech stream: {err}")
                    await websocket.send_json({"type": "status", "state": "idle"})

            # 4. Handle Raw Audio Input (Client Microphone Stream via Groq Whisper STT)
            if event_type == "audio_input":
                audio_b64 = payload.get("audio", "")
                audio_fmt = payload.get("format", "webm")
                keys = payload.get("keys", {})
                voice_override = payload.get("voice")
                vis_ctx = getattr(websocket, "_cached_vision_desc", None) or payload.get("visual_context")

                if not audio_b64:
                    continue

                try:
                    raw_audio = base64.b64decode(audio_b64)
                except Exception as e:
                    logger.warning(f"Failed to decode audio_input base64: {e}")
                    continue

                if current_task and not current_task.done():
                    current_task.cancel()

                interrupted = False

                async def process_audio():
                    await websocket.send_json({"type": "status", "state": "thinking"})
                    groq_k = keys.get("groq")
                    transcribed_text = await stt_service.transcribe_audio(
                        audio_bytes=raw_audio,
                        file_format=audio_fmt,
                        api_key=groq_k
                    )
                    if not transcribed_text:
                        logger.info("Whisper returned empty transcription.")
                        await websocket.send_json({"type": "status", "state": "idle"})
                        return

                    # Broadcast transcription to frontend so teletype displays what was heard
                    await websocket.send_json({
                        "type": "user_transcription",
                        "text": transcribed_text
                    })

                    # Proceed to conversation reasoning
                    await run_conversation_flow(transcribed_text, keys, voice_override, vis_ctx)

                current_task = asyncio.create_task(process_audio())
                continue

            # 5. Handle Direct User Text Message
            if event_type == "user_message":
                text = payload.get("text", "").strip()
                if not text:
                    continue

                # Cancel any previous speaking task if still running
                if current_task and not current_task.done():
                    current_task.cancel()

                interrupted = False
                keys = payload.get("keys", {})
                voice_override = payload.get("voice")
                vis_ctx = getattr(websocket, "_cached_vision_desc", None) or payload.get("visual_context")

                current_task = asyncio.create_task(
                    run_conversation_flow(text, keys, voice_override, vis_ctx)
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        if current_task and not current_task.done():
            current_task.cancel()
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def synthesize_and_send_sentence(
    websocket: WebSocket,
    sentence_id: int,
    sentence_text: str,
    voice_override: str | None = None
):
    """Synthesize a sentence using low-latency TTS and stream binary audio packets."""
    clean_text = sentence_text.strip()
    if not clean_text:
        return

    await websocket.send_json({
        "type": "sentence_start",
        "sentence_id": sentence_id,
        "text": clean_text
    })

    chunk_seq = 0
    async for audio_bytes in tts_service.stream_audio_chunks(clean_text, voice_override):
        chunk_seq += 1
        b64_audio = base64.b64encode(audio_bytes).decode("ascii")
        await websocket.send_json({
            "type": "audio_chunk",
            "sentence_id": sentence_id,
            "chunk_index": chunk_seq,
            "audio_base64": b64_audio
        })

    await websocket.send_json({
        "type": "sentence_end",
        "sentence_id": sentence_id
    })
