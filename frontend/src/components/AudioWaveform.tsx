import React, { useEffect, useRef } from 'react';
import type { HalState } from '../types';

interface AudioWaveformProps {
  state: HalState;
  audioLevel: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ state, audioLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Background subtle grid
      ctx.strokeStyle = '#141720';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Oscilloscope wave calculation
      const isSpeaking = state === 'speaking';
      const isListening = state === 'listening';
      const amplitude = isSpeaking ? Math.max(8, audioLevel * (height * 0.42)) : isListening ? 6 : 2;
      const waveColor = isSpeaking ? '#ef4444' : isListening ? '#22c55e' : '#3b82f6';

      phaseRef.current += isSpeaking ? 0.08 + audioLevel * 0.06 : 0.03;

      // Draw primary glowing wave
      ctx.beginPath();
      ctx.lineWidth = isSpeaking ? 2.5 : 1.5;
      ctx.strokeStyle = waveColor;
      ctx.shadowBlur = isSpeaking ? 12 : 4;
      ctx.shadowColor = waveColor;

      for (let x = 0; x < width; x++) {
        // Multi-frequency harmonic superposition for organic acoustic look
        const normX = x / width;
        const envelope = Math.sin(normX * Math.PI); // Pinches ends at 0
        const y1 = Math.sin(normX * 12 + phaseRef.current) * amplitude;
        const y2 = Math.sin(normX * 24 - phaseRef.current * 1.5) * (amplitude * 0.4);
        const y3 = Math.sin(normX * 4 + phaseRef.current * 0.5) * (amplitude * 0.25);
        const y = centerY + (y1 + y2 + y3) * envelope;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Draw mirrored faint secondary harmonic wave
      if (isSpeaking) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 120, 120, 0.4)';
        ctx.shadowBlur = 0;
        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);
          const y = centerY - (Math.sin(normX * 16 + phaseRef.current * 1.8) * amplitude * 0.6) * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, audioLevel]);

  return (
    <div className="relative w-full h-16 bg-[#07080a] border border-[#20222a] rounded-lg overflow-hidden flex items-center justify-center">
      {/* CRT Scanline overlay */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none" />
      
      <canvas 
        ref={canvasRef} 
        width={480} 
        height={64} 
        className="w-full h-full"
      />

      <div className="absolute top-1 left-2 text-[9px] font-mono tracking-widest text-zinc-600 uppercase">
        ACOUSTIC CARRIER // 10.4 kHz
      </div>
    </div>
  );
};
