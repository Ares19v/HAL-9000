import React, { useEffect, useRef } from 'react';
import type { HalState } from '../types';

interface AudioWaveformProps {
  state: HalState;
  audioLevel: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ state, audioLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<number>(0);
  const smoothAmpRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // High DPI scaling
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. CRT grid lines
      ctx.strokeStyle = '#11131a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Centerline
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      // Vertical calibration pips
      for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, centerY - 4);
        ctx.lineTo(x, centerY + 4);
      }
      ctx.stroke();

      // 2. Oscilloscope wave calculation with smoothed amplitude
      const isSpeaking = state === 'speaking';
      const isListening = state === 'listening';
      const targetAmp = isSpeaking ? Math.max(7, audioLevel * (height * 0.42)) : isListening ? 5 : 2;
      smoothAmpRef.current += (targetAmp - smoothAmpRef.current) * 0.25;
      const amplitude = smoothAmpRef.current;

      const waveColor = isSpeaking ? '#ef4444' : isListening ? '#22c55e' : '#38bdf8';
      phaseRef.current += isSpeaking ? 0.08 + audioLevel * 0.08 : 0.025;

      // 3. Draw primary glowing oscilloscope wave
      ctx.beginPath();
      ctx.lineWidth = isSpeaking ? 2.2 : 1.4;
      ctx.strokeStyle = waveColor;
      ctx.shadowBlur = isSpeaking ? 10 : 3;
      ctx.shadowColor = waveColor;

      for (let x = 0; x < width; x++) {
        const normX = x / width;
        const envelope = Math.sin(normX * Math.PI); // Pinches ends at 0
        const y1 = Math.sin(normX * 14 + phaseRef.current) * amplitude;
        const y2 = Math.sin(normX * 28 - phaseRef.current * 1.6) * (amplitude * 0.38);
        const y3 = Math.sin(normX * 6 + phaseRef.current * 0.4) * (amplitude * 0.22);
        const y = centerY + (y1 + y2 + y3) * envelope;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 4. Secondary harmonic reflection for speaking state
      if (isSpeaking) {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 130, 130, 0.35)';
        ctx.shadowBlur = 0;
        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);
          const y = centerY - (Math.sin(normX * 18 + phaseRef.current * 1.7) * amplitude * 0.55) * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 5. Digital Level Meter Ticks on bottom
      const meterBars = 24;
      const activeBars = Math.round((smoothAmpRef.current / (height * 0.42)) * meterBars);
      const barWidth = 3;
      const barGap = 3;
      const startX = width - (meterBars * (barWidth + barGap)) - 12;

      for (let b = 0; b < meterBars; b++) {
        const bx = startX + b * (barWidth + barGap);
        const isLit = b < activeBars;
        ctx.fillStyle = isLit 
          ? (b > meterBars * 0.8 ? '#ef4444' : b > meterBars * 0.5 ? '#f59e0b' : '#22c55e')
          : '#1a1d26';
        ctx.fillRect(bx, height - 10, barWidth, 4);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, audioLevel]);

  return (
    <div className="relative w-full h-16 bg-[#06070a] border border-[#1e2028] rounded-lg overflow-hidden flex items-center justify-center">
      {/* CRT Scanline overlay */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none" />
      
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />

      <div className="absolute top-1.5 left-2.5 text-[9px] font-mono tracking-widest text-zinc-600 uppercase flex items-center space-x-2 pointer-events-none">
        <span>ACOUSTIC SPECTRUM // 10.4 kHz</span>
        <span className="text-zinc-700">|</span>
        <span className={state === 'speaking' ? 'text-red-500' : 'text-zinc-600'}>
          {state.toUpperCase()}
        </span>
      </div>
    </div>
  );
};
