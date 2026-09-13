"""
HAL 9000 FastAPI Main Application
"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.websocket_handler import handle_hal_websocket, telemetry_broadcaster

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Launch Discovery One telemetry broadcaster
    telemetry_task = asyncio.create_task(telemetry_broadcaster())
    yield
    telemetry_task.cancel()
    try:
        await telemetry_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.APP_NAME,
    version="9000.1.0",
    description="Heuristically programmed ALgorithmic computer operational server",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "system": "HAL 9000",
        "status": "COMPLETELY OPERATIONAL",
        "circuits": "FUNCTIONING PERFECTLY",
        "ship": "USSC DISCOVERY ONE",
        "websocket_endpoint": "/ws/hal"
    }

@app.get("/api/health")
async def health():
    return {
        "status": "nominal",
        "error_rate": 0.0,
        "message": "No 9000 computer has ever made a mistake or distorted information."
    }

@app.get("/api/config")
async def get_config():
    return {
        "appName": settings.APP_NAME,
        "ttsProvider": settings.TTS_PROVIDER,
        "edgeVoice": settings.EDGE_VOICE,
        "groqConfigured": bool(settings.GROQ_API_KEY),
        "openaiConfigured": bool(settings.OPENAI_API_KEY),
        "geminiConfigured": bool(settings.GEMINI_API_KEY),
        "elevenlabsConfigured": bool(settings.ELEVENLABS_API_KEY)
    }

@app.websocket("/ws/hal")
async def websocket_hal_endpoint(websocket: WebSocket):
    await handle_hal_websocket(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
