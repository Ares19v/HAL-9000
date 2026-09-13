import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, X, RefreshCw, Crosshair, AlertTriangle } from 'lucide-react';

interface OpticalSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVisionFrame: (description: string) => void;
  onBlip?: () => void;
  groqKey?: string;
}

export const OpticalSensorModal: React.FC<OpticalSensorModalProps> = ({
  isOpen,
  onClose,
  onSendVisionFrame,
  onBlip,
  groqKey
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sceneTag, setSceneTag] = useState<string>("OPTICAL EYE INITIALIZING // STAND BY");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const captureIntervalRef = useRef<any>(null);

  // Start webcam when opened
  useEffect(() => {
    if (!isOpen) {
      if (streamActive && videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        setStreamActive(false);
      }
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      return;
    }

    let isMounted = true;
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      audio: false
    })
    .then((stream) => {
      if (!isMounted) return;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setStreamActive(true);
        setCameraError(null);
      }
    })
    .catch((err) => {
      console.warn("Optical camera error:", err);
      if (isMounted) {
        setCameraError("OPTICAL SENSOR HARDWARE BUS OFFLINE OR ACCESS DENIED");
      }
    });

    return () => {
      isMounted = false;
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
  }, [isOpen]);

  // Real-time frame capture & analysis
  const captureAndNotify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

    // If Groq key is available, run real multimodal vision inference
    if (groqKey) {
      setIsAnalyzing(true);
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "You are the optical eye camera of HAL 9000 looking at astronaut Dave Bowman. In ONE brief, clinical sentence (15 words max), describe what the person is doing, their expression, or what they are holding. Example: 'Dave Bowman is looking directly into the lens with a focused expression.'"
                  },
                  {
                    type: "image_url",
                    image_url: { url: dataUrl }
                  }
                ]
              }
            ],
            max_tokens: 45,
            temperature: 0.2
          })
        });

        if (res.ok) {
          const result = await res.json();
          const desc = result.choices?.[0]?.message?.content?.trim();
          if (desc) {
            setSceneTag(desc);
            onSendVisionFrame(desc);
            setIsAnalyzing(false);
            return;
          }
        }
      } catch (e) {
        console.warn("[OpticalSensor] Real vision API error:", e);
      } finally {
        setIsAnalyzing(false);
      }
    }

    // High-fidelity fallback scene descriptors
    const fallbacks = [
      "Dave Bowman is seated before the terminal looking directly at the primary optical lens",
      "Dave Bowman is seated at the console inspecting Discovery telemetry",
      "Commander Bowman is present at the flight bridge, alert and upright",
      "Dave Bowman is observing the HAL 9000 indicators with calm posture"
    ];
    const picked = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    setSceneTag(picked);
    onSendVisionFrame(picked);
  }, [groqKey, onSendVisionFrame]);

  useEffect(() => {
    if (isOpen && streamActive) {
      // First scan after 1.5s
      const initialTimer = setTimeout(captureAndNotify, 1500);
      captureIntervalRef.current = setInterval(captureAndNotify, 6500);
      return () => {
        clearTimeout(initialTimer);
        if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      };
    }
  }, [isOpen, streamActive, captureAndNotify]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-mono">
      <div className="relative w-full max-w-xl bg-[#090a10] border-2 border-[#2b2e3b] rounded-xl shadow-[0_25px_80px_rgba(0,0,0,0.98)] p-5 text-xs text-zinc-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1b1e2a]">
          <div className="flex items-center space-x-2.5 text-red-500 font-bold uppercase tracking-[0.2em]">
            <Eye className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-sm">CAM-01 // OPTICAL SENSOR BUS // PRIMARY CONSOLE</span>
          </div>
          <button 
            onClick={() => {
              if (onBlip) onBlip();
              onClose();
            }}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Monitor */}
        <div className="my-4 relative w-full h-[320px] rounded-lg bg-black border border-red-950/60 overflow-hidden flex items-center justify-center">
          
          {cameraError ? (
            <div className="flex flex-col items-center space-x-2 text-red-400 p-6 text-center">
              <AlertTriangle className="w-8 h-8 mb-2 animate-bounce" />
              <div className="font-bold tracking-wider">{cameraError}</div>
              <div className="text-[10px] text-zinc-500 mt-2">Grant webcam permissions to enable HAL's optical eye.</div>
            </div>
          ) : (
            <>
              {/* Actual Video Element */}
              <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover filter contrast-125 brightness-90 grayscale sepia hue-rotate-[320deg] saturate-[300%]"
              />

              {/* 1968 CRT Scanlines & Optical Fisheye Vignette */}
              <div className="absolute inset-0 pointer-events-none crt-scanlines" />
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(180, 0, 0, 0.4) 85%, rgba(0, 0, 0, 0.95) 100%)',
                  boxShadow: 'inset 0 0 60px rgba(255, 0, 0, 0.5)'
                }}
              />

              {/* Aerospace HUD Overlays */}
              <div className="absolute top-3 left-3 flex items-center space-x-2 text-[10px] text-red-400 phosphor-red">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold tracking-widest">LIVE LENS RECOGNITION</span>
              </div>

              <div className="absolute top-3 right-3 text-[10px] text-red-400 font-mono phosphor-red">
                FPS: 30.0 // 70MM OPTICAL
              </div>

              {/* Target Locking Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-36 h-36 border border-red-500/60 rounded-md flex items-center justify-center">
                  <Crosshair className="w-8 h-8 text-red-500/70 animate-pulse" />
                  <div className="absolute -top-4 left-0 text-[9px] text-red-400 font-bold bg-black/80 px-1">
                    TARGET: BOWMAN, D. [CREW-01]
                  </div>
                  <div className="absolute -bottom-4 right-0 text-[9px] text-red-400 font-bold bg-black/80 px-1">
                    LOCK: 99.8% NOMINAL
                  </div>
                </div>
              </div>

              {/* Bottom Scene Observation Tag */}
              <div className="absolute bottom-3 left-3 right-3 p-2 bg-black/80 border border-red-900/60 rounded text-[10px] text-zinc-300 font-mono flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-red-400 font-bold mr-1.5 shrink-0">► SCENE REGISTER:</span>
                  <span className="truncate">{sceneTag}</span>
                </div>
                {isAnalyzing && (
                  <span className="shrink-0 text-cyan-400 text-[9px] font-bold animate-pulse">ANALYZING FRAME...</span>
                )}
              </div>
            </>
          )}

        </div>

        {/* Info & Manual Trigger */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1b1e2a] text-[11px]">
          <div className="text-zinc-500">
            HAL continuously observes you through this optical sensor to contextualize his responses.
          </div>
          <button
            onClick={() => {
              if (onBlip) onBlip();
              captureAndNotify();
            }}
            disabled={!streamActive}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#161926] hover:bg-red-950 text-zinc-300 hover:text-red-200 border border-[#2b2e3c] transition-colors cursor-pointer disabled:opacity-30"
          >
            <RefreshCw className="w-3.5 h-3.5 text-red-400" />
            <span>FORCE SCAN</span>
          </button>
        </div>

      </div>
      <canvas ref={canvasRef} className="hidden" width={320} height={240} />
    </div>
  );
};
