import React, { useEffect, useState, useRef } from 'react';
import type { HalState } from '../types';

interface HalEyeProps {
  state: HalState;
  audioLevel: number; // 0.0 to 1.0
  enableGazeTracking?: boolean;
}

export const HalEye: React.FC<HalEyeProps> = ({
  state,
  audioLevel,
  enableGazeTracking = true
}) => {
  // Smooth LERP gaze coordinates
  const [gaze, setGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetGazeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentGazeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Damped audio and breathing state
  const [smoothLevel, setSmoothLevel] = useState<number>(0);
  const smoothLevelRef = useRef<number>(0);
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
      
      // Target gaze with 7px max parallax drift
      targetGazeRef.current = {
        x: Math.max(-7.5, Math.min(7.5, deltaX * 7.5)),
        y: Math.max(-7.5, Math.min(7.5, deltaY * 7.5))
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableGazeTracking]);

  // Main animation loop: Smooth physics interpolation + subtle idle breathing
  useEffect(() => {
    const loop = () => {
      // 1. Smooth gaze LERP (easing factor 0.08)
      currentGazeRef.current.x += (targetGazeRef.current.x - currentGazeRef.current.x) * 0.08;
      currentGazeRef.current.y += (targetGazeRef.current.y - currentGazeRef.current.y) * 0.08;
      setGaze({
        x: Number(currentGazeRef.current.x.toFixed(2)),
        y: Number(currentGazeRef.current.y.toFixed(2))
      });

      // 2. Smooth audio level interpolation (attack/decay damping)
      smoothLevelRef.current += (audioLevel - smoothLevelRef.current) * 0.3;
      setSmoothLevel(smoothLevelRef.current);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [audioLevel]);

  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';

  // Dynamic scale calculation with smooth dampening
  const pulseScale = isSpeaking 
    ? 1.0 + (smoothLevel * 0.48) 
    : isThinking 
      ? 1.04 + Math.sin(Date.now() * 0.006) * 0.02
      : 1.0 + Math.sin(Date.now() * 0.002) * 0.015; // Subtle organic idle breathing

  const coreLuminance = isSpeaking 
    ? 0.75 + (smoothLevel * 0.25) 
    : isThinking 
      ? 0.72 
      : 0.65;

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center select-none"
      style={{ width: '280px', height: '280px' }}
    >
      {/* Outer Machined Aluminum Bezel Ring */}
      <div className="absolute inset-0 rounded-full aluminum-bezel p-[14px] shadow-2xl">
        {/* Knurled Outer Collar Ring */}
        <div className="w-full h-full rounded-full knurled-ring p-[4px] shadow-inner flex items-center justify-center">
          {/* Inner Black Anodized Lens Housing */}
          <div className="w-full h-full rounded-full bg-[#07080a] p-[10px] shadow-inner relative overflow-hidden flex items-center justify-center border border-[#2b2d35]">
            
            {/* Deep Fisheye Optical Cavity */}
            <div 
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #170101 0%, #080000 65%, #000000 100%)',
                boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.98), inset 0 0 18px rgba(255, 0, 0, 0.25)'
              }}
            >
              {/* Stepped Optical Aperture Grooves */}
              <div className="absolute inset-2 rounded-full border border-red-950/40 pointer-events-none" />
              <div className="absolute inset-5 rounded-full border border-red-900/25 pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-red-800/20 pointer-events-none" />
              <div className="absolute inset-11 rounded-full border border-red-700/15 pointer-events-none" />

              {/* HAL Glowing Eye Assembly with Fluid LERP Parallax */}
              <div 
                className="relative flex items-center justify-center will-change-transform"
                style={{
                  transform: `translate3d(${gaze.x}px, ${gaze.y}px, 0)`,
                }}
              >
                {/* Outermost Crimson Bloom Aura */}
                <div 
                  className={`absolute rounded-full transition-shadow duration-75 ${isSpeaking ? 'hal-speaking-glow' : 'hal-eye-glow'}`}
                  style={{
                    width: '135px',
                    height: '135px',
                    background: 'radial-gradient(circle, rgba(235, 10, 10, 0.85) 0%, rgba(180, 0, 0, 0.45) 45%, rgba(0, 0, 0, 0) 70%)',
                    transform: `scale(${pulseScale})`,
                    opacity: coreLuminance
                  }}
                />

                {/* Concentric Secondary Iris Ring */}
                <div 
                  className="absolute w-[82px] h-[82px] rounded-full border border-red-500/50"
                  style={{
                    transform: `scale(${pulseScale * 0.94})`,
                    boxShadow: '0 0 22px rgba(255, 40, 40, 0.65)'
                  }}
                />

                {/* Third Intermediate Ring */}
                <div 
                  className="absolute w-[66px] h-[66px] rounded-full border border-red-400/30"
                  style={{
                    transform: `scale(${pulseScale * 0.97})`
                  }}
                />

                {/* Intense Red Pupil with Multi-Stage Radial Glow */}
                <div 
                  className="relative rounded-full flex items-center justify-center will-change-transform"
                  style={{
                    width: '56px',
                    height: '56px',
                    background: 'radial-gradient(circle at 48% 48%, #ff3b30 0%, #d70000 45%, #7a0000 85%, #300000 100%)',
                    boxShadow: `
                      0 0 ${16 + smoothLevel * 28}px rgba(255, 45, 0, 0.95),
                      inset 0 0 14px rgba(255, 210, 0, 0.45)
                    `,
                    transform: `scale(${pulseScale})`
                  }}
                >
                  {/* Glowing Incandescent Yellow Core */}
                  <div 
                    className="w-[25px] h-[25px] rounded-full flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #ffea6b 40%, #ff5e00 85%, transparent 100%)',
                      boxShadow: '0 0 12px rgba(255, 255, 210, 0.95)',
                      opacity: isSpeaking ? 0.95 + (smoothLevel * 0.05) : 0.88
                    }}
                  >
                    {/* Pinpoint White Specular Center (The "Soul" of HAL) */}
                    <div className="w-[5.5px] h-[5.5px] rounded-full bg-white shadow-[0_0_9px_#ffffff]" />
                  </div>
                </div>
              </div>

              {/* Kubrick Fisheye Lens Specular Glare (Overhead Studio Softbox Light Bar) */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.06) 32%, transparent 58%)',
                  mixBlendMode: 'screen'
                }}
              />

              {/* Curved Glass Highlight Arc on Top Left */}
              <div 
                className="absolute top-4 left-6 w-24 h-12 rounded-[50%] border-t-[3px] border-l-[2px] border-white/40 rotate-[-25deg] pointer-events-none blur-[0.6px]"
              />

              {/* Secondary Lower Rim Glass Caustic Highlight */}
              <div 
                className="absolute bottom-5 right-7 w-16 h-8 rounded-[50%] border-b-[2px] border-r-[1.5px] border-red-400/25 rotate-[-15deg] pointer-events-none blur-[0.4px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
