import { useEffect, useRef, useState, useCallback } from 'react';
import type { HalState, TelemetryData, ChatMessage, AppSettings, FrequencyBands } from '../types';
import { getSharedAudioContext } from '../utils/audio';

interface UseHalSocketProps {
  settings: AppSettings;
}

export function useHalSocket({ settings }: UseHalSocketProps) {
  const [halState, setHalState] = useState<HalState>('idle');
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentLlmText, setCurrentLlmText] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyBands, setFrequencyBands] = useState<FrequencyBands>({ bass: 0, mid: 0, treble: 0 });
  const [connected, setConnected] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array>(new Uint8Array(64));
  const activeSourcesRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode }[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const pendingSentenceAudioRef = useRef<Map<number, Uint8Array[]>>(new Map());

  // Initialize Web Audio Context with 128 FFT analysis using shared singleton
  const getAudioContext = useCallback(() => {
    const ctx = getSharedAudioContext();
    if (!ctx) return null;
    audioCtxRef.current = ctx;

    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.75;

      // Douglas Rain Studio Vocal DSP Chain: High-intelligibility broadcast booth
      // Subtle warmth at 220Hz, gentle dip in harsh upper-mids (4.5kHz)
      const lowWarmth = ctx.createBiquadFilter();
      lowWarmth.type = 'peaking';
      lowWarmth.frequency.value = 240;
      lowWarmth.gain.value = 2.0; // Chest resonance
      lowWarmth.Q.value = 0.7;

      const highSmooth = ctx.createBiquadFilter();
      highSmooth.type = 'lowpass';
      highSmooth.frequency.value = 8500; // Soft cinema roll-off (removes robot sibilance)

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 8;
      comp.ratio.value = 2.5;
      comp.attack.value = 0.005;
      comp.release.value = 0.06;

      analyser.connect(lowWarmth);
      lowWarmth.connect(highSmooth);
      highSmooth.connect(comp);
      comp.connect(ctx.destination);

      analyserRef.current = analyser;

      // Real-time audio spectrum frequency loop
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVisualizer = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          frequencyDataRef.current.set(dataArray);

          let sum = 0;
          let bassSum = 0, midSum = 0, trebleSum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
            if (i < 8) bassSum += dataArray[i];
            else if (i < 28) midSum += dataArray[i];
            else trebleSum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(1.0, avg / 120));
          setFrequencyBands({
            bass: Math.min(1.0, (bassSum / 8) / 130),
            mid: Math.min(1.0, (midSum / 20) / 120),
            treble: Math.min(1.0, (trebleSum / 36) / 100)
          });
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

  // Connect WebSocket with Auto-Reconnect
  useEffect(() => {
    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/hal`;

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttemptsRef.current = 0;
        console.log("[HAL 9000] WebSocket telemetry & audio bus connected.");
      };

      ws.onclose = () => {
        setConnected(false);
        console.log("[HAL 9000] WebSocket connection closed. Attempting reconnect...");
        if (!isUnmounted) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 8000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
        }
      };

      ws.onerror = (e) => {
        console.warn("[HAL 9000] WebSocket communication error:", e);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'system_ready') {
            if (data.telemetry) setTelemetry(data.telemetry);
          } else if (data.type === 'telemetry') {
            setTelemetry(data.data);
          } else if (data.type === 'status') {
            // Only allow server to force idle if no active audio sources are queued or playing
            if (data.state === 'idle') {
              if (activeSourcesRef.current.length === 0) {
                setHalState('idle');
              }
            } else {
              setHalState(data.state);
            }
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
            // Complete sentence audio assembled, decode and schedule with crossfade
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
              const textToCommit = finalText.trim();
              if (textToCommit) {
                setMessages((prev) => {
                  // Prevent accidental double insertion if already added
                  if (prev.length > 0 && prev[prev.length - 1].role === 'hal' && prev[prev.length - 1].text === textToCommit) {
                    return prev;
                  }
                  return [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      role: 'hal',
                      text: textToCommit,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    }
                  ];
                });
              }
              return '';
            });
            // If no audio buffers were queued (e.g. silent or instant response), return to idle
            if (activeSourcesRef.current.length === 0) {
              setHalState('idle');
            }
          } else if (data.type === 'user_transcription') {
            const transcribed = data.text?.trim();
            if (transcribed) {
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: 'user',
                  text: transcribed,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }
              ]);
            }
          } else if (data.type === 'interrupted') {
            stopAllAudio();
            setHalState('idle');
          }
        } catch (err) {
          console.error("[HAL 9000] Error processing message:", err);
        }
      };
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Play audio buffer with seamless micro-fade envelope (no clicks/pops)
  const playAudioBuffer = async (arrayBuffer: ArrayBuffer) => {
    try {
      const ctx = getAudioContext();
      if (!ctx || !analyserRef.current) return;

      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(analyserRef.current);

      const currentTime = ctx.currentTime;
      // If previous sentence is currently playing or queued, apply a subtle 40ms crossfade overlap
      // to eliminate unnatural dead-air gaps between sentences without clipping
      const isChained = nextStartTimeRef.current > currentTime + 0.05;
      const startTime = isChained 
        ? Math.max(currentTime, nextStartTimeRef.current - 0.04) 
        : Math.max(currentTime, nextStartTimeRef.current);
      const duration = audioBuffer.duration;

      // Smooth anti-pop envelope (8ms micro fade-in and fade-out)
      gainNode.gain.setValueAtTime(0.001, startTime);
      gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.008);
      if (duration > 0.016) {
        gainNode.gain.setValueAtTime(1.0, startTime + duration - 0.008);
        gainNode.gain.linearRampToValueAtTime(0.001, startTime + duration);
      }

      source.start(startTime);
      nextStartTimeRef.current = startTime + duration;

      const item = { source, gain: gainNode };
      activeSourcesRef.current.push(item);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(i => i.source !== source);
        if (activeSourcesRef.current.length === 0 && ctx.currentTime >= nextStartTimeRef.current) {
          setHalState('idle');
          setAudioLevel(0);
        }
      };
    } catch (e) {
      console.warn("Audio decode/playback error:", e);
    }
  };

  const stopAllAudio = useCallback(() => {
    activeSourcesRef.current.forEach(({ source, gain }) => {
      try {
        if (audioCtxRef.current) {
          gain.gain.setValueAtTime(gain.gain.value, audioCtxRef.current.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.02);
        }
        source.stop(audioCtxRef.current ? audioCtxRef.current.currentTime + 0.02 : 0);
      } catch {}
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

    // Ensure audio context is ready
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
          elevenlabs: settings.elevenlabsKey || undefined,
          elevenlabs_voice_id: settings.elevenlabsVoiceId || undefined,
        }
      }));
    }
  }, [interrupt, getAudioContext, settings]);

  const sendAudioInput = useCallback((base64Audio: string, format: string = 'webm') => {
    if (!base64Audio) return;

    // Interrupt previous playback
    interrupt();
    setCurrentLlmText('');

    // Ensure audio context is ready
    getAudioContext();

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'audio_input',
        audio: base64Audio,
        format: format,
        voice: settings.voice,
        keys: {
          groq: settings.groqKey || undefined,
          openai: settings.openaiKey || undefined,
          gemini: settings.geminiKey || undefined,
          elevenlabs: settings.elevenlabsKey || undefined,
          elevenlabs_voice_id: settings.elevenlabsVoiceId || undefined,
        }
      }));
    }
  }, [interrupt, getAudioContext, settings]);

  const sendVisionFrame = useCallback((description: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'vision_frame',
        description
      }));
    }
  }, []);

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
    frequencyBands,
    getFrequencyData: useCallback(() => frequencyDataRef.current, []),
    connected,
    sendMessage,
    sendAudioInput,
    interrupt,
    sendCommand,
    sendVisionFrame,
    getAudioContext
  };
}
