"""
HAL 9000 Real-Time WebSocket Controller
Manages:
- Token-to-sentence streaming pipeline
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
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect

from app.llm_streamer import llm_streamer
from app.tts_service import tts_service
from app.telemetry import telemetry_engine

logger = logging.getLogger(__name__)

SENTENCE_SPLIT_REGEX = re.compile(r'([.?!;]+(?:\s+|$))')

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

            # 3. Handle User Speech / Message
            if event_type == "user_message":
                text = payload.get("text", "").strip()
                if not text:
                    continue

                # Cancel any previous speaking task if still running
                if current_task and not current_task.done():
                    current_task.cancel()

                interrupted = False
                keys = payload.get("keys", {})
                groq_k = keys.get("groq")
                openai_k = keys.get("openai")
                gemini_k = keys.get("gemini")
                voice_override = payload.get("voice")

                async def process_conversation():
                    nonlocal interrupted
                    try:
                        # Notify frontend: Thinking state
                        await websocket.send_json({"type": "status", "state": "thinking"})
                        
                        # Sentence extraction buffer
                        buffer = ""
                        sentence_id = 0

                        async for token in llm_streamer.stream_tokens(
                            prompt=text,
                            groq_key=groq_k,
                            openai_key=openai_k,
                            gemini_key=gemini_k
                        ):
                            if interrupted:
                                break

                            # Stream token to frontend for live typewriter transcript
                            await websocket.send_json({
                                "type": "llm_delta",
                                "delta": token
                            })
                            buffer += token

                            # Check if we have complete sentence(s) ready for TTS
                            parts = SENTENCE_SPLIT_REGEX.split(buffer)
                            if len(parts) > 1:
                                # We have at least one complete sentence
                                complete_sentences = parts[:-1]
                                buffer = parts[-1]  # Keep remaining uncompleted phrase

                                for i in range(0, len(complete_sentences), 2):
                                    sentence_text = complete_sentences[i] + (complete_sentences[i+1] if i+1 < len(complete_sentences) else "")
                                    clean_sentence = sentence_text.strip()
                                    if clean_sentence:
                                        sentence_id += 1
                                        await synthesize_and_send_sentence(
                                            websocket, sentence_id, clean_sentence, voice_override
                                        )

                        # Handle any trailing text remaining in buffer
                        remaining = buffer.strip()
                        if remaining and not interrupted:
                            sentence_id += 1
                            await synthesize_and_send_sentence(
                                websocket, sentence_id, remaining, voice_override
                            )

                        if not interrupted:
                            await websocket.send_json({"type": "stream_complete"})
                            await websocket.send_json({"type": "status", "state": "idle"})

                    except asyncio.CancelledError:
                        logger.info("HAL conversation task cancelled due to interruption.")
                    except Exception as err:
                        logger.error(f"Error processing speech stream: {err}")
                        await websocket.send_json({"type": "status", "state": "idle"})

                current_task = asyncio.create_task(process_conversation())

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
    await websocket.send_json({
        "type": "sentence_start",
        "sentence_id": sentence_id,
        "text": sentence_text
    })

    chunk_seq = 0
    async for audio_bytes in tts_service.stream_audio_chunks(sentence_text, voice_override):
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
