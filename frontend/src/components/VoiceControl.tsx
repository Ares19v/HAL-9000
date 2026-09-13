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
    <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#090a0f] border border-[#222530] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] select-none">
      
      {/* Microphone Status & Push-To-Talk Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => {
            if (onBlip) onBlip();
            onToggleListening();
          }}
          className={`flex items-center space-x-2 px-5 py-2.5 rounded-[4px] font-mono text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer shadow-lg ${
            isListening 
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.7)] border border-red-400' 
              : 'bg-[#151720] hover:bg-[#1e212d] text-zinc-300 border border-[#2c303f] hover:border-zinc-600'
          }`}
        >
          {isListening ? (
            <>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <Mic className="w-4 h-4 text-white animate-bounce" />
              <span className="tracking-[0.15em]">RECORDING // [SPACE] TO SEND</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-zinc-400" />
              <span className="tracking-[0.15em]">PUSH TO TALK [SPACE]</span>
            </>
          )}
        </button>

        {/* Hands-Free VAD Mode Toggle */}
        <button
          onClick={() => {
            if (onBlip) onBlip();
            onToggleVad();
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-[4px] border text-xs font-mono font-bold tracking-wider transition-all duration-200 cursor-pointer ${
            vadEnabled
              ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.45)]'
              : 'border-[#242733] bg-[#12141c] text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${vadEnabled ? 'text-cyan-300 animate-spin' : 'text-zinc-600'}`} />
          <span>HANDS-FREE VAD: {vadEnabled ? 'ACTIVE' : 'STANDBY'}</span>
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
            className="flex items-center space-x-2 px-4 py-2.5 rounded-[4px] bg-amber-950/90 hover:bg-amber-900 border-2 border-amber-500 text-amber-200 font-mono text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_18px_rgba(245,158,11,0.6)] cursor-pointer animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>INTERRUPT HAL SPEECH</span>
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
