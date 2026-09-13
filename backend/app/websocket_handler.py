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

def extract_speech_chunks(buffer: str, is_first: bool = False) -> Tuple[List[str], str, bool]:
    """
    Split stream buffer into spoken speech chunks with sub-second Time-To-First-Audio (TTFA).
    - If is_first is True: eagerly emit on early punctuation ([,;:—] or [.?!]) after 2-7 words,
      or at word 5 if no punctuation, so voice playback starts in <500ms.
    - If is_first is False: split on sentence boundaries [.?!;] or clause breaks [,;—] if >= 8 words.
    """
    chunks = []
    text = buffer

    while text:
        text_stripped = text.strip()
        if not text_stripped:
            break

        if is_first:
            # 1. Early sentence termination [.?!] for 1-7 words (e.g. 'Good evening, Dave.')
            sent_matches = list(re.finditer(r'([.?!]+)(?:\s+|$)', text))
            found_early_sent = False
            for sm in sent_matches:
                cand = text[:sm.end()].strip()
                words = cand.split()
                if words and words[-1].lower() in ABBREVIATIONS:
                    continue
                if 1 <= len(words) <= 7:
                    chunks.append(cand)
                    text = text[sm.end():]
                    is_first = False
                    found_early_sent = True
                    break
            if found_early_sent:
                continue

            # 2. Early clause break [,;:—] for 3-7 words (e.g. 'I am completely operational,')
            clause_matches = list(re.finditer(r'([,;:—]+)(?:\s+|$)', text))
            found_early_clause = False
            for cm in clause_matches:
                cand = text[:cm.end()].strip()
                words = cand.split()
                if 3 <= len(words) <= 7:
                    # Check if next word is a vocative name followed by punctuation (e.g. 'Good evening,' + 'Dave.')
                    next_text = text[cm.end():].strip()
                    next_words = next_text.split()
                    if next_words and len(next_words) >= 1:
                        fw = next_words[0]
                        if fw[0].isupper() and any(c in fw for c in ',.;!?'):
                            split_pos = text.find(fw, cm.end()) + len(fw)
                            cand2 = text[:split_pos].strip()
                            if len(cand2.split()) <= 7:
                                chunks.append(cand2)
                                text = text[split_pos:]
                                is_first = False
                                found_early_clause = True
                                break

                    chunks.append(cand)
                    text = text[cm.end():]
                    is_first = False
                    found_early_clause = True
                    break
            if found_early_clause:
                continue

            # 3. If no punctuation after 6 words, break early at word 5 to avoid stalling speech
            words = text.split()
            if len(words) >= 6:
                split_idx = 0
                for _ in range(5):
                    nxt = text.find(' ', split_idx)
                    if nxt == -1: break
                    split_idx = nxt + 1
                if split_idx > 0:
                    cand = text[:split_idx].strip()
                    chunks.append(cand + ',')
                    text = text[split_idx:]
                    is_first = False
                    continue
            break

        # Subsequent chunks
        sent_matches = list(re.finditer(r'([.?!;]+)(?:\s+|$)', text))
        clause_matches = list(re.finditer(r'([,:—])(?:\s+|$)', text))

        valid_sent = None
        for sm in sent_matches:
            cand = text[:sm.end()].strip()
            words = cand.split()
            if words and words[-1].lower() in ABBREVIATIONS:
                continue
            valid_sent = sm
            break

        valid_clause = clause_matches[0] if clause_matches else None

        if valid_sent:
            cand = text[:valid_sent.end()].strip()
            words = cand.split()
            if len(words) <= 12 or not valid_clause or valid_clause.start() >= valid_sent.start():
                chunks.append(cand)
                text = text[valid_sent.end():]
                continue
            elif valid_clause and valid_clause.start() < valid_sent.start():
                c_cand = text[:valid_clause.end()].strip()
                if len(c_cand.split()) >= 6:
                    chunks.append(c_cand)
                    text = text[valid_clause.end():]
                    continue
                else:
                    chunks.append(cand)
                    text = text[valid_sent.end():]
                    continue

        if valid_clause:
            cand = text[:valid_clause.end()].strip()
            words = cand.split()
            if len(words) >= 8:
                chunks.append(cand)
                text = text[valid_clause.end():]
                continue

        # Very long runaway sentence without punctuation (>= 14 words)
        words = text.split()
        if len(words) >= 14:
            split_idx = 0
            for _ in range(10):
                nxt = text.find(' ', split_idx)
                if nxt == -1: break
                split_idx = nxt + 1
            if split_idx > 0:
                cand = text[:split_idx].strip()
                chunks.append(cand + ',')
                text = text[split_idx:]
                continue

        break

    return chunks, text, is_first

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

            # Helper to execute conversation reasoning & pipelined voice synthesis
            async def run_conversation_flow(prompt_text: str, keys_dict: dict, voice_pref: str | None, vis_context: str | None):
                nonlocal interrupted, current_task
                try:
                    await websocket.send_json({"type": "status", "state": "thinking"})
                    
                    # Queue for sentences ready to be synthesized and sent
                    sentence_queue = asyncio.Queue()
                    sentence_seq = 0

                    # Worker: synthesizes and streams sentences in strict chronological sequence
                    async def tts_worker():
                        nonlocal interrupted
                        while True:
                            item = await sentence_queue.get()
                            if item is None:
                                sentence_queue.task_done()
                                break
                            s_id, s_text = item
                            if not interrupted:
                                await synthesize_and_send_sentence(
                                    websocket, s_id, s_text, voice_pref, keys_dict
                                )
                            sentence_queue.task_done()

                    worker_task = asyncio.create_task(tts_worker())

                    buffer = ""
                    sentence_seq = 0
                    is_first_chunk = True
                    async for token in llm_streamer.stream_tokens(
                        prompt=prompt_text,
                        groq_key=keys_dict.get("groq"),
                        openai_key=keys_dict.get("openai"),
                        gemini_key=keys_dict.get("gemini"),
                        visual_context=vis_context
                    ):
                        if interrupted:
                            break

                        await websocket.send_json({
                            "type": "llm_delta",
                            "delta": token
                        })

                        buffer += token
                        complete_chunks, buffer, is_first_chunk = extract_speech_chunks(buffer, is_first=is_first_chunk)
                        for chunk in complete_chunks:
                            clean_c = chunk.strip()
                            if clean_c:
                                sentence_seq += 1
                                await sentence_queue.put((sentence_seq, clean_c))

                    # Flush any remaining buffer text as the final sentence
                    remaining_text = buffer.strip()
                    if remaining_text and not interrupted:
                        sentence_seq += 1
                        await sentence_queue.put((sentence_seq, remaining_text))

                    # Signal worker to finish
                    await sentence_queue.put(None)
                    await worker_task

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
    voice_override: str | None = None,
    keys_override: dict | None = None
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
    async for audio_bytes in tts_service.stream_audio_chunks(
        text=clean_text, 
        voice_override=voice_override,
        keys_override=keys_override
    ):
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
