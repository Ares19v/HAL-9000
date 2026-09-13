# HAL 9000 // USSC DISCOVERY ONE

> **Real-time, ultra-low latency conversational AI reproduction of the HAL 9000 cognitive computer from Stanley Kubrick & Arthur C. Clarke's *2001: A Space Odyssey*.**  
> Powered by **Groq Whisper STT (~120ms)**, **Kokoro-82M ONNX local neural voice (StyleTTS2)**, and interactive **Discovery One flight telemetry**.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Groq LPU](https://img.shields.io/badge/Groq-LPU%20Whisper-F55036?logo=groq&logoColor=white)](https://groq.com)
[![Kokoro-82M](https://img.shields.io/badge/Kokoro-82M%20Neural%20TTS-7952B3)](https://github.com/hexgrad/kokoro)

---

## 🛰️ Architecture Highlights

- **🎙️ Server-Side Groq Whisper (`whisper-large-v3-turbo`)**: Sub-150ms transcription of raw 16kHz microphone audio directly streamed via WebSockets, eliminating browser speech API pauses.
- **🗣️ Kokoro-82M ONNX Local Neural Voice**: Local CPU StyleTTS2 neural speech engine using `bm_george` with the exact mid-Atlantic theatrical cadence of Douglas Rain.
- **⚡ Pipelined Streaming**: Sentence tokens from the LLM stream directly into asynchronous TTS synthesis queues, achieving sub-second time-to-first-voice (TTFT).
- **👁️ Responsive Optical Sensor & Eye Console**: Convex fisheye lens with dynamic mouse gaze parallax and multi-band audio spectrum luminescence.
- **🚀 Discovery One Flight Telemetry**: Live interactive telemetry for the AE-35 Azimuth antenna, centrifuge rotation, cryogenic crew stasis, and memory bank integrity.
- **⌨️ Push-to-Talk & Hotkeys**: `[SPACE]` push-to-talk, `[ESC]` instant speech interruption, and `[H]` cabin electrical hum atmosphere.

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|---|---|---|
| **STT Engine** | Groq `whisper-large-v3-turbo` | ~120ms ultra-fast raw audio transcription |
| **TTS Engine** | Kokoro-82M ONNX (`bm_george`) | Zero-cloud latency local neural voice synthesis |
| **Cognitive Engine** | Groq LPU / OpenAI / Gemini | Real-time streaming conversational intelligence |
| **Backend** | Python, FastAPI, WebSockets, Uvicorn | Subsystem telemetry & full-duplex audio pipeline |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS | 2001 aerospace bridge console & Web Audio DSP |

---

## Quick Start

### 1. Launch with One Command
```bash
python run.py
```
This automatically boots:
- **FastAPI / Uvicorn Server**: `http://localhost:8000`
- **Vite React Frontend**: `http://localhost:5173`

### 2. Manual Startup (Optional)

**Backend:**
```bash
cd backend
.\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## Configuration & Optional API Keys

Click **`CONFIG`** in the top navigation bar to configure:
1. **Groq API Key**: Enables dynamic ultra-fast LLM reasoning.
2. **OpenAI / Gemini Key**: Alternative LLM reasoning engines.
3. **Voice Timbre**: Switch between `ChristopherNeural` (Douglas Rain style), `GuyNeural`, or `BrianNeural`.
4. **Discovery Cabin Hum**: Toggle the 60Hz ambient spacecraft hum.

---

## Discovery One Mission Telemetry

| Subsystem | Function |
|---|---|
| **AE-35 Unit** | Azimuth antenna pointing tracking (interactive fault injection button included). |
| **Cryogenic Stasis** | Monitored vitals for Dr. Kaminski, Dr. Hunter, and Dr. Kimball. |
| **Cognitive Memory Core** | Displays logic banks and centrifuge rotational velocity (5.2 RPM = 1.0G). |
