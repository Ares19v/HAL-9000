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
  const [gaze, setGaze] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Subtle gaze tracking effect
  useEffect(() => {
    if (!enableGazeTracking) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
      const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);
      
      // Limit maximum gaze drift to 7 pixels for realistic fisheye parallax
      setGaze({
        x: Math.max(-7, Math.min(7, deltaX * 7)),
        y: Math.max(-7, Math.min(7, deltaY * 7))
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableGazeTracking]);

  // Audio-reactive modulation
  // When speaking, scale from 1.0 to 1.45 based on audioLevel
  const isSpeaking = state === 'speaking';
  const isThinking = state === 'thinking';
  const pulseScale = isSpeaking ? 1.0 + (audioLevel * 0.45) : isThinking ? 1.05 : 1.0;
  const coreLuminance = isSpeaking ? 0.7 + (audioLevel * 0.3) : 0.65;

  return (
    <div 
      ref={containerRef}
      className="relative flex items-center justify-center select-none"
      style={{ width: '280px', height: '280px' }}
    >
      {/* Outer Aluminum Bezel Ring */}
      <div className="absolute inset-0 rounded-full aluminum-bezel p-[14px] shadow-2xl">
        {/* Knurled Outer Collar */}
        <div className="w-full h-full rounded-full knurled-ring p-[4px] shadow-inner flex items-center justify-center">
          {/* Inner Black Anodized Lens Housing */}
          <div className="w-full h-full rounded-full bg-[#08080a] p-[10px] shadow-inner relative overflow-hidden flex items-center justify-center border border-[#2a2c33]">
            
            {/* Deep Fisheye Optical Cavity with Radial Depth */}
            <div 
              className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 50% 50%, #160101 0%, #080000 65%, #000000 100%)',
                boxShadow: 'inset 0 0 45px rgba(0, 0, 0, 0.95), inset 0 0 15px rgba(255, 0, 0, 0.2)'
              }}
            >
              {/* Outer Lens Optical Ring Grooves */}
              <div className="absolute inset-2 rounded-full border border-red-950/40 pointer-events-none" />
              <div className="absolute inset-6 rounded-full border border-red-900/30 pointer-events-none" />
              <div className="absolute inset-10 rounded-full border border-red-800/20 pointer-events-none" />

              {/* HAL Glowing Eye Assembly (Tracks cursor slightly) */}
              <div 
                className="relative flex items-center justify-center transition-transform duration-100 ease-out"
                style={{
                  transform: `translate(${gaze.x}px, ${gaze.y}px)`,
                }}
              >
                {/* Outermost Crimson Bloom */}
                <div 
                  className={`absolute rounded-full transition-all duration-75 ${isSpeaking ? 'hal-speaking-glow' : 'hal-eye-glow'}`}
                  style={{
                    width: '130px',
                    height: '130px',
                    background: 'radial-gradient(circle, rgba(230, 0, 0, 0.8) 0%, rgba(180, 0, 0, 0.4) 45%, rgba(0, 0, 0, 0) 70%)',
                    transform: `scale(${pulseScale})`,
                    opacity: coreLuminance
                  }}
                />

                {/* Concentric Iris Rings */}
                <div 
                  className="absolute w-[80px] h-[80px] rounded-full border border-red-500/50"
                  style={{
                    transform: `scale(${pulseScale * 0.95})`,
                    boxShadow: '0 0 20px rgba(255, 30, 30, 0.6)'
                  }}
                />

                {/* Intense Red Pupil */}
                <div 
                  className="relative rounded-full flex items-center justify-center"
                  style={{
                    width: '54px',
                    height: '54px',
                    background: 'radial-gradient(circle at 48% 48%, #ff3b30 0%, #d70000 45%, #7a0000 85%, #300000 100%)',
                    boxShadow: `
                      0 0 ${15 + audioLevel * 25}px rgba(255, 40, 0, 0.9),
                      inset 0 0 12px rgba(255, 200, 0, 0.4)
                    `,
                    transform: `scale(${pulseScale})`,
                    transition: 'transform 60ms linear, box-shadow 60ms linear'
                  }}
                >
                  {/* Yellow Core */}
                  <div 
                    className="w-[24px] h-[24px] rounded-full flex items-center justify-center"
                    style={{
                      background: 'radial-gradient(circle at 50% 50%, #ffffff 0%, #ffea6b 40%, #ff5e00 85%, transparent 100%)',
                      boxShadow: '0 0 10px rgba(255, 255, 200, 0.9)',
                      opacity: isSpeaking ? 0.95 + (audioLevel * 0.05) : 0.88
                    }}
                  >
                    {/* Pinpoint White Specular Center */}
                    <div className="w-[5px] h-[5px] rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                  </div>
                </div>
              </div>

              {/* Iconic Kubrick Fisheye Lens Reflection Glare (Static glass surface layer) */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 30%, transparent 55%)',
                  mixBlendMode: 'screen'
                }}
              />

              {/* Curved Glass Highlight Arc on Top Left */}
              <div 
                className="absolute top-4 left-6 w-24 h-12 rounded-[50%] border-t-[3px] border-l-[2px] border-white/35 rotate-[-25deg] pointer-events-none blur-[0.6px]"
              />

              {/* Subtle Secondary Lens Reflection on Bottom Right */}
              <div 
                className="absolute bottom-5 right-7 w-16 h-8 rounded-[50%] border-b-[2px] border-r-[1px] border-red-400/20 rotate-[-15deg] pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
