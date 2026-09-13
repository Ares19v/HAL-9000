import { useEffect, useRef, useState, useCallback } from 'react';
import type { HalState, TelemetryData, ChatMessage, AppSettings } from '../types';

interface UseHalSocketProps {
  settings: AppSettings;
}

export function useHalSocket({ settings }: UseHalSocketProps) {
  const [halState, setHalState] = useState<HalState>('idle');
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentLlmText, setCurrentLlmText] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [connected, setConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const pendingSentenceAudioRef = useRef<Map<number, Uint8Array[]>>(new Map());

  // Initialize Web Audio Context
  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(ctx.destination);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      // Start visualizer loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVisualizer = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalized level 0.0 - 1.0
          setAudioLevel(Math.min(1.0, avg / 128));
        }
        animFrameRef.current = requestAnimationFrame(updateVisualizer);
      };
      animFrameRef.current = requestAnimationFrame(updateVisualizer);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // In dev mode with Vite proxy, or direct backend port 8000
    const wsUrl = `${protocol}//${host}/ws/hal`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log("[HAL 9000] WebSocket connection established.");
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("[HAL 9000] WebSocket connection closed.");
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'system_ready') {
          if (data.telemetry) setTelemetry(data.telemetry);
        } else if (data.type === 'telemetry') {
          setTelemetry(data.data);
        } else if (data.type === 'status') {
          setHalState(data.state);
        } else if (data.type === 'llm_delta') {
          setCurrentLlmText((prev) => prev + data.delta);
        } else if (data.type === 'sentence_start') {
          setHalState('speaking');
          pendingSentenceAudioRef.current.set(data.sentence_id, []);
        } else if (data.type === 'audio_chunk') {
          // Accumulate raw binary chunk for this sentence
          const rawBinary = Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0));
          const currentChunks = pendingSentenceAudioRef.current.get(data.sentence_id) || [];
          currentChunks.push(rawBinary);
          pendingSentenceAudioRef.current.set(data.sentence_id, currentChunks);
        } else if (data.type === 'sentence_end') {
          // Complete sentence audio assembled, decode and schedule playback
          const chunks = pendingSentenceAudioRef.current.get(data.sentence_id);
          if (chunks && chunks.length > 0) {
            let totalLength = 0;
            chunks.forEach(c => totalLength += c.byteLength);
            const combined = new Uint8Array(totalLength);
            let offset = 0;
            chunks.forEach(c => {
              combined.set(c, offset);
              offset += c.byteLength;
            });

            playAudioBuffer(combined.buffer);
          }
          pendingSentenceAudioRef.current.delete(data.sentence_id);
        } else if (data.type === 'stream_complete') {
          setCurrentLlmText((finalText) => {
            if (finalText) {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: 'hal',
                  text: finalText,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }
              ]);
            }
            return '';
          });
        } else if (data.type === 'interrupted') {
          stopAllAudio();
          setHalState('idle');
        }
      } catch (err) {
        console.error("[HAL 9000] Error processing message:", err);
      }
    };

    return () => {
      ws.close();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const playAudioBuffer = async (arrayBuffer: ArrayBuffer) => {
    try {
      const ctx = getAudioContext();
      if (!ctx || !analyserRef.current) return;

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(analyserRef.current);

      const currentTime = ctx.currentTime;
      const startTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
        if (activeSourcesRef.current.length === 0 && currentTime >= nextStartTimeRef.current) {
          setHalState('idle');
          setAudioLevel(0);
        }
      };
    } catch (e) {
      console.warn("Audio decode/playback error:", e);
    }
  };

  const stopAllAudio = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch {}
    });
    activeSourcesRef.current = [];
    if (audioCtxRef.current) {
      nextStartTimeRef.current = audioCtxRef.current.currentTime;
    }
    pendingSentenceAudioRef.current.clear();
    setAudioLevel(0);
  }, []);

  const interrupt = useCallback(() => {
    stopAllAudio();
    setHalState('idle');
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'interrupt' }));
    }
  }, [stopAllAudio]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    // Interrupt previous playback
    interrupt();

    // Add user message to log
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'user',
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
    ]);
    setCurrentLlmText('');

    // Ensure audio context is unlocked
    getAudioContext();

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'user_message',
        text: text.trim(),
        voice: settings.voice,
        keys: {
          groq: settings.groqKey || undefined,
          openai: settings.openaiKey || undefined,
          gemini: settings.geminiKey || undefined,
        }
      }));
    }
  }, [interrupt, getAudioContext, settings]);

  const sendCommand = useCallback((action: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'command', action }));
    }
  }, []);

  return {
    halState,
    setHalState,
    telemetry,
    messages,
    currentLlmText,
    audioLevel,
    connected,
    sendMessage,
    interrupt,
    sendCommand,
    getAudioContext
  };
}
