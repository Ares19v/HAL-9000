import React from 'react';
import { HalEye } from './HalEye';
import type { HalState } from '../types';

interface ConsolePanelProps {
  state: HalState;
  audioLevel: number;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ state, audioLevel }) => {
  return (
    <div className="relative w-[340px] sm:w-[380px] rounded-lg brushed-metal p-5 border border-[#3e414c] shadow-2xl flex flex-col items-center select-none">
      
      {/* 4 Corner Allen Screws / Industrial Fasteners */}
      <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-[#1e2024] border border-[#525663] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#0e1012] rotate-45" />
      </div>
      <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-[#1e2024] border border-[#525663] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#0e1012] rotate-45" />
      </div>
      <div className="absolute bottom-3 left-3 w-3 h-3 rounded-full bg-[#1e2024] border border-[#525663] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#0e1012] rotate-45" />
      </div>
      <div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-[#1e2024] border border-[#525663] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#0e1012] rotate-45" />
      </div>

      {/* Top Authentic HAL 9000 Nameplate */}
      <div className="w-full mb-5 flex justify-center">
        <div 
          className="relative px-6 py-2 rounded border border-[#2d3b55] shadow-md flex items-center space-x-3 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0b1528 0%, #060b14 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 2px 6px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Subtle blue edge glow */}
          <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
          
          <div className="flex items-baseline space-x-2">
            <span 
              className="text-white font-black text-2xl tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              HAL
            </span>
            <span 
              className="text-blue-400 font-extrabold text-xl tracking-[0.25em]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              9000
            </span>
          </div>
        </div>
      </div>

      {/* Main Optical Eye Unit */}
      <div className="my-2">
        <HalEye state={state} audioLevel={audioLevel} />
      </div>

      {/* Status LED Indicators */}
      <div className="w-full max-w-[260px] my-4 grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-mono tracking-wider">
        <div className={`py-1 px-1.5 rounded border transition-colors ${
          state === 'listening' 
            ? 'border-green-500/80 bg-green-950/60 text-green-300 shadow-[0_0_8px_rgba(34,197,94,0.4)]' 
            : 'border-zinc-800 bg-zinc-950/40 text-zinc-600'
        }`}>
          LISTEN
        </div>
        <div className={`py-1 px-1.5 rounded border transition-colors ${
          state === 'thinking' 
            ? 'border-yellow-500/80 bg-yellow-950/60 text-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]' 
            : 'border-zinc-800 bg-zinc-950/40 text-zinc-600'
        }`}>
          PROCESS
        </div>
        <div className={`py-1 px-1.5 rounded border transition-colors ${
          state === 'speaking' 
            ? 'border-red-500/80 bg-red-950/60 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
            : 'border-zinc-800 bg-zinc-950/40 text-zinc-600'
        }`}>
          TRANSMIT
        </div>
      </div>

      {/* Perforated Metal Speaker Grille */}
      <div className="w-[260px] h-[100px] rounded bg-[#0d0e11] border border-[#272930] p-2.5 shadow-inner relative overflow-hidden flex flex-col justify-between">
        {/* Grille Hole Matrix */}
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(#20222a 22%, transparent 25%)',
            backgroundSize: '9px 9px',
            backgroundColor: '#0a0b0d'
          }}
        />
        {/* Subtle acoustic cloth backing highlight */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-950/5 to-transparent pointer-events-none" />
      </div>

      {/* Bottom Sub-bezel Spec Tag */}
      <div className="mt-3 text-[9px] text-zinc-500 font-mono tracking-widest uppercase">
        SYSTEM 9000 // URBANA, ILL. // S/N 9001-ALPHA
      </div>
    </div>
  );
};
