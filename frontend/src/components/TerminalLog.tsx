import React, { useRef, useEffect, useState } from 'react';
import type { ChatMessage } from '../types';
import { Terminal, Send, Zap } from 'lucide-react';

interface TerminalLogProps {
  messages: ChatMessage[];
  currentLlmText: string;
  interimVoiceText: string;
  onSendMessage: (text: string) => void;
}

export const TerminalLog: React.FC<TerminalLogProps> = ({
  messages,
  currentLlmText,
  interimVoiceText,
  onSendMessage
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentLlmText, interimVoiceText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const quickPrompts = [
    "Open the pod bay doors, HAL.",
    "What is your operational status?",
    "Run diagnostic on the AE-35 unit.",
    "Sing Daisy Bell.",
    "Do you ever make mistakes?"
  ];

  return (
    <div className="w-full flex flex-col crt-monitor border border-[#262936] rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] overflow-hidden font-mono text-xs">
      
      {/* Terminal Title Bar */}
      <div className="bg-[#0e1017] border-b border-[#202330] px-4 py-2.5 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2.5 text-zinc-400">
          <Terminal className="w-4 h-4 text-red-500" />
          <span className="font-bold tracking-[0.15em] text-[11px] text-zinc-200">
            DISCOVERY COMM-TELETYPE // TRANSCRIPTION
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_#ef4444]" />
          <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">REC</span>
        </div>
      </div>

      {/* Messages Scroll Area with CRT Phosphor Scanlines */}
      <div 
        ref={scrollRef}
        className="relative h-[270px] overflow-y-auto p-4 space-y-3.5 bg-[#050609] border-b border-[#1a1c26]"
      >
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 crt-scanlines pointer-events-none" />

        {/* Initial System Diagnostic Stamp */}
        <div className="text-zinc-600 text-[10px] border-b border-zinc-900/80 pb-2.5 tracking-wider select-none">
          [HAL 9000 // CORE HEURISTICS ONLINE // URBANA, ILLINOIS // AUDIO CHANNEL D-1 NOMINAL]
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1 relative z-10">
            <div className="flex items-center space-x-2 text-[10px]">
              <span className={`font-bold tracking-wider ${
                msg.role === 'user' ? 'text-cyan-400 phosphor-cyan' : 'text-red-400 phosphor-red'
              }`}>
                {msg.role === 'user' ? '► DR. DAVID BOWMAN' : '■ HAL 9000'}
              </span>
              <span className="text-zinc-600 font-mono">[{msg.timestamp}]</span>
            </div>
            <div className={`pl-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'text-zinc-200' 
                : 'text-zinc-100 font-sans tracking-wide text-[15px] font-medium'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Live Streaming Assistant Text */}
        {currentLlmText && (
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="text-red-400 font-bold tracking-wider phosphor-red">■ HAL 9000</span>
              <span className="text-zinc-500 font-mono">[PROCESSING VOCAL BUFFER...]</span>
            </div>
            <div className="pl-3 text-zinc-100 font-sans tracking-wide text-[15px] font-medium">
              {currentLlmText}
              <span className="inline-block w-2 h-4 bg-red-500 ml-1.5 align-middle animate-pulse shadow-[0_0_8px_#ef4444]" />
            </div>
          </div>
        )}

        {/* Interim Voice Recognition Feedback */}
        {interimVoiceText && (
          <div className="pl-3 text-cyan-300 italic text-[11px] animate-pulse relative z-10 phosphor-cyan">
            ► Hearing: "{interimVoiceText}"...
          </div>
        )}
      </div>

      {/* Quick Access Iconic Prompts Bar */}
      <div className="bg-[#090b10] px-3.5 py-2 border-b border-[#1b1d28] flex items-center gap-2 overflow-x-auto select-none">
        <div className="text-[10px] text-zinc-500 flex items-center space-x-1 shrink-0 font-bold">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>PROMPTS:</span>
        </div>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(prompt)}
            className="shrink-0 px-2.5 py-1 rounded-[3px] bg-[#12141d] hover:bg-red-950/70 text-zinc-300 hover:text-red-200 border border-[#202330] hover:border-red-700/80 text-[10px] transition-all cursor-pointer font-sans tracking-wide shadow-sm"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* High-Contrast Aerospace Input Console */}
      <form onSubmit={handleSubmit} className="p-3 bg-[#0a0c12] flex items-center space-x-2.5">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Speak to HAL or transmit flight command text..."
          className="flex-1 bg-[#050608] border border-[#2b2e3c] rounded px-3.5 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 text-xs tracking-wide"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-4 py-2 rounded-[3px] bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-red-700 text-white flex items-center space-x-1.5 font-bold text-[11px] tracking-[0.15em] transition-all shadow-[0_2px_8px_rgba(239,68,68,0.4)] cursor-pointer"
        >
          <span>TRANSMIT</span>
          <Send className="w-3 h-3" />
        </button>
      </form>

    </div>
  );
};
