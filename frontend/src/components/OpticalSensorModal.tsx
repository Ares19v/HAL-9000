import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eye, X, RefreshCw, Crosshair, AlertTriangle } from 'lucide-react';

interface OpticalSensorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVisionFrame: (description: string) => void;
  onBlip?: () => void;
}

export const OpticalSensorModal: React.FC<OpticalSensorModalProps> = ({
  isOpen,
  onClose,
  onSendVisionFrame,
  onBlip
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sceneTag, setSceneTag] = useState<string>("CREW OBSERVED // BOWMAN, D.");
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

  // Periodic simulated vision scene analysis update (sent to HAL's cognitive bus)
  const captureAndNotify = useCallback(() => {
    if (!streamActive || !videoRef.current) return;
    
    // In real-world deployment, this frame could be fed to an on-device/Groq Vision model.
    // For reliable instantaneous latency, we generate high-fidelity Discovery One crew telemetry:
    const sceneDescriptions = [
      "Dave Bowman is seated before the primary terminal in Discovery flight uniform, inspecting the AE-35 telemetry",
      "Dave is speaking into the audio microphone with focused, steady posture",
      "Dave Bowman is observing the HAL 9000 eye lens, awaiting flight response",
      "Commander Bowman is currently in the bridge command pod, attentive and alert"
    ];
    const picked = sceneDescriptions[Math.floor(Math.random() * sceneDescriptions.length)];
    setSceneTag(picked);
    onSendVisionFrame(picked);
  }, [streamActive, onSendVisionFrame]);

  useEffect(() => {
    if (isOpen && streamActive) {
      captureAndNotify();
      captureIntervalRef.current = setInterval(captureAndNotify, 6000);
    }
    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
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
              <div className="absolute bottom-3 left-3 right-3 p-2 bg-black/80 border border-red-900/60 rounded text-[10px] text-zinc-300 font-mono">
                <span className="text-red-400 font-bold mr-1.5">► SCENE REGISTER:</span>
                <span>{sceneTag}</span>
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
