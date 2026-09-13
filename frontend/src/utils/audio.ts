// Singleton Web Audio Context to prevent WASAPI audio thread re-creation and stutter
let sharedAudioContext: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx();
  }
  
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  
  return sharedAudioContext;
}

export function playConsoleBlip(ctx?: AudioContext | null): void {
  try {
    const audioCtx = ctx || getSharedAudioContext();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(460, audioCtx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.035);
  } catch {}
}
