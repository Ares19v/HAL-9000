import React from 'react';
import { Mic, MicOff, Square, Radio } from 'lucide-react';
import type { HalState } from '../types';

interface VoiceControlProps {
  halState: HalState;
  isListening: boolean;
  vadEnabled: boolean;
  supported: boolean;
  onToggleListening: () => void;
  onToggleVad: () => void;
  onInterrupt: () => void;
  onBlip?: () => void;
}

export const VoiceControl: React.FC<VoiceControlProps> = ({
  halState,
  isListening,
  vadEnabled,
  supported,
  onToggleListening,
  onToggleVad,
  onInterrupt,
  onBlip
}) => {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3.5 p-4 bg-[#08090e] border border-[#232736] rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] select-none">
      
      {/* Microphone Status & Push-To-Talk Toggle */}
      <div className="flex items-center space-x-3.5">
        <button
          onClick={() => {
            if (onBlip) onBlip();
            onToggleListening();
          }}
          className={`flex items-center space-x-2.5 px-6 py-3 rounded-[5px] font-mono text-xs font-extrabold tracking-widest uppercase transition-all duration-200 cursor-pointer shadow-xl ${
            isListening 
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.8)] border border-red-400 scale-[1.02]' 
              : 'bg-[#151722] hover:bg-[#1d202e] text-zinc-200 border border-[#2e3244] hover:border-zinc-500 hover:shadow-[0_0_12px_rgba(255,255,255,0.05)]'
          }`}
        >
          {isListening ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white shadow-[0_0_6px_#fff]" />
              </span>
              <Mic className="w-4 h-4 text-white animate-bounce" />
              <span className="tracking-[0.2em]">RECORDING // [SPACE] TO SEND</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-zinc-400" />
              <span className="tracking-[0.2em]">PUSH TO TALK [SPACE]</span>
            </>
          )}
        </button>

        {/* Hands-Free VAD Mode Toggle */}
        <button
          onClick={() => {
            if (onBlip) onBlip();
            onToggleVad();
          }}
          className={`flex items-center space-x-2 px-4 py-3 rounded-[5px] border text-xs font-mono font-extrabold tracking-wider transition-all duration-200 cursor-pointer ${
            vadEnabled
              ? 'border-cyan-400 bg-cyan-950/70 text-cyan-200 shadow-[0_0_18px_rgba(6,182,212,0.5)]'
              : 'border-[#242838] bg-[#10121b] text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${vadEnabled ? 'text-cyan-300 animate-spin' : 'text-zinc-500'}`} />
          <span>HANDS-FREE VAD: {vadEnabled ? 'ENGAGED' : 'STANDBY'}</span>
        </button>
      </div>

      {/* Interrupt Button (Active whenever HAL is speaking) */}
      <div className="flex items-center space-x-3">
        {halState === 'speaking' && (
          <button
            onClick={() => {
              if (onBlip) onBlip();
              onInterrupt();
            }}
            className="flex items-center space-x-2 px-5 py-3 rounded-[5px] bg-amber-950/95 hover:bg-amber-900 border-2 border-amber-500 text-amber-200 font-mono text-xs font-extrabold tracking-widest uppercase transition-all shadow-[0_0_22px_rgba(245,158,11,0.7)] cursor-pointer animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>INTERRUPT HAL SPEECH [ESC]</span>
          </button>
        )}

        {!supported && (
          <div className="text-[10px] text-amber-400 font-mono tracking-wider">
            *Web Speech unsupported on this browser. Use teletype input.
          </div>
        )}
      </div>

    </div>
  );
};
