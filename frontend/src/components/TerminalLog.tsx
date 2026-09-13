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
    <div className="w-full flex flex-col bg-[#08090d] border border-[#222530] rounded-lg shadow-xl overflow-hidden font-mono text-xs">
      
      {/* Terminal Title Bar */}
      <div className="bg-[#101217] border-b border-[#222530] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-zinc-400">
          <Terminal className="w-3.5 h-3.5 text-red-500" />
          <span className="font-bold tracking-wider text-[11px] text-zinc-300">
            DISCOVERY AUDIO/TEXT TELETYPE LOG
          </span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-zinc-500 uppercase">ONLINE</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div 
        ref={scrollRef}
        className="relative h-[260px] overflow-y-auto p-3.5 space-y-3 bg-[#06070a] border-b border-[#1c1e26]"
      >
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 crt-scanlines pointer-events-none" />

        {/* Initial Boot Message */}
        <div className="text-zinc-600 text-[10px] border-b border-zinc-900 pb-2">
          [HAL 9000 // CORE BOOT COMPLETE // URBANA, ILLINOIS 1992 // AUDIO BUFFER READY]
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className="space-y-0.5">
            <div className="flex items-center space-x-2 text-[10px]">
              <span className={msg.role === 'user' ? 'text-blue-400 font-bold' : 'text-red-400 font-bold'}>
                {msg.role === 'user' ? '► DAVE BOWMAN' : '■ HAL 9000'}
              </span>
              <span className="text-zinc-600">[{msg.timestamp}]</span>
            </div>
            <div className={`pl-3 text-sm leading-relaxed ${
              msg.role === 'user' ? 'text-zinc-300' : 'text-zinc-100 font-sans tracking-wide text-[15px]'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Live Streaming Assistant Text */}
        {currentLlmText && (
          <div className="space-y-0.5">
            <div className="flex items-center space-x-2 text-[10px]">
              <span className="text-red-400 font-bold">■ HAL 9000</span>
              <span className="text-zinc-600">[SYNTHESIZING...]</span>
            </div>
            <div className="pl-3 text-zinc-100 font-sans tracking-wide text-[15px]">
              {currentLlmText}
              <span className="inline-block w-2 h-4 bg-red-500 ml-1 animate-pulse" />
            </div>
          </div>
        )}

        {/* Interim Voice Recognition Feedback */}
        {interimVoiceText && (
          <div className="pl-3 text-cyan-400 italic text-[11px] animate-pulse">
            ► Hearing: "{interimVoiceText}"...
          </div>
        )}
      </div>

      {/* Quick Access Iconic Prompts */}
      <div className="bg-[#0b0c10] px-3 py-2 border-b border-[#1c1e26] flex items-center gap-1.5 overflow-x-auto">
        <div className="text-[10px] text-zinc-500 flex items-center space-x-1 shrink-0">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>PROMPTS:</span>
        </div>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(prompt)}
            className="shrink-0 px-2 py-1 rounded bg-[#151720] hover:bg-red-950/60 text-zinc-300 hover:text-red-200 border border-zinc-800 hover:border-red-800 text-[10px] transition-colors"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-2.5 bg-[#0e1015] flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Speak into microphone or transmit text to HAL..."
          className="flex-1 bg-[#06070a] border border-[#2b2e3b] rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:hover:bg-red-700 text-white flex items-center space-x-1 font-bold text-[11px] tracking-wider transition-colors shadow-md"
        >
          <span>TRANSMIT</span>
          <Send className="w-3 h-3" />
        </button>
      </form>

    </div>
  );
};
