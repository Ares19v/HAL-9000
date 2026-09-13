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
    <div className="w-full flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0a0b0f] border border-[#20222a] rounded-lg">
      
      {/* Microphone Status & Push-To-Talk Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => {
            if (onBlip) onBlip();
            onToggleListening();
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase transition-all shadow-lg ${
            isListening 
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' 
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
          }`}
        >
          {isListening ? (
            <>
              <Mic className="w-4 h-4 text-white animate-bounce" />
              <span>TRANSMITTING AUDIO</span>
            </>
          ) : (
            <>
              <MicOff className="w-4 h-4 text-zinc-400" />
              <span>ENABLE MICROPHONE</span>
            </>
          )}
        </button>

        {/* Hands-Free VAD Mode */}
        <button
          onClick={() => {
            if (onBlip) onBlip();
            onToggleVad();
          }}
          className={`flex items-center space-x-1.5 px-3 py-2 rounded border text-xs font-mono transition-colors ${
            vadEnabled
              ? 'border-cyan-500/80 bg-cyan-950/50 text-cyan-300'
              : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:text-zinc-400'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${vadEnabled ? 'text-cyan-400 animate-spin' : 'text-zinc-600'}`} />
          <span>HANDS-FREE VAD: {vadEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Interrupt Button (Active whenever HAL is speaking) */}
      <div className="flex items-center space-x-2">
        {halState === 'speaking' && (
          <button
            onClick={() => {
              if (onBlip) onBlip();
              onInterrupt();
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-200 font-mono text-xs font-bold transition-colors shadow-md animate-pulse"
          >
            <Square className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>INTERRUPT HAL</span>
          </button>
        )}

        {!supported && (
          <div className="text-[10px] text-amber-500 font-mono">
            *Web Speech unsupported on this browser. Use teletype input.
          </div>
        )}
      </div>

    </div>
  );
};
