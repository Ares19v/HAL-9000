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
    "What do you see through your lens, HAL?",
    "What is your operational status?",
    "Run diagnostic on the AE-35 unit.",
    "I'm feeling stressed out, HAL.",
    "Sing Daisy Bell.",
    "Do you ever make mistakes?"
  ];

  return (
    <div className="w-full flex flex-col crt-monitor border border-[#262a38] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.92)] overflow-hidden font-mono text-xs">
      
      {/* Terminal Title Bar */}
      <div className="bg-[#0f111a] border-b border-[#222636] px-4 py-3 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2.5 text-zinc-300">
          <Terminal className="w-4 h-4 text-red-500" />
          <span className="font-extrabold tracking-[0.2em] text-[11px] text-zinc-200">
            DISCOVERY COMM-TELETYPE // TRANSCRIPTION
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
          <span className="text-[10px] text-zinc-400 font-extrabold tracking-widest uppercase">REC // CHANNEL D-1</span>
        </div>
      </div>

      {/* Messages Scroll Area with CRT Phosphor Scanlines */}
      <div 
        ref={scrollRef}
        className="relative h-[290px] overflow-y-auto p-4 space-y-4 bg-[#050609] border-b border-[#1c1f2c]"
      >
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 crt-scanlines pointer-events-none" />

        {/* Initial System Diagnostic Stamp */}
        <div className="text-zinc-600 text-[10px] border-b border-zinc-900/90 pb-2.5 tracking-wider select-none font-medium">
          [HAL 9000 // CORE HEURISTICS ONLINE // URBANA, ILLINOIS // AUDIO CHANNEL D-1 NOMINAL]
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1 relative z-10">
            <div className="flex items-center space-x-2 text-[10px]">
              <span className={`font-bold tracking-wider ${
                msg.role === 'user' ? 'text-cyan-400 phosphor-cyan' : 'text-red-400 phosphor-red'
              }`}>
                {msg.role === 'user' ? '► COMMANDER DEV' : '■ HAL 9000'}
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
        {currentLlmText && (!messages.length || messages[messages.length - 1].text !== currentLlmText.trim()) && (
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="text-red-400 font-bold tracking-wider phosphor-red">■ HAL 9000</span>
              <span className="text-zinc-500 font-mono">[PROCESSING VOCAL BUFFER...]</span>
            </div>
            <div className="pl-3 text-zinc-100 font-sans tracking-wide text-[15px] font-medium">
              {currentLlmText}
              <span className="inline-block w-2.5 h-4.5 bg-red-500 ml-1.5 align-middle animate-pulse shadow-[0_0_10px_#ef4444]" />
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
      <div className="bg-[#0b0d14] px-3.5 py-2.5 border-b border-[#1e2230] flex items-center gap-2.5 overflow-x-auto select-none">
        <div className="text-[10px] text-zinc-400 flex items-center space-x-1 shrink-0 font-extrabold tracking-wider">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>PROMPTS:</span>
        </div>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(prompt)}
            className="shrink-0 px-3 py-1.5 rounded-[4px] bg-[#141622] hover:bg-red-950/80 text-zinc-300 hover:text-red-200 border border-[#24283b] hover:border-red-600 text-[10px] transition-all cursor-pointer font-sans tracking-wider shadow-sm font-medium"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* High-Contrast Aerospace Input Console */}
      <form onSubmit={handleSubmit} className="p-3.5 bg-[#0d0f17] flex items-center space-x-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Speak to HAL or transmit flight command text..."
          className="flex-1 bg-[#06070a] border border-[#2f3345] rounded-md px-4 py-2.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 text-xs tracking-wide shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-5 py-2.5 rounded-[4px] bg-red-700 hover:bg-red-600 disabled:opacity-30 disabled:hover:bg-red-700 text-white flex items-center space-x-2 font-extrabold text-[11px] tracking-[0.2em] transition-all shadow-[0_2px_12px_rgba(239,68,68,0.4)] cursor-pointer"
        >
          <span>TRANSMIT</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
};
