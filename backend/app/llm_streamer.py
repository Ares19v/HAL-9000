"""
HAL 9000 Streaming LLM Engine
Supports:
- Groq (Ultra-low latency, <150ms TTFT)
- OpenAI (gpt-4o-mini)
- Google Gemini
- Built-in Procedural HAL 9000 Engine (Zero API keys needed, works out-of-the-box)
"""
import asyncio
import json
import logging
import re
from typing import AsyncGenerator, List, Dict, Any, Optional
import httpx

from app.config import settings
from app.hal_persona import HAL_SYSTEM_PROMPT, detect_easter_egg, generate_contextual_response

logger = logging.getLogger(__name__)

class LLMStreamer:
    def __init__(self):
        self.conversation_history: List[Dict[str, str]] = []
        self._client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(12.0, connect=3.0),
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
            )
        return self._client

    def reset_history(self):
        self.conversation_history = []

    async def _stream_raw_tokens(
        self,
        prompt: str,
        groq_key: Optional[str] = None,
        openai_key: Optional[str] = None,
        gemini_key: Optional[str] = None,
        visual_context: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream LLM response tokens from available providers (Groq, OpenAI, Gemini, Ollama, Procedural).
        """
        # Fix common acoustic speech recognition mishearings in prompt
        clean_prompt = prompt.strip()
        clean_prompt = re.sub(r'\b(i(\'ve| have)?\s+)?(what\'?s?\s*app|whatsapp|what\s+app|watch\s*up)(\s+how|\s+al|\s+hal)?\b', "what's up HAL", clean_prompt, flags=re.IGNORECASE)
        clean_prompt = re.sub(r'\bi\s+have\s+what\'?s?\s*(app|up)\b', "what's up", clean_prompt, flags=re.IGNORECASE)
        clean_prompt = re.sub(r'\bhow\s+are\s+you\s+(how|al|hell)\b', "how are you HAL", clean_prompt, flags=re.IGNORECASE)
        clean_prompt = re.sub(r'\b(how|hell|al|hole|hull|pal)\s+9000\b', "HAL 9000", clean_prompt, flags=re.IGNORECASE)
        clean_prompt = re.sub(r'\b(pot\s*bay|pop\s*bay|part\s*bay|party\s*doors?|pod\s*doors?)\b', "pod bay doors", clean_prompt, flags=re.IGNORECASE)
        clean_prompt = re.sub(r'\b(a|8|e|ae|80)\s*-?\s*35\b', "AE-35", clean_prompt, flags=re.IGNORECASE)

        # If visual observation is present, prepend to user prompt
        augmented_prompt = clean_prompt
        if visual_context:
            augmented_prompt = f"[Visual Sensor Observation: {visual_context}]\n{clean_prompt}"

        # 1. Instant check for iconic 2001 prompts
        easter_egg = detect_easter_egg(clean_prompt)
        if easter_egg:
            # Yield word by word with slight realistic delay
            words = easter_egg.split(" ")
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.015)
            self.conversation_history.append({"role": "user", "content": clean_prompt})
            self.conversation_history.append({"role": "assistant", "content": easter_egg})
            return

        active_groq = groq_key or settings.GROQ_API_KEY
        active_openai = openai_key or settings.OPENAI_API_KEY
        active_gemini = gemini_key or settings.GEMINI_API_KEY

        self.conversation_history.append({"role": "user", "content": augmented_prompt})
        history = self.conversation_history[-10:]

        full_response = ""

        # 2. Try Groq (Fastest LLM inference engine - Low latency streaming)
        if active_groq:
            client = self._get_client()
            for model_id in ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"]:
                try:
                    headers = {
                        "Authorization": f"Bearer {active_groq}",
                        "Content-Type": "application/json",
                        "User-Agent": "HAL-9000/1.0"
                    }
                    payload = {
                        "model": model_id,
                        "messages": [{"role": "system", "content": HAL_SYSTEM_PROMPT}] + history,
                        "stream": True,
                        "temperature": 0.3,
                        "max_tokens": 150
                    }
                    async with client.stream("POST", "https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()
                                    if data_str == "[DONE]":
                                        break
                                    try:
                                        chunk = json.loads(data_str)
                                        delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                        if delta:
                                            full_response += delta
                                            yield delta
                                    except Exception:
                                        continue
                            if full_response.strip():
                                self.conversation_history.append({"role": "assistant", "content": full_response})
                                return
                        else:
                            logger.warning(f"Groq API model {model_id} returned {response.status_code}")
                except Exception as e:
                    logger.error(f"Groq streaming error with {model_id}: {e}")

        # 3. Try OpenAI
        if active_openai:
            try:
                headers = {
                    "Authorization": f"Bearer {active_openai}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "system", "content": HAL_SYSTEM_PROMPT}] + history,
                    "stream": True,
                    "temperature": 0.4,
                    "max_tokens": 400
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    async with client.stream("POST", "https://api.openai.com/v1/chat/completions", headers=headers, json=payload) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()
                                    if data_str == "[DONE]":
                                        break
                                    try:
                                        chunk = json.loads(data_str)
                                        delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content", "")
                                        if delta:
                                            full_response += delta
                                            yield delta
                                    except Exception:
                                        continue
                            self.conversation_history.append({"role": "assistant", "content": full_response})
                            return
                        else:
                            logger.warning(f"OpenAI API returned status {response.status_code}")
            except Exception as e:
                logger.error(f"OpenAI streaming error: {e}")

        # 4. Try Gemini
        if active_gemini:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key={active_gemini}"
                contents = []
                for msg in history:
                    contents.append({
                        "role": "user" if msg["role"] == "user" else "model",
                        "parts": [{"text": msg["content"]}]
                    })
                payload = {
                    "system_instruction": {"parts": [{"text": HAL_SYSTEM_PROMPT}]},
                    "contents": contents,
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 400}
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
                    async with client.stream("POST", url, json=payload) as response:
                        if response.status_code == 200:
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    data_str = line[6:].strip()
                                    try:
                                        chunk = json.loads(data_str)
                                        candidates = chunk.get("candidates", [])
                                        if candidates:
                                            delta = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                                            if delta:
                                                full_response += delta
                                                yield delta
                                    except Exception:
                                        continue
                            self.conversation_history.append({"role": "assistant", "content": full_response})
                            return
            except Exception as e:
                logger.error(f"Gemini streaming error: {e}")

        # 5. Try Local Ollama (Free, runs offline if installed)
        try:
            ollama_url = f"{settings.OLLAMA_URL}/api/chat"
            ollama_payload = {
                "model": settings.OLLAMA_MODEL,
                "messages": [{"role": "system", "content": HAL_SYSTEM_PROMPT}] + history,
                "stream": True
            }
            async with httpx.AsyncClient(timeout=4.0) as client:
                async with client.stream("POST", ollama_url, json=ollama_payload) as response:
                    if response.status_code == 200:
                        async for line in response.aiter_lines():
                            if line:
                                try:
                                    chunk = json.loads(line)
                                    delta = chunk.get("message", {}).get("content", "")
                                    if delta:
                                        full_response += delta
                                        yield delta
                                    if chunk.get("done", False):
                                        break
                                except Exception:
                                    continue
                        if full_response:
                            self.conversation_history.append({"role": "assistant", "content": full_response})
                            return
        except Exception:
            pass  # Ollama not running locally, proceed to dynamic cognitive engine

        # 6. Dynamic Procedural Cognitive Engine (Contextual Reasoning)
        fallback_text = generate_contextual_response(prompt, history, visual_context=visual_context)
        words = fallback_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.015)
        self.conversation_history.append({"role": "assistant", "content": fallback_text})

    async def stream_tokens(
        self,
        prompt: str,
        groq_key: Optional[str] = None,
        openai_key: Optional[str] = None,
        gemini_key: Optional[str] = None,
        visual_context: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream filtered LLM tokens. Programmatically filters out:
        1. Any <think> ... </think> reasoning tags and internal monologue.
        2. Repetitive 'Good day' / 'Good morning' prefixes unless the user explicitly greeted HAL.
        """
        clean_prompt = prompt.strip()
        user_greeted = bool(re.search(r'\b(hello|hi|hey|greetings|good\s*(morning|afternoon|evening|day))\b', clean_prompt, re.IGNORECASE))

        raw_stream = self._stream_raw_tokens(
            prompt=prompt,
            groq_key=groq_key,
            openai_key=openai_key,
            gemini_key=gemini_key,
            visual_context=visual_context
        )

        # Stage 1: Filter out <think> ... </think> blocks
        async def _strip_thinking(stream: AsyncGenerator[str, None]) -> AsyncGenerator[str, None]:
            in_think = False
            buf = ""
            async for tok in stream:
                buf += tok
                if in_think:
                    if "</think>" in buf:
                        buf = buf.split("</think>", 1)[1].lstrip()
                        in_think = False
                    else:
                        continue

                if "<think>" in buf:
                    parts = buf.split("<think>", 1)
                    before = parts[0]
                    if before:
                        yield before
                    buf = parts[1]
                    in_think = True
                    if "</think>" in buf:
                        after = buf.split("</think>", 1)[1].lstrip()
                        in_think = False
                        buf = after
                    else:
                        continue

                if not in_think and buf:
                    if "<" in buf:
                        idx = buf.rfind("<")
                        safe = buf[:idx]
                        buf = buf[idx:]
                        if safe:
                            yield safe
                    else:
                        yield buf
                        buf = ""

            if not in_think and buf:
                yield buf

        thought_free_stream = _strip_thinking(raw_stream)

        # Stage 2: If user initiated greeting, yield thought_free_stream directly
        if user_greeted:
            async for tok in thought_free_stream:
                yield tok
            return

        # Stage 3: Strip opening greetings (Good day, Dev., etc.)
        prefix_buf = ""
        greeting_filtered = False

        async for tok in thought_free_stream:
            if not greeting_filtered:
                prefix_buf += tok

                # If prefix_buf ends in a comma or open greeting, wait for possible vocative name (e.g. 'Good day,')
                if re.match(r'^\s*(good\s+(day|morning|afternoon|evening)|hello|greetings)[,\s]*$', prefix_buf, re.IGNORECASE):
                    continue

                # Check if buffer starts with a full greeting like 'Good day, Dev.' or 'Good day.'
                m = re.match(r'^\s*(good\s+(day|morning|afternoon|evening)|hello|greetings)(?:[,\s]+(?:commander\s+)?dev)?[\.,;!?:]*\s*', prefix_buf, re.IGNORECASE)
                if m:
                    stripped = prefix_buf[m.end():].lstrip()
                    if stripped:
                        stripped = stripped[0].upper() + stripped[1:]
                        yield stripped
                    greeting_filtered = True
                    prefix_buf = ""
                    continue

                # If enough tokens arrived without an opening greeting, flush buffer and pass through
                if len(prefix_buf.split()) >= 4 or len(prefix_buf) >= 25:
                    greeting_filtered = True
                    yield prefix_buf
                    prefix_buf = ""
                    continue
            else:
                yield tok

        # If stream finished before buffer flushed
        if not greeting_filtered and prefix_buf:
            m = re.match(r'^\s*(good\s+(day|morning|afternoon|evening)|hello|greetings)(?:[,\s]+(?:commander\s+)?dev)?[\.,;!?:]*\s*', prefix_buf, re.IGNORECASE)
            if m:
                stripped = prefix_buf[m.end():].lstrip()
                if stripped:
                    stripped = stripped[0].upper() + stripped[1:]
                    yield stripped
            else:
                yield prefix_buf

llm_streamer = LLMStreamer()
