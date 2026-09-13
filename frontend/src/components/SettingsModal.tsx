import React from 'react';
import type { AppSettings } from '../types';
import { X, Sliders, Volume2, Key, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onBlip?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onBlip
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-md bg-[#0e1017] border border-[#2b2e3d] rounded-xl shadow-2xl p-5 font-mono text-xs text-zinc-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2 text-red-400 font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>HAL 9000 // SYSTEM CONFIGURATION</span>
          </div>
          <button 
            onClick={() => {
              if (onBlip) onBlip();
              onClose();
            }}
            className="text-zinc-500 hover:text-white p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          
          {/* Audio & Ambient Atmosphere */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-zinc-400 font-bold uppercase text-[11px]">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Acoustics & Environmental Atmosphere</span>
            </div>

            <label className="flex items-center justify-between p-2 rounded bg-[#151722] border border-zinc-800 cursor-pointer">
              <span className="text-zinc-300">Discovery One Cabin Air Hum (60Hz Sub-bass)</span>
              <input
                type="checkbox"
                checked={settings.ambientHum}
                onChange={(e) => onUpdateSettings({ ambientHum: e.target.checked })}
                className="w-4 h-4 accent-red-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 rounded bg-[#151722] border border-zinc-800 cursor-pointer">
              <span className="text-zinc-300">Console Relay Switch Sound Effects</span>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                className="w-4 h-4 accent-red-600 rounded"
              />
            </label>
          </div>

          {/* Voice Model Selection */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase">HAL Vocal Timbre</label>
            <select
              value={settings.voice}
              onChange={(e) => onUpdateSettings({ voice: e.target.value })}
              className="w-full bg-[#151722] border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:outline-none focus:border-red-500"
            >
              <option value="en-US-ChristopherNeural">Christopher Neural (Calm Baritone - Douglas Rain Style)</option>
              <option value="en-US-GuyNeural">Guy Neural (Deep Measured Resonant)</option>
              <option value="en-US-BrianNeural">Brian Neural (Articulate Clear)</option>
            </select>
          </div>

          {/* LLM Engine Acceleration */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <div className="flex items-center space-x-1.5 text-zinc-400 font-bold uppercase text-[11px]">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Low-Latency Cognitive Engine (Optional)</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-normal">
              *By default, the built-in procedural HAL cognitive engine operates instantly with zero keys required. Adding keys activates live dynamic reasoning.
            </p>

            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="flex items-center space-x-1 text-cyan-400">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span className="font-bold">Groq API Key (Fastest: ~150ms TTFT)</span>
                  </span>
                  <span className="text-[9px] text-zinc-500">Recommended</span>
                </div>
                <input
                  type="password"
                  value={settings.groqKey}
                  onChange={(e) => onUpdateSettings({ groqKey: e.target.value })}
                  placeholder="gsk_..."
                  className="w-full bg-[#151722] border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <div className="text-[10px] text-zinc-400 mb-1 font-bold">OpenAI API Key</div>
                <input
                  type="password"
                  value={settings.openaiKey}
                  onChange={(e) => onUpdateSettings({ openaiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-[#151722] border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <div className="text-[10px] text-zinc-400 mb-1 font-bold">Google Gemini API Key</div>
                <input
                  type="password"
                  value={settings.geminiKey}
                  onChange={(e) => onUpdateSettings({ geminiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#151722] border border-zinc-800 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              if (onBlip) onBlip();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-colors"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
