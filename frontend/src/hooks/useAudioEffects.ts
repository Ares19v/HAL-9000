import { useEffect, useRef } from 'react';

/**
 * Web Audio API procedural sound synthesizer for Discovery One.
 * - Deep spaceship environmental air ventilation hum (40-120Hz)
 * - Relay switch / CRT toggle blip sound
 */
export function useAudioEffects(enabled: boolean) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const humNodesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!enabled) {
      if (humGainRef.current) {
        humGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current?.currentTime || 0, 0.2);
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create low hum
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.04, ctx.currentTime);
      masterGain.connect(ctx.destination);
      humGainRef.current = masterGain;

      // Sub-bass oscillator (60Hz cabin electrical hum)
      const osc60 = ctx.createOscillator();
      osc60.type = 'sine';
      osc60.frequency.setValueAtTime(58, ctx.currentTime);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.5, ctx.currentTime);
      osc60.connect(oscGain);
      oscGain.connect(masterGain);
      osc60.start();

      // Atmospheric white/pink noise for air circulation
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Low pass filter at 140Hz for muffled ventilation sound
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(140, ctx.currentTime);

      whiteNoise.connect(lowpass);
      lowpass.connect(masterGain);
      whiteNoise.start();

      humNodesRef.current = [osc60, whiteNoise];

    } catch (e) {
      console.warn("Could not start ambient audio:", e);
    }

    return () => {
      humNodesRef.current.forEach(node => {
        try { node.stop(); } catch {}
      });
      humNodesRef.current = [];
    };
  }, [enabled]);

  const playClickBlip = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioCtxRef.current || new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  };

  return { playClickBlip };
}
