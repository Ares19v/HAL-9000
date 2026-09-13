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
      
      // Target gaze with 8px max parallax drift
      targetGazeRef.current = {
        x: Math.max(-8, Math.min(8, deltaX * 8)),
        y: Math.max(-8, Math.min(8, deltaY * 8))
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
    ? 1.0 + (smoothLevel * 0.5) 
    : isThinking 
      ? 1.04 + Math.sin(Date.now() * 0.006) * 0.02
      : 1.0 + Math.sin(Date.now() * 0.002) * 0.015;

  const coreLuminance = isSpeaking 
    ? 0.78 + (smoothLevel * 0.22) 
    : isThinking 
      ? 0.72 
      : 0.64;

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center select-none"
      style={{ width: '290px', height: '290px' }}
    >
      {/* Outer Machined Aluminum Bezel Ring with Edge Highlights */}
      <div className="absolute inset-0 rounded-full aluminum-bezel p-[13px] shadow-[0_20px_50px_rgba(0,0,0,0.98)]">
        
        {/* Precision Knurled Retaining Collar */}
        <div className="w-full h-full rounded-full knurled-ring p-[4.5px] shadow-inner flex items-center justify-center">
          
          {/* Inner Stepped Dark Anodized Lens Housing */}
          <div className="w-full h-full rounded-full bg-[#050608] p-[9px] shadow-inner relative overflow-hidden flex items-center justify-center border border-[#2b2d35]">
            
            {/* Deep Fisheye Optical Cavity with Radial Depth */}
            <div 
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #1a0101 0%, #0a0000 65%, #000000 100%)',
                boxShadow: 'inset 0 0 55px rgba(0, 0, 0, 0.98), inset 0 0 20px rgba(255, 0, 0, 0.3)'
              }}
            >
              {/* Stepped Optical Aperture Grooves */}
              <div className="absolute inset-2 rounded-full border border-red-950/40 pointer-events-none" />
              <div className="absolute inset-5 rounded-full border border-red-900/30 pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-red-800/22 pointer-events-none" />
              <div className="absolute inset-11 rounded-full border border-red-700/16 pointer-events-none" />

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
                    width: '140px',
                    height: '140px',
                    background: 'radial-gradient(circle, rgba(240, 10, 10, 0.88) 0%, rgba(185, 0, 0, 0.45) 45%, rgba(0, 0, 0, 0) 70%)',
                    transform: `scale(${pulseScale})`,
                    opacity: coreLuminance
                  }}
                />

                {/* Primary Concentric Iris Ring */}
                <div 
                  className="absolute w-[86px] h-[86px] rounded-full border border-red-500/50"
                  style={{
                    transform: `scale(${pulseScale * 0.94})`,
                    boxShadow: '0 0 24px rgba(255, 40, 40, 0.7)'
                  }}
                />

                {/* Secondary Intermediate Ring */}
                <div 
                  className="absolute w-[70px] h-[70px] rounded-full border border-red-400/35"
                  style={{
                    transform: `scale(${pulseScale * 0.97})`,
                    boxShadow: '0 0 12px rgba(255, 20, 20, 0.4)'
                  }}
                />

                {/* Inner Fine Ring */}
                <div 
                  className="absolute w-[60px] h-[60px] rounded-full border border-red-300/25"
                  style={{
                    transform: `scale(${pulseScale * 0.98})`
                  }}
                />

                {/* Intense Red-Orange Pupil Core with Multi-Stage Radial Glow */}
                <div 
                  className="relative rounded-full flex items-center justify-center will-change-transform"
                  style={{
                    width: '58px',
                    height: '58px',
                    background: 'radial-gradient(circle at 48% 48%, #ff3e30 0%, #dc0000 45%, #7a0000 85%, #2a0000 100%)',
                    boxShadow: `
                      0 0 ${18 + smoothLevel * 30}px rgba(255, 50, 0, 0.95),
                      inset 0 0 15px rgba(255, 215, 0, 0.5)
                    `,
                    transform: `scale(${pulseScale})`
                  }}
                >
                  {/* Glowing Incandescent Yellow Core */}
                  <div 
                    className="w-[26px] h-[26px] rounded-full flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #ffea6b 38%, #ff5e00 82%, transparent 100%)',
                      boxShadow: '0 0 14px rgba(255, 255, 210, 0.98)',
                      opacity: isSpeaking ? 0.96 + (smoothLevel * 0.04) : 0.88
                    }}
                  >
                    {/* Pinpoint White Specular Center (The "Soul" of HAL) */}
                    <div className="w-[6px] h-[6px] rounded-full bg-white shadow-[0_0_10px_#ffffff]" />
                  </div>
                </div>
              </div>

              {/* Surface Convex Glass Specular Glare (Parallax opposite to gaze) */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none transition-transform duration-100 ease-out"
                style={{
                  transform: `translate3d(${-gaze.x * 0.4}px, ${-gaze.y * 0.4}px, 0)`,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.07) 32%, transparent 58%)',
                  mixBlendMode: 'screen'
                }}
              />

              {/* Overhead Softbox Studio Reflection Arc on Top Left */}
              <div 
                className="absolute top-4 left-6 w-26 h-13 rounded-[50%] border-t-[3px] border-l-[2px] border-white/45 rotate-[-26deg] pointer-events-none blur-[0.6px]"
              />

              {/* Secondary Lower Rim Glass Caustic Highlight */}
              <div 
                className="absolute bottom-5 right-7 w-18 h-9 rounded-[50%] border-b-[2px] border-r-[1.5px] border-red-400/30 rotate-[-15deg] pointer-events-none blur-[0.4px]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
