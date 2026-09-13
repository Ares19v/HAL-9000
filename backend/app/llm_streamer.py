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
from typing import AsyncGenerator, List, Dict, Any, Optional
import httpx

from app.config import settings
from app.hal_persona import HAL_SYSTEM_PROMPT, detect_easter_egg, generate_contextual_response

logger = logging.getLogger(__name__)

class LLMStreamer:
    def __init__(self):
        self.conversation_history: List[Dict[str, str]] = []

    def reset_history(self):
        self.conversation_history = []

    async def stream_tokens(
        self,
        prompt: str,
        groq_key: Optional[str] = None,
        openai_key: Optional[str] = None,
        gemini_key: Optional[str] = None,
        visual_context: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream LLM response tokens.
        Checks for iconic Easter eggs first for instant zero-latency playback.
        """
        # If visual observation is present, prepend to user prompt
        augmented_prompt = prompt
        if visual_context:
            augmented_prompt = f"[Visual Sensor Observation: {visual_context}]\n{prompt}"

        # 1. Instant check for iconic 2001 prompts
        easter_egg = detect_easter_egg(prompt)
        if easter_egg:
            # Yield word by word with slight realistic delay
            words = easter_egg.split(" ")
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "")
                await asyncio.sleep(0.015)
            self.conversation_history.append({"role": "user", "content": prompt})
            self.conversation_history.append({"role": "assistant", "content": easter_egg})
            return

        active_groq = groq_key or settings.GROQ_API_KEY
        active_openai = openai_key or settings.OPENAI_API_KEY
        active_gemini = gemini_key or settings.GEMINI_API_KEY

        # Append user message
        self.conversation_history.append({"role": "user", "content": prompt})
        # Keep last 10 messages for context
        history = self.conversation_history[-10:]

        full_response = ""

        # 2. Try Groq (Fastest LLM inference engine)
        if active_groq:
            try:
                headers = {
                    "Authorization": f"Bearer {active_groq}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "llama-3.3-70b-versatile",
                    "messages": [{"role": "system", "content": HAL_SYSTEM_PROMPT}] + history,
                    "stream": True,
                    "temperature": 0.3,
                    "max_tokens": 400
                }
                async with httpx.AsyncClient(timeout=15.0) as client:
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
                            self.conversation_history.append({"role": "assistant", "content": full_response})
                            return
                        else:
                            logger.warning(f"Groq API returned status {response.status_code}")
            except Exception as e:
                logger.error(f"Groq streaming error: {e}")

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

        # 5. Dynamic Procedural Cognitive Engine (Contextual Reasoning)
        fallback_text = generate_contextual_response(prompt, history, visual_context=visual_context)
        words = fallback_text.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            await asyncio.sleep(0.025)
        self.conversation_history.append({"role": "assistant", "content": fallback_text})

llm_streamer = LLMStreamer()
