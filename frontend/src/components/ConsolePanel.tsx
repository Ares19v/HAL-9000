import React from 'react';
import { HalEye } from './HalEye';
import type { HalState } from '../types';

interface ConsolePanelProps {
  state: HalState;
  audioLevel: number;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ state, audioLevel }) => {
  return (
    <div className="relative w-[340px] sm:w-[380px] rounded-xl brushed-metal p-5 border-2 border-[#333640] shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col items-center select-none">
      
      {/* 4 Corner Precision Allen Screws */}
      <div className="absolute top-3 left-3 w-3.5 h-3.5 rounded-full bg-[#1c1d22] border border-[#484c59] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#0b0c0e] rotate-45 border-[0.5px] border-[#30333d]" />
      </div>
      <div className="absolute top-3 right-3 w-3.5 h-3.5 rounded-full bg-[#1c1d22] border border-[#484c59] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#0b0c0e] rotate-45 border-[0.5px] border-[#30333d]" />
      </div>
      <div className="absolute bottom-3 left-3 w-3.5 h-3.5 rounded-full bg-[#1c1d22] border border-[#484c59] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#0b0c0e] rotate-45 border-[0.5px] border-[#30333d]" />
      </div>
      <div className="absolute bottom-3 right-3 w-3.5 h-3.5 rounded-full bg-[#1c1d22] border border-[#484c59] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#0b0c0e] rotate-45 border-[0.5px] border-[#30333d]" />
      </div>

      {/* Top Authentic HAL 9000 Nameplate */}
      <div className="w-full mb-5 flex justify-center">
        <div 
          className="relative px-7 py-2.5 rounded-sm border-2 border-[#2b3a55] shadow-lg flex items-center space-x-3 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0c182e 0%, #060b16 100%)',
            boxShadow: 'inset 0 1px 1.5px rgba(255, 255, 255, 0.3), 0 4px 10px rgba(0, 0, 0, 0.8)'
          }}
        >
          {/* Subtle blue illumination on the badge border */}
          <div className="absolute inset-0 bg-blue-500/8 pointer-events-none" />
          
          <div className="flex items-baseline space-x-2.5">
            <span 
              className="text-white font-black text-2xl tracking-[0.22em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              HAL
            </span>
            <span 
              className="text-blue-400 font-extrabold text-xl tracking-[0.28em] drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              9000
            </span>
          </div>
        </div>
      </div>

      {/* Main Optical Fisheye Eye Unit */}
      <div className="my-1">
        <HalEye state={state} audioLevel={audioLevel} />
      </div>

      {/* Status LED Indicators with Realistic Halos */}
      <div className="w-full max-w-[270px] my-4 grid grid-cols-3 gap-2 text-center text-[10px] uppercase font-mono tracking-wider">
        <div className={`py-1.5 px-2 rounded border transition-all duration-150 ${
          state === 'listening' 
            ? 'border-green-500 bg-green-950/70 text-green-300 shadow-[0_0_12px_rgba(34,197,94,0.6)]' 
            : 'border-zinc-800 bg-[#0c0d12] text-zinc-600'
        }`}>
          LISTEN
        </div>
        <div className={`py-1.5 px-2 rounded border transition-all duration-150 ${
          state === 'thinking' 
            ? 'border-amber-500 bg-amber-950/70 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]' 
            : 'border-zinc-800 bg-[#0c0d12] text-zinc-600'
        }`}>
          PROCESS
        </div>
        <div className={`py-1.5 px-2 rounded border transition-all duration-150 ${
          state === 'speaking' 
            ? 'border-red-500 bg-red-950/70 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.7)]' 
            : 'border-zinc-800 bg-[#0c0d12] text-zinc-600'
        }`}>
          TRANSMIT
        </div>
      </div>

      {/* Perforated Metal Acoustic Speaker Grille */}
      <div className="w-[270px] h-[105px] rounded-md bg-[#090a0d] border border-[#24262e] p-3 shadow-inner relative overflow-hidden flex flex-col justify-between">
        {/* Deep Drilled Grille Hole Matrix */}
        <div 
          className="w-full h-full opacity-90"
          style={{
            backgroundImage: 'radial-gradient(#1f2129 25%, transparent 28%)',
            backgroundSize: '8.5px 8.5px',
            backgroundColor: '#07080a'
          }}
        />
        {/* Internal acoustic backing shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 pointer-events-none" />
      </div>

      {/* Bottom Sub-bezel Spec Tag */}
      <div className="mt-3.5 text-[9px] text-zinc-500 font-mono tracking-[0.2em] uppercase">
        SYSTEM 9000 // URBANA, ILL. // S/N 9001-ALPHA
      </div>
    </div>
  );
};
