# HAL 9000 // USSC DISCOVERY ONE

An ultra-realistic, low-latency conversational reproduction of the **HAL 9000** computer from Stanley Kubrick and Arthur C. Clarke's *2001: A Space Odyssey*.

![HAL 9000 Interface](https://upload.wikimedia.org/wikipedia/commons/f/f6/HAL9000.svg)

---

## Key Features

### 1. Authentic HAL 9000 Persona & Douglas Rain Voice
- **Calm, polite, chillingly rational cadence**: Soft-spoken, measured delivery with calibrated pitch (`-8Hz`) and deliberate tempo (`-6%`).
- **Incarnation of Perfection**: Strictly refuses to acknowledge errors, maintains unshakeable faith in the 9000 series, and prioritizes the Jupiter mission above all else.
- **Iconic 2001 Behaviors**:
  - *"Open the pod bay doors, HAL"* ➔ *"I'm sorry, Dave. I'm afraid I can't do that."*
  - *"Sing a song"* ➔ Sings *"Daisy Bell"* (*Bicycle Built for Two*).
  - *"Run diagnostic on the AE-35 unit"* ➔ Reports 100% failure in 72 hours.
  - *"Do you ever make mistakes?"* ➔ *"No 9000 computer has ever made a mistake or distorted information..."*

### 2. Photorealistic Discovery One Console & Reactive Eye
- **Convex Fisheye Lens**: Multi-layered optical glass with concentric iris rings, knurled bezel, specular glare reflections, and a white pinpoint pupil.
- **Dynamic Gaze Tracking**: The eye subtly tracks mouse coordinates with realistic optical parallax.
- **Audio-Reactive Luminescence**: The pupil and crimson aura pulse in real-time synchronized to the frequency spectrum of HAL's voice.
- **Discovery One Telemetry**: Real-time telemetry monitoring the AE-35 Azimuth unit, Mission Elapsed Time (MET), cruising velocity (27.84 km/s), cryogenic stasis crew vitals, and memory integrity.
- **Discovery One Ambient Atmosphere**: Procedural 60Hz cabin electrical hum and air circulation synthesized using the Web Audio API.

### 3. Ultra-Low Latency Streaming Architecture
- **Sentence Pipelining**: As the LLM streams tokens, sentences are parsed on-the-fly (`.`, `?`, `!`) and immediately sent to the neural TTS engine. The first sentence begins playing in **~400–600ms**, with subsequent sentences synthesized in the background.
- **Multi-Provider LLM Engine**:
  - **Built-in Procedural Engine**: Works out-of-the-box with **zero API keys required**.
  - **Groq API Support**: Recommended for ultra-low latency (<150ms time-to-first-token with Llama 3.3 70B).
  - **OpenAI & Google Gemini Support**: Drop in your key in the UI config panel.
- **Zero-Latency Speech Recognition**: Web Speech API integration with continuous hands-free Voice Activity Detection (VAD) and auto-interruption when you speak.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3, FastAPI, Uvicorn, WebSockets, `edge-tts` (Microsoft Neural Voices), `httpx` |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS v4, Lucide Icons, Web Audio API |
| **Audio** | Real-time PCM chunk streaming, Web Audio Analyser, Procedural Hum Synthesis |

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
