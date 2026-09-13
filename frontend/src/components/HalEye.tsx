import React, { useEffect, useState, useRef } from 'react';
import type { HalState, FrequencyBands } from '../types';

interface HalEyeProps {
  state: HalState;
  audioLevel: number; // 0.0 to 1.0
  frequencyBands?: FrequencyBands;
  enableGazeTracking?: boolean;
}

export const HalEye: React.FC<HalEyeProps> = ({
  state,
  audioLevel,
  frequencyBands,
  enableGazeTracking = true
}) => {
  // Smooth LERP gaze coordinates
  const [gaze, setGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetGazeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentGazeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Damped audio and multi-band state
  const [smoothLevel, setSmoothLevel] = useState<number>(0);
  const smoothLevelRef = useRef<number>(0);
  const [smoothBass, setSmoothBass] = useState<number>(0);
  const smoothBassRef = useRef<number>(0);
  const [smoothTreble, setSmoothTreble] = useState<number>(0);
  const smoothTrebleRef = useRef<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Mouse move listener with coordinate normalization
  useEffect(() => {
    if (!enableGazeTracking) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);
      
      targetGazeRef.current = {
        x: Math.max(-8, Math.min(8, deltaX * 8)),
        y: Math.max(-8, Math.min(8, deltaY * 8))
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableGazeTracking]);

  // Main animation loop: Smooth physics interpolation + multi-band damping
  useEffect(() => {
    const loop = () => {
      // 1. Smooth gaze LERP
      currentGazeRef.current.x += (targetGazeRef.current.x - currentGazeRef.current.x) * 0.08;
      currentGazeRef.current.y += (targetGazeRef.current.y - currentGazeRef.current.y) * 0.08;
      setGaze({
        x: Number(currentGazeRef.current.x.toFixed(2)),
        y: Number(currentGazeRef.current.y.toFixed(2))
      });

      // 2. Multi-band frequency damping
      smoothLevelRef.current += (audioLevel - smoothLevelRef.current) * 0.32;
      setSmoothLevel(smoothLevelRef.current);

      const targetBass = frequencyBands?.bass ?? audioLevel;
      smoothBassRef.current += (targetBass - smoothBassRef.current) * 0.28;
      setSmoothBass(smoothBassRef.current);

      const targetTreble = frequencyBands?.treble ?? audioLevel;
      smoothTrebleRef.current += (targetTreble - smoothTrebleRef.current) * 0.45;
      setSmoothTreble(smoothTrebleRef.current);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioLevel, frequencyBands]);

  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';

  // Dynamic scale calculation driven by specific vocal bands
  const outerBloomScale = isSpeaking 
    ? 1.0 + (smoothBass * 0.6) 
    : isThinking 
      ? 1.04 + Math.sin(Date.now() * 0.006) * 0.02
      : 1.0 + Math.sin(Date.now() * 0.002) * 0.015;

  const pupilScale = isSpeaking 
    ? 1.0 + (smoothLevel * 0.45) 
    : isThinking 
      ? 1.03 
      : 1.0 + Math.sin(Date.now() * 0.002) * 0.01;

  const coreLuminance = isSpeaking 
    ? 0.78 + (smoothLevel * 0.22) 
    : isThinking 
      ? 0.72 
      : 0.64;

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center select-none group"
      style={{ width: '310px', height: '310px' }}
    >
      {/* Outer Machined Cast Aluminum Bezel Ring */}
      <div className="absolute inset-0 rounded-full aluminum-bezel p-[14px] shadow-[0_25px_60px_rgba(0,0,0,0.98)] transition-transform duration-300">
        
        {/* Precision Knurled Retaining Collar Ring */}
        <div className="w-full h-full rounded-full knurled-ring p-[5px] shadow-inner flex items-center justify-center">
          
          {/* Inner Stepped Dark Anodized Lens Housing */}
          <div className="w-full h-full rounded-full bg-[#050608] p-[10px] shadow-inner relative overflow-hidden flex items-center justify-center border border-[#30333d]">
            
            {/* Deep Fisheye Optical Cavity with Fluoride Anti-Reflective Coating */}
            <div 
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 45% 45%, #220303 0%, #0d0101 55%, #000000 100%)',
                boxShadow: 'inset 0 0 65px rgba(0, 0, 0, 0.98), inset 0 0 25px rgba(255, 0, 0, 0.35)'
              }}
            >
              {/* Stepped Optical Aperture Grooves (C-Mount 8-Blade Aperture Simulation) */}
              <div className="absolute inset-1.5 rounded-full border border-red-950/50 pointer-events-none" />
              <div className="absolute inset-4 rounded-full border border-red-900/35 pointer-events-none" />
              <div className="absolute inset-7 rounded-full border border-red-800/25 pointer-events-none" />
              <div className="absolute inset-10 rounded-full border border-red-700/20 pointer-events-none" />
              <div className="absolute inset-13 rounded-full border border-red-600/15 pointer-events-none" />

              {/* HAL Glowing Eye Assembly with Fluid LERP Parallax */}
              <div 
                className="relative flex items-center justify-center will-change-transform"
                style={{
                  transform: `translate3d(${gaze.x}px, ${gaze.y}px, 0)`,
                }}
              >
                {/* 70mm Anamorphic Lens Flare Streak (Horizontal Beam when speaking) */}
                {isSpeaking && (
                  <div 
                    className="absolute h-[1.8px] rounded-full pointer-events-none opacity-90 transition-all duration-75"
                    style={{
                      width: `${180 + smoothLevel * 120}px`,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 50, 20, 0.6) 20%, rgba(255, 255, 255, 0.98) 50%, rgba(255, 50, 20, 0.6) 80%, transparent 100%)',
                      boxShadow: '0 0 10px rgba(255, 70, 30, 0.9)'
                    }}
                  />
                )}

                {/* Outermost Crimson Coronal Bloom (Driven by Bass Frequencies) */}
                <div 
                  className={`absolute rounded-full transition-shadow duration-75 ${isSpeaking ? 'hal-speaking-glow' : 'hal-eye-glow'}`}
                  style={{
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, rgba(255, 15, 15, 0.95) 0%, rgba(200, 0, 0, 0.5) 45%, rgba(0, 0, 0, 0) 72%)',
                    transform: `scale(${outerBloomScale})`,
                    opacity: coreLuminance
                  }}
                />

                {/* Concentric Secondary Iris Ring */}
                <div 
                  className="absolute w-[94px] h-[94px] rounded-full border border-red-500/55"
                  style={{
                    transform: `scale(${pupilScale * 0.94})`,
                    boxShadow: '0 0 28px rgba(255, 40, 40, 0.75)'
                  }}
                />

                {/* Intermediate Ring */}
                <div 
                  className="absolute w-[78px] h-[78px] rounded-full border border-red-400/40"
                  style={{
                    transform: `scale(${pupilScale * 0.97})`,
                    boxShadow: '0 0 14px rgba(255, 20, 20, 0.45)'
                  }}
                />

                {/* Inner Fine Ring */}
                <div 
                  className="absolute w-[66px] h-[66px] rounded-full border border-red-300/30"
                  style={{
                    transform: `scale(${pupilScale * 0.98})`
                  }}
                />

                {/* Intense Red-Orange Pupil Core with Multi-Stage Radial Glow */}
                <div 
                  className="relative rounded-full flex items-center justify-center will-change-transform"
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'radial-gradient(circle at 48% 48%, #ff4536 0%, #e10000 45%, #800000 85%, #2a0000 100%)',
                    boxShadow: `
                      0 0 ${20 + smoothLevel * 35}px rgba(255, 50, 0, 0.98),
                      inset 0 0 18px rgba(255, 220, 0, 0.55)
                    `,
                    transform: `scale(${pupilScale})`
                  }}
                >
                  {/* Glowing Incandescent Yellow Core */}
                  <div 
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #ffea6b 40%, #ff5e00 85%, transparent 100%)',
                      boxShadow: '0 0 16px rgba(255, 255, 215, 0.98)',
                      opacity: isSpeaking ? 0.97 + (smoothTreble * 0.03) : 0.90
                    }}
                  >
                    {/* Pinpoint White Specular Center (The "Soul" of HAL - Articulated by Treble) */}
                    <div 
                      className="rounded-full bg-white shadow-[0_0_12px_#ffffff]" 
                      style={{
                        width: `${6 + smoothTreble * 1.5}px`,
                        height: `${6 + smoothTreble * 1.5}px`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Fluoride Anti-Reflective Purple Tint (Authentic 1960s Cine Lens Coating) */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none opacity-20"
                style={{
                  background: 'radial-gradient(circle at 60% 40%, rgba(138, 43, 226, 0.4) 0%, rgba(65, 105, 225, 0.2) 60%, transparent 80%)',
                  mixBlendMode: 'color-dodge'
                }}
              />

              {/* Surface Convex Glass Specular Glare (Parallax opposite to gaze) */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none transition-transform duration-100 ease-out"
                style={{
                  transform: `translate3d(${-gaze.x * 0.45}px, ${-gaze.y * 0.45}px, 0)`,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.32) 0%, rgba(255, 255, 255, 0.08) 35%, transparent 60%)',
                  mixBlendMode: 'screen'
                }}
              />

              {/* Overhead Softbox Studio Reflection Arc on Top Left */}
              <div 
                className="absolute top-5 left-7 w-28 h-14 rounded-[50%] border-t-[3.5px] border-l-[2px] border-white/50 rotate-[-26deg] pointer-events-none blur-[0.5px]"
              />

              {/* Secondary Lower Rim Glass Caustic Highlight */}
              <div 
                className="absolute bottom-6 right-8 w-20 h-10 rounded-[50%] border-b-[2px] border-r-[1.5px] border-red-400/35 rotate-[-15deg] pointer-events-none blur-[0.4px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
