import React, { useEffect, useRef, useState } from 'react';
import type { HalState } from '../types';
import { Activity, BarChart2, Disc } from 'lucide-react';

interface AudioWaveformProps {
  state: HalState;
  audioLevel: number;
  getFrequencyData?: () => Uint8Array;
}

type VisualizerMode = 'oscilloscope' | 'spectrum' | 'polar';

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  state,
  audioLevel,
  getFrequencyData
}) => {
  const [mode, setMode] = useState<VisualizerMode>('oscilloscope');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef<number>(0);
  const smoothAmpRef = useRef<number>(0);
  const peakLevelsRef = useRef<number[]>(new Array(32).fill(0));
  const polarAngleRef = useRef<number>(0);

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

      const isSpeaking = state === 'speaking';
      const isListening = state === 'listening';
      const targetAmp = isSpeaking ? Math.max(7, audioLevel * (height * 0.42)) : isListening ? 5 : 2;
      smoothAmpRef.current += (targetAmp - smoothAmpRef.current) * 0.25;
      const amplitude = smoothAmpRef.current;
      const waveColor = isSpeaking ? '#ef4444' : isListening ? '#22c55e' : '#38bdf8';

      // Read raw frequency buffer if available
      const freqData = getFrequencyData ? getFrequencyData() : null;

      // ==========================================
      // MODE 1: DUAL-TRACE PHOSPHOR OSCILLOSCOPE
      // ==========================================
      if (mode === 'oscilloscope') {
        // CRT grid background
        ctx.strokeStyle = '#10131c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        for (let x = 0; x < width; x += 36) {
          ctx.moveTo(x, centerY - 3);
          ctx.lineTo(x, centerY + 3);
        }
        ctx.stroke();

        phaseRef.current += isSpeaking ? 0.08 + audioLevel * 0.08 : 0.025;

        // Primary phosphor trace
        ctx.beginPath();
        ctx.lineWidth = isSpeaking ? 2.2 : 1.4;
        ctx.strokeStyle = waveColor;
        ctx.shadowBlur = isSpeaking ? 12 : 4;
        ctx.shadowColor = waveColor;

        for (let x = 0; x < width; x++) {
          const normX = x / width;
          const envelope = Math.sin(normX * Math.PI);
          const y1 = Math.sin(normX * 14 + phaseRef.current) * amplitude;
          const y2 = Math.sin(normX * 28 - phaseRef.current * 1.6) * (amplitude * 0.38);
          const y3 = Math.sin(normX * 6 + phaseRef.current * 0.4) * (amplitude * 0.22);
          const y = centerY + (y1 + y2 + y3) * envelope;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Secondary harmonic trace for speech
        if (isSpeaking) {
          ctx.beginPath();
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255, 140, 140, 0.4)';
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
      }

      // ==========================================
      // MODE 2: 32-BAND VACUUM FLUORESCENT BARS
      // ==========================================
      else if (mode === 'spectrum') {
        const numBars = 32;
        const totalBarSpace = width - 40;
        const barWidth = Math.max(3, (totalBarSpace / numBars) - 3);
        const startX = 20;

        for (let i = 0; i < numBars; i++) {
          let val = 0;
          if (freqData && freqData.length > 0) {
            // Map 32 bars across frequency spectrum
            const binIdx = Math.min(freqData.length - 1, Math.floor((i / numBars) * freqData.length * 0.8));
            val = freqData[binIdx] / 255.0;
          } else {
            val = (smoothAmpRef.current / (height * 0.42)) * (0.4 + 0.6 * Math.sin(i * 0.4 + Date.now() * 0.005));
          }

          const barHeight = Math.max(3, val * (height - 18));
          const bx = startX + i * (barWidth + 3);
          const by = height - 8 - barHeight;

          // Peak hold decay
          if (barHeight > peakLevelsRef.current[i]) {
            peakLevelsRef.current[i] = barHeight;
          } else {
            peakLevelsRef.current[i] = Math.max(0, peakLevelsRef.current[i] - 0.7);
          }

          // Gradient color: Green bottom, Amber mid, Red top
          const grad = ctx.createLinearGradient(0, height - 8, 0, height - 8 - barHeight);
          if (isSpeaking) {
            grad.addColorStop(0, '#ef4444');
            grad.addColorStop(0.7, '#f97316');
            grad.addColorStop(1, '#ffedd5');
          } else {
            grad.addColorStop(0, '#22c55e');
            grad.addColorStop(0.65, '#eab308');
            grad.addColorStop(1, '#ef4444');
          }

          ctx.fillStyle = grad;
          ctx.fillRect(bx, by, barWidth, barHeight);

          // Peak dot
          if (peakLevelsRef.current[i] > 3) {
            ctx.fillStyle = isSpeaking ? '#ffffff' : '#fef08a';
            ctx.fillRect(bx, height - 8 - peakLevelsRef.current[i], barWidth, 1.5);
          }
        }
      }

      // ==========================================
      // MODE 3: CIRCULAR POLAR RADAR / AZIMUTH SCOPE
      // ==========================================
      else if (mode === 'polar') {
        const centerX = width / 2;
        polarAngleRef.current += isSpeaking ? 0.05 : 0.02;

        // Polar concentric range rings
        ctx.strokeStyle = '#141824';
        ctx.lineWidth = 1;
        [15, 26, 38].forEach(r => {
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(centerX - 48, centerY);
        ctx.lineTo(centerX + 48, centerY);
        ctx.moveTo(centerX, centerY - 28);
        ctx.lineTo(centerX, centerY + 28);
        ctx.stroke();

        // Audio reactive concentric wave
        const rippleR = Math.min(38, 12 + smoothAmpRef.current * 1.6);
        ctx.strokeStyle = waveColor;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = waveColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, rippleR, 0, Math.PI * 2);
        ctx.stroke();

        // Rotating radar azimuth sweep line
        const sweepX = centerX + Math.cos(polarAngleRef.current) * 44;
        const sweepY = centerY + Math.sin(polarAngleRef.current) * 28;
        ctx.strokeStyle = isSpeaking ? 'rgba(239, 68, 68, 0.7)' : 'rgba(34, 197, 94, 0.7)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(sweepX, sweepY);
        ctx.stroke();

        // Readout text on sides
        ctx.fillStyle = '#6b7280';
        ctx.font = '9px monospace';
        ctx.fillText('AZ: 142.3°', centerX - 120, centerY + 3);
        ctx.fillText('EL: -18.2°', centerX + 75, centerY + 3);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, audioLevel, mode, getFrequencyData]);

  return (
    <div className="relative w-full h-[72px] bg-[#06070a] border border-[#202330] rounded-xl overflow-hidden flex flex-col justify-between shadow-[0_10px_25px_rgba(0,0,0,0.8)] select-none">
      
      {/* CRT Scanline Overlay */}
      <div className="absolute inset-0 crt-scanlines pointer-events-none" />

      {/* Top Header Strip with Mode Switchers */}
      <div className="relative z-10 px-3 py-1 bg-[#090b10]/90 border-b border-[#181a24] flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center space-x-2 text-zinc-500 uppercase tracking-wider">
          <span className="text-zinc-400 font-bold">ACOUSTIC BUS</span>
          <span className="text-zinc-700">|</span>
          <span className={state === 'speaking' ? 'text-red-400 font-bold' : 'text-zinc-500'}>
            {state.toUpperCase()}
          </span>
        </div>

        {/* Tactile Mode Selectors */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setMode('oscilloscope')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-[3px] text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
              mode === 'oscilloscope'
                ? 'bg-zinc-800 text-cyan-300 border border-cyan-500/80 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                : 'bg-[#10121a] text-zinc-500 hover:text-zinc-300 border border-[#222533]'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>WAVE</span>
          </button>

          <button
            onClick={() => setMode('spectrum')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-[3px] text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
              mode === 'spectrum'
                ? 'bg-zinc-800 text-amber-300 border border-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                : 'bg-[#10121a] text-zinc-500 hover:text-zinc-300 border border-[#222533]'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>SPECTRUM</span>
          </button>

          <button
            onClick={() => setMode('polar')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-[3px] text-[9px] font-mono font-bold tracking-widest uppercase transition-all cursor-pointer ${
              mode === 'polar'
                ? 'bg-zinc-800 text-green-300 border border-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                : 'bg-[#10121a] text-zinc-500 hover:text-zinc-300 border border-[#222533]'
            }`}
          >
            <Disc className="w-3 h-3" />
            <span>RADAR</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Display */}
      <div className="relative flex-1 w-full overflow-hidden">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block"
        />
      </div>

    </div>
  );
};
