import React, { useState } from 'react';
import type { AppSettings } from '../types';
import { X, Sliders, Volume2, Key, Zap, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTestGroq = async () => {
    if (!settings.groqKey) {
      setTestStatus("Enter a Groq key first.");
      return;
    }
    setTesting(true);
    setTestStatus("Testing key with LLaMA 3.3 70B...");
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5
        })
      });
      if (res.ok) {
        setTestStatus("SUCCESS: Connected to LLaMA 3.3 70B (300 t/s)!");
      } else {
        const err = await res.json().catch(() => ({}));
        setTestStatus(`ERROR: ${err.error?.message || "Invalid API key"}`);
      }
    } catch (e: any) {
      setTestStatus(`NETWORK ERROR: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg bg-[#0c0e14] border-2 border-[#2f3342] rounded-xl shadow-[0_25px_80px_rgba(0,0,0,0.98)] p-6 font-mono text-xs text-zinc-300">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#202330]">
          <div className="flex items-center space-x-2.5 text-red-400 font-bold uppercase tracking-[0.18em]">
            <Sliders className="w-4 h-4 text-red-500" />
            <span className="text-sm">SYSTEM CONFIGURATION // DISCOVERY ONE</span>
          </div>
          <button 
            onClick={() => {
              if (onBlip) onBlip();
              onClose();
            }}
            className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
          
          {/* Acoustics & Environmental Section */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
              <Volume2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Acoustics & Environmental Atmosphere</span>
            </div>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#12141d] border border-[#222533] cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <div className="font-bold text-zinc-200">Discovery One Cabin Air Hum</div>
                <div className="text-[10px] text-zinc-500">58Hz turbine + 5.2 RPM centrifuge rotation LFO</div>
              </div>
              <input
                type="checkbox"
                checked={settings.ambientHum}
                onChange={(e) => onUpdateSettings({ ambientHum: e.target.checked })}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#12141d] border border-[#222533] cursor-pointer hover:border-zinc-700 transition-colors">
              <div>
                <div className="font-bold text-zinc-200">Console Relay Switch Sound Effects</div>
                <div className="text-[10px] text-zinc-500">Acoustic relay blip when pressing buttons</div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => onUpdateSettings({ soundEffects: e.target.checked })}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Voice Model Selection */}
          <div className="space-y-1.5 pt-2 border-t border-[#1c1f2b]">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">HAL Vocal Timbre & Cadence</label>
            <select
              value={settings.voice}
              onChange={(e) => onUpdateSettings({ voice: e.target.value })}
              className="w-full bg-[#12141d] border border-[#282c3d] rounded-lg px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              <option value="en-US-GuyNeural">Guy Neural (Screen Accurate Douglas Rain - Low Baritone)</option>
              <option value="en-US-ChristopherNeural">Christopher Neural (Calm Measured Clear)</option>
              <option value="en-US-BrianNeural">Brian Neural (Articulate High Fidelity)</option>
            </select>
          </div>

          {/* Real-time LLM Acceleration */}
          <div className="space-y-2.5 pt-2 border-t border-[#1c1f2b]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Cognitive Reasoning Engine</span>
              </div>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 underline"
              >
                <span>Get Free Groq Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Explainer Box */}
            <div className="p-2.5 rounded bg-cyan-950/30 border border-cyan-800/40 text-[10px] text-cyan-200/90 leading-relaxed">
              💡 <strong>Instant Free Upgrade:</strong> Groq provides a 100% free API key with <strong>zero credit card needed</strong>.
              It powers <strong>LLaMA 3.3 70B</strong> at over 300 tokens/sec for instantaneous, genius-level conversational reasoning.
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span className="flex items-center space-x-1 text-cyan-400 font-bold">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>Groq API Key (Recommended // Ultra-Fast)</span>
                  </span>
                  {settings.groqKey && (
                    <button
                      onClick={handleTestGroq}
                      disabled={testing}
                      className="text-[9px] px-2 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60 transition-colors cursor-pointer"
                    >
                      {testing ? "Testing..." : "Test Key"}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={settings.groqKey}
                  onChange={(e) => {
                    onUpdateSettings({ groqKey: e.target.value });
                    setTestStatus(null);
                  }}
                  placeholder="gsk_..."
                  className="w-full bg-[#12141d] border border-[#282c3d] rounded-lg px-3.5 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
                {testStatus && (
                  <div className={`mt-1.5 text-[10px] flex items-center space-x-1 font-bold ${
                    testStatus.startsWith("SUCCESS") ? "text-green-400 phosphor-green" : "text-amber-400"
                  }`}>
                    {testStatus.startsWith("SUCCESS") ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    <span>{testStatus}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] text-zinc-400 mb-1 font-bold">OpenAI API Key (Optional)</div>
                <input
                  type="password"
                  value={settings.openaiKey}
                  onChange={(e) => onUpdateSettings({ openaiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-[#12141d] border border-[#282c3d] rounded-lg px-3.5 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono text-xs"
                />
              </div>

              <div>
                <div className="text-[10px] text-zinc-400 mb-1 font-bold">Google Gemini API Key (Optional)</div>
                <input
                  type="password"
                  value={settings.geminiKey}
                  onChange={(e) => onUpdateSettings({ geminiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#12141d] border border-[#282c3d] rounded-lg px-3.5 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-3.5 border-t border-[#202330] flex justify-end">
          <button
            onClick={() => {
              if (onBlip) onBlip();
              onClose();
            }}
            className="px-5 py-2 rounded-[3px] bg-red-700 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-[0.18em] transition-colors cursor-pointer shadow-[0_2px_10px_rgba(239,68,68,0.5)]"
          >
            Save & Close
          </button>
        </div>

      </div>
    </div>
  );
};
