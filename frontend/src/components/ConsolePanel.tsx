import React from 'react';
import { HalEye } from './HalEye';
import type { HalState, FrequencyBands } from '../types';

interface ConsolePanelProps {
  state: HalState;
  audioLevel: number;
  frequencyBands?: FrequencyBands;
  opticalSensorActive?: boolean;
  onToggleOpticalSensor?: () => void;
}

export const ConsolePanel: React.FC<ConsolePanelProps> = ({
  state,
  audioLevel,
  frequencyBands,
  opticalSensorActive,
  onToggleOpticalSensor
}) => {
  return (
    <div className="relative w-[360px] sm:w-[410px] rounded-2xl brushed-metal p-6 border-2 border-[#383d4c] shadow-[0_30px_90px_rgba(0,0,0,0.98)] flex flex-col items-center select-none">
      
      {/* 4 Corner Precision Countersunk Hex Head Screws with Micro-Bevels */}
      <div className="absolute top-3.5 left-3.5 w-4.5 h-4.5 rounded-full bg-[#1e2028] border border-[#585e70] shadow-inner flex items-center justify-center">
        <div className="w-2 h-2 bg-[#090a0d] rotate-45 border-[0.5px] border-[#3f4350] shadow-[inset_0_0_2px_#000]" />
      </div>
      <div className="absolute top-3.5 right-3.5 w-4.5 h-4.5 rounded-full bg-[#1e2028] border border-[#585e70] shadow-inner flex items-center justify-center">
        <div className="w-2 h-2 bg-[#090a0d] rotate-45 border-[0.5px] border-[#3f4350] shadow-[inset_0_0_2px_#000]" />
      </div>
      <div className="absolute bottom-3.5 left-3.5 w-4.5 h-4.5 rounded-full bg-[#1e2028] border border-[#585e70] shadow-inner flex items-center justify-center">
        <div className="w-2 h-2 bg-[#090a0d] rotate-45 border-[0.5px] border-[#3f4350] shadow-[inset_0_0_2px_#000]" />
      </div>
      <div className="absolute bottom-3.5 right-3.5 w-4.5 h-4.5 rounded-full bg-[#1e2028] border border-[#585e70] shadow-inner flex items-center justify-center">
        <div className="w-2 h-2 bg-[#090a0d] rotate-45 border-[0.5px] border-[#3f4350] shadow-[inset_0_0_2px_#000]" />
      </div>

      {/* Top Authentic HAL 9000 Nameplate (Kubrick Screen-Accurate) */}
      <div className="w-full mb-4 flex justify-center">
        <div 
          className="relative px-10 py-3 rounded-[4px] border-2 border-[#3d4d6e] shadow-[0_6px_20px_rgba(0,0,0,0.95)] flex items-center space-x-3.5 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #102142 0%, #081328 55%, #030814 100%)',
            boxShadow: 'inset 0 1.5px 1.5px rgba(255, 255, 255, 0.45), inset 0 -1.5px 2px rgba(0, 0, 0, 0.85), 0 5px 15px rgba(0, 0, 0, 0.9)'
          }}
        >
          {/* Top Edge Gloss Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          
          <div className="flex items-baseline space-x-3">
            {/* "HAL" with iconic dot above "A" */}
            <div className="relative flex items-baseline">
              <span 
                className="text-white font-extrabold text-[28px] tracking-[0.24em] drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]"
                style={{ fontFamily: 'var(--font-brand)' }}
              >
                HAL
              </span>
              {/* Kubrick's iconic square dot above the "A" */}
              <div className="absolute top-2 left-[37px] w-2 h-2 bg-white shadow-[0_0_5px_#fff]" />
            </div>
            
            <span 
              className="text-[#5dade2] font-black text-[24px] tracking-[0.32em] drop-shadow-[0_0_10px_rgba(93,173,226,0.7)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              9000
            </span>
          </div>
        </div>
      </div>

      {/* Main Optical Fisheye Eye Unit */}
      <div className="my-1.5 cursor-pointer hover:scale-[1.01] transition-transform duration-300">
        <HalEye state={state} audioLevel={audioLevel} frequencyBands={frequencyBands} />
      </div>

      {/* Aerospace Backlit Annunciator Status Bank */}
      <div className="w-full max-w-[310px] my-4 grid grid-cols-3 gap-2.5 text-center text-[10px] uppercase font-mono tracking-widest">
        <div className={`py-2 px-2.5 rounded-[4px] border annunciator-btn transition-all duration-150 relative overflow-hidden ${
          state === 'listening' 
            ? 'border-green-400 bg-green-950/90 text-green-300 shadow-[0_0_18px_rgba(34,197,94,0.7)]' 
            : 'border-[#272a35] bg-[#0c0e14] text-zinc-600'
        }`}>
          {state === 'listening' && (
            <div className="absolute inset-0 bg-green-400/15 pointer-events-none animate-pulse" />
          )}
          <span className="relative z-10 font-extrabold">LISTEN</span>
        </div>

        <div className={`py-2 px-2.5 rounded-[4px] border annunciator-btn transition-all duration-150 relative overflow-hidden ${
          state === 'thinking' 
            ? 'border-amber-400 bg-amber-950/90 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.7)]' 
            : 'border-[#272a35] bg-[#0c0e14] text-zinc-600'
        }`}>
          {state === 'thinking' && (
            <div className="absolute inset-0 bg-amber-400/15 pointer-events-none animate-pulse" />
          )}
          <span className="relative z-10 font-extrabold">PROCESS</span>
        </div>

        <div className={`py-2 px-2.5 rounded-[4px] border annunciator-btn transition-all duration-150 relative overflow-hidden ${
          state === 'speaking' 
            ? 'border-red-500 bg-red-950/90 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.85)]' 
            : 'border-[#272a35] bg-[#0c0e14] text-zinc-600'
        }`}>
          {state === 'speaking' && (
            <div className="absolute inset-0 bg-red-500/15 pointer-events-none animate-pulse" />
          )}
          <span className="relative z-10 font-extrabold">TRANSMIT</span>
        </div>
      </div>

      {/* Recessed Perforated Metal Acoustic Speaker Grille */}
      <div 
        className="w-[310px] h-[105px] rounded-[5px] bg-[#07080b] border border-[#2c2f3d] p-3 relative overflow-hidden flex flex-col justify-between"
        style={{
          boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.95), inset 0 -1px 2px rgba(255,255,255,0.08), 0 3px 6px rgba(0,0,0,0.7)'
        }}
      >
        {/* Precision Drilled Grille Hole Matrix */}
        <div 
          className="w-full h-full opacity-95"
          style={{
            backgroundImage: 'radial-gradient(#262835 28%, transparent 32%)',
            backgroundSize: '9px 9px',
            backgroundColor: '#06070a'
          }}
        />
        {/* Acoustic cloth backing gradient shadow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 pointer-events-none" />
      </div>

      {/* Optical Sensor Activation Switch */}
      <div className="w-[310px] mt-3.5 flex items-center justify-between">
        <button
          onClick={onToggleOpticalSensor}
          className={`w-full py-2 px-3 rounded-[4px] border text-[10px] font-mono font-bold tracking-[0.18em] uppercase transition-all duration-200 flex items-center justify-center space-x-2.5 cursor-pointer ${
            opticalSensorActive
              ? 'bg-red-950/90 border-red-500 text-red-200 shadow-[0_0_18px_rgba(239,68,68,0.6)]'
              : 'bg-[#12141d] hover:bg-[#1a1d2a] border-[#2e3242] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${opticalSensorActive ? 'bg-red-500 animate-ping' : 'bg-zinc-600'}`} />
          <span>{opticalSensorActive ? 'OPTICAL SENSOR ENGAGED' : 'ENGAGE OPTICAL SENSOR [CAM-01]'}</span>
        </button>
      </div>

      {/* Bottom Sub-bezel Spec Plate */}
      <div className="mt-3.5 text-[9px] text-zinc-500 font-mono tracking-[0.26em] uppercase text-center">
        SYSTEM 9000 // URBANA, ILL. // S/N 9001-ALPHA
      </div>
    </div>
  );
};
