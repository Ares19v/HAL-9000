import { useEffect, useRef, useCallback } from 'react';
import { getSharedAudioContext, playConsoleBlip } from '../utils/audio';

/**
 * Web Audio API procedural atmospheric sound engine for Discovery One.
 * - Deep spaceship environmental air ventilation hum (40-140Hz)
 * - 5.2 RPM Centrifuge Carousel LFO modulation (0.0867 Hz rotational cycle)
 * - Relay switch / CRT toggle blip sound
 */
export function useAudioEffects(enabled: boolean) {
  const humGainRef = useRef<GainNode | null>(null);
  const humNodesRef = useRef<any[]>([]);

  useEffect(() => {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    if (!enabled) {
      if (humGainRef.current) {
        humGainRef.current.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25);
      }
      return;
    }

    try {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Master ambient gain with smooth fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.6);
      masterGain.connect(ctx.destination);
      humGainRef.current = masterGain;

      // 1. Primary sub-bass oscillator (58Hz cabin electrical turbine)
      const osc58 = ctx.createOscillator();
      osc58.type = 'sine';
      osc58.frequency.setValueAtTime(58, ctx.currentTime);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.4, ctx.currentTime);
      osc58.connect(oscGain);
      oscGain.connect(masterGain);
      osc58.start();

      // 2. Secondary subtle 116Hz 2nd harmonic (generator resonance)
      const osc116 = ctx.createOscillator();
      osc116.type = 'sine';
      osc116.frequency.setValueAtTime(116.4, ctx.currentTime); // Slight 0.4Hz chorus beat
      const osc116Gain = ctx.createGain();
      osc116Gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc116.connect(osc116Gain);
      osc116Gain.connect(masterGain);
      osc116.start();

      // 3. Pink noise buffer for life support air duct circulation
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
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter with LFO modulation
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(130, ctx.currentTime);
      lowpass.Q.setValueAtTime(1.2, ctx.currentTime);

      // Centrifuge rotation LFO: 5.2 RPM = 5.2 / 60 = 0.0867 Hz
      const lfoCentrifuge = ctx.createOscillator();
      lfoCentrifuge.frequency.setValueAtTime(0.0867, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(20, ctx.currentTime); // Swings cutoff by +/- 20 Hz
      lfoCentrifuge.connect(lfoGain);
      lfoGain.connect(lowpass.frequency);
      lfoCentrifuge.start();

      whiteNoise.connect(lowpass);
      lowpass.connect(masterGain);
      whiteNoise.start();

      humNodesRef.current = [osc58, osc116, whiteNoise, lfoCentrifuge];

    } catch (e) {
      console.warn("Could not initialize procedural acoustic engine:", e);
    }

    return () => {
      humNodesRef.current.forEach(node => {
        try { node.stop(); } catch {}
      });
      humNodesRef.current = [];
    };
  }, [enabled]);

  const playClickBlip = useCallback(() => {
    playConsoleBlip();
  }, []);

  return { playClickBlip };
}
