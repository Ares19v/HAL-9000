import React from 'react';
import { HalEye } from './HalEye';
import type { HalState, FrequencyBands } from '../types';

interface ConsolePanelProps {
  state: HalState;
  audioLevel: number;
  frequencyBands?: FrequencyBands;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({ state, audioLevel, frequencyBands }) => {
  return (
    <div className="relative w-[340px] sm:w-[380px] rounded-xl brushed-metal p-5 border-2 border-[#363a45] shadow-[0_25px_70px_rgba(0,0,0,0.98)] flex flex-col items-center select-none">
      
      {/* 4 Corner Precision Countersunk Hex Head Screws */}
      <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-[#1c1e24] border border-[#525663] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#090a0d] rotate-45 border-[0.5px] border-[#383c47] shadow-[inset_0_0_2px_#000]" />
      </div>
      <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-[#1c1e24] border border-[#525663] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#090a0d] rotate-45 border-[0.5px] border-[#383c47] shadow-[inset_0_0_2px_#000]" />
      </div>
      <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-[#1c1e24] border border-[#525663] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#090a0d] rotate-45 border-[0.5px] border-[#383c47] shadow-[inset_0_0_2px_#000]" />
      </div>
      <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-[#1c1e24] border border-[#525663] shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-[#090a0d] rotate-45 border-[0.5px] border-[#383c47] shadow-[inset_0_0_2px_#000]" />
      </div>

      {/* Top Authentic HAL 9000 Nameplate (Kubrick Screen-Accurate) */}
      <div className="w-full mb-4 flex justify-center">
        <div 
          className="relative px-8 py-2.5 rounded-[3px] border-2 border-[#3d4d6e] shadow-[0_4px_15px_rgba(0,0,0,0.9)] flex items-center space-x-3 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #0e1e3b 0%, #071020 55%, #030812 100%)',
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.4), inset 0 -1px 2px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.85)'
          }}
        >
          {/* Top Edge Gloss Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          
          <div className="flex items-baseline space-x-2.5">
            {/* "HAL" with iconic dot above "A" */}
            <div className="relative flex items-baseline">
              <span 
                className="text-white font-black text-[26px] tracking-[0.22em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                HAL
              </span>
              {/* Kubrick's iconic square dot above the "A" */}
              <div className="absolute top-1.5 left-[34px] w-1.5 h-1.5 bg-white shadow-[0_0_4px_#fff]" />
            </div>
            
            <span 
              className="text-[#5dade2] font-black text-[22px] tracking-[0.28em] drop-shadow-[0_0_8px_rgba(93,173,226,0.6)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              9000
            </span>
          </div>
        </div>
      </div>

      {/* Main Optical Fisheye Eye Unit */}
      <div className="my-1">
        <HalEye state={state} audioLevel={audioLevel} frequencyBands={frequencyBands} />
      </div>

      {/* Status LED Indicators with Realistic Bezel Insets & Halos */}
      <div className="w-full max-w-[280px] my-4 grid grid-cols-3 gap-2.5 text-center text-[10px] uppercase font-mono tracking-wider">
        <div className={`py-1.5 px-2 rounded-[3px] border transition-all duration-150 relative overflow-hidden ${
          state === 'listening' 
            ? 'border-green-400 bg-green-950/80 text-green-300 shadow-[0_0_14px_rgba(34,197,94,0.65)]' 
            : 'border-[#242730] bg-[#0b0c10] text-zinc-600'
        }`}>
          {state === 'listening' && (
            <div className="absolute inset-0 bg-green-400/10 pointer-events-none animate-pulse" />
          )}
          <span className="relative z-10 font-bold">LISTEN</span>
        </div>

        <div className={`py-1.5 px-2 rounded-[3px] border transition-all duration-150 relative overflow-hidden ${
          state === 'thinking' 
            ? 'border-amber-400 bg-amber-950/80 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.65)]' 
            : 'border-[#242730] bg-[#0b0c10] text-zinc-600'
        }`}>
          {state === 'thinking' && (
            <div className="absolute inset-0 bg-amber-400/10 pointer-events-none animate-pulse" />
          )}
          <span className="relative z-10 font-bold">PROCESS</span>
        </div>

        <div className={`py-1.5 px-2 rounded-[3px] border transition-all duration-150 relative overflow-hidden ${
          state === 'speaking' 
            ? 'border-red-500 bg-red-950/80 text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.75)]' 
            : 'border-[#242730] bg-[#0b0c10] text-zinc-600'
        }`}>
          {state === 'speaking' && (
            <div className="absolute inset-0 bg-red-500/10 pointer-events-none animate-pulse" />
          )}
          <span className="relative z-10 font-bold">TRANSMIT</span>
        </div>
      </div>

      {/* Recessed Perforated Metal Acoustic Speaker Grille */}
      <div 
        className="w-[280px] h-[110px] rounded-[4px] bg-[#08090c] border border-[#262833] p-3 relative overflow-hidden flex flex-col justify-between"
        style={{
          boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.9), inset 0 -1px 2px rgba(255,255,255,0.06), 0 2px 4px rgba(0,0,0,0.6)'
        }}
      >
        {/* Precision Drilled Grille Hole Matrix */}
        <div 
          className="w-full h-full opacity-90"
          style={{
            backgroundImage: 'radial-gradient(#22242e 26%, transparent 29%)',
            backgroundSize: '8.5px 8.5px',
            backgroundColor: '#07080a'
          }}
        />
        {/* Acoustic cloth backing gradient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* Bottom Sub-bezel Spec Plate */}
      <div className="mt-3.5 text-[9px] text-zinc-500 font-mono tracking-[0.22em] uppercase text-center">
        SYSTEM 9000 // URBANA, ILL. // S/N 9001-ALPHA
      </div>
    </div>
  );
};
