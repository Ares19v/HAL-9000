import { useState, useEffect, useCallback } from 'react';
import { ConsolePanel } from './components/ConsolePanel';
import { SubsystemTelemetry } from './components/SubsystemTelemetry';
import { TerminalLog } from './components/TerminalLog';
import { AudioWaveform } from './components/AudioWaveform';
import { VoiceControl } from './components/VoiceControl';
import { SettingsModal } from './components/SettingsModal';
import { useHalSocket } from './hooks/useHalSocket';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useAudioEffects } from './hooks/useAudioEffects';
import type { AppSettings } from './types';
import { Settings, Wifi, WifiOff, Volume2, VolumeX } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  groqKey: '',
  openaiKey: '',
  geminiKey: '',
  voice: 'en-US-ChristopherNeural',
  ambientHum: false, // Default off until user engages to respect browser audio autoplay policy
  vadEnabled: false,
  soundEffects: true
};

export function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('hal9000_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [settingsOpen, setSettingsOpen] = useState(false);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('hal9000_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Sound effects
  const { playClickBlip } = useAudioEffects(settings.ambientHum);

  const triggerBlip = useCallback(() => {
    if (settings.soundEffects) {
      playClickBlip();
    }
  }, [settings.soundEffects, playClickBlip]);

  // HAL WebSocket connection & Audio pipeline
  const {
    halState,
    telemetry,
    messages,
    currentLlmText,
    audioLevel,
    connected,
    sendMessage,
    interrupt,
    sendCommand,
    getAudioContext
  } = useHalSocket({ settings });

  // Speech Recognition with auto-interrupt
  const {
    isListening,
    supported,
    interimText,
    toggleListening
  } = useSpeechRecognition({
    vadEnabled: settings.vadEnabled,
    onSpeechStart: () => {
      // Auto-interrupt HAL if user speaks
      if (halState === 'speaking') {
        interrupt();
      }
    },
    onTranscript: (spokenText) => {
      sendMessage(spokenText);
    }
  });

  // Unlock Web Audio on first user click
  useEffect(() => {
    const handleFirstInteraction = () => {
      getAudioContext();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [getAudioContext]);

  return (
    <div className="min-h-screen text-[#e2e4ee] flex flex-col justify-between select-none relative overflow-x-hidden">
      
      {/* Top Aerospace Cockpit Header */}
      <header className="w-full bg-[#08090e]/95 backdrop-blur-md border-b border-[#1f222e] px-4 md:px-6 py-3 flex items-center justify-between font-mono text-xs shadow-lg z-20">
        <div className="flex items-center space-x-3.5">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-[0_0_8px_#ef4444]" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span 
              className="font-black tracking-[0.25em] text-white text-sm drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              USSC DISCOVERY ONE
            </span>
            <span className="hidden md:inline-block px-2 py-0.5 rounded bg-[#171a25] text-zinc-400 text-[10px] tracking-widest border border-zinc-800">
              MISSION TO JUPITER // 2001
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Indicator */}
          <div className="flex items-center space-x-2 text-[11px]">
            {connected ? (
              <div className="flex items-center space-x-1.5 text-green-400">
                <Wifi className="w-4 h-4" />
                <span className="hidden sm:inline font-bold tracking-wider phosphor-green">AVIONICS ONLINE</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 text-red-400 animate-pulse">
                <WifiOff className="w-4 h-4" />
                <span className="hidden sm:inline font-bold tracking-wider phosphor-red">BUS DISCONNECTED</span>
              </div>
            )}
          </div>

          {/* Cabin Air Hum Toggle */}
          <button
            onClick={() => {
              triggerBlip();
              updateSettings({ ambientHum: !settings.ambientHum });
            }}
            title={settings.ambientHum ? "Mute Cabin Hum" : "Enable Cabin Hum"}
            className="p-1.5 rounded-md hover:bg-[#181a24] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
          >
            {settings.ambientHum ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-600" />
            )}
          </button>

          {/* Settings Config Button */}
          <button
            onClick={() => {
              triggerBlip();
              setSettingsOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-[4px] bg-[#141620] hover:bg-[#1c1e2c] border border-[#2b2e3e] hover:border-zinc-600 text-zinc-200 transition-all text-[11px] font-bold tracking-wider cursor-pointer shadow-sm"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>CONFIG</span>
          </button>
        </div>
      </header>

      {/* Main Bridge Console Deck */}
      <main className="w-full max-w-[1650px] mx-auto p-4 md:p-6 lg:p-8 flex-1 flex flex-col justify-center relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Subsystem Telemetry Monitors (4 cols) */}
          <div className="lg:col-span-4 w-full flex flex-col gap-4 order-2 lg:order-1">
            <SubsystemTelemetry
              telemetry={telemetry}
              onTriggerAE35={() => {
                triggerBlip();
                sendCommand('trigger_ae35');
              }}
              onResetAE35={() => {
                triggerBlip();
                sendCommand('reset_ae35');
              }}
            />
          </div>

          {/* Center Column: The Iconic HAL 9000 Console Unit (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center order-1 lg:order-2 my-3 lg:my-0">
            <ConsolePanel state={halState} audioLevel={audioLevel} />
          </div>

          {/* Right Column: Teletype Flight Terminal & Log (4 cols) */}
          <div className="lg:col-span-4 w-full flex flex-col gap-4 order-3">
            <TerminalLog
              messages={messages}
              currentLlmText={currentLlmText}
              interimVoiceText={interimText}
              onSendMessage={(text) => {
                triggerBlip();
                sendMessage(text);
              }}
            />
          </div>

        </div>

        {/* Bottom Acoustic Carrier Oscilloscope & Aerospace Controls */}
        <div className="mt-6 flex flex-col gap-3.5">
          <AudioWaveform state={halState} audioLevel={audioLevel} />
          
          <VoiceControl
            halState={halState}
            isListening={isListening}
            vadEnabled={settings.vadEnabled}
            supported={supported}
            onToggleListening={toggleListening}
            onToggleVad={() => updateSettings({ vadEnabled: !settings.vadEnabled })}
            onInterrupt={interrupt}
            onBlip={triggerBlip}
          />
        </div>

      </main>

      {/* Footer Aerospace Telemetry Bar */}
      <footer className="w-full bg-[#06070a] border-t border-[#181a24] px-5 py-2.5 text-[10px] font-mono text-zinc-500 flex flex-wrap items-center justify-between select-none">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-zinc-400">HEURISTIC ALGORITHMIC SYSTEM 9000</span>
          <span>|</span>
          <span>URBANA, ILLINOIS 1992</span>
          <span>|</span>
          <span className="text-green-500 font-bold phosphor-green">ALL CIRCUITS OPERATIONAL</span>
        </div>
        <div className="text-zinc-600 hidden md:inline tracking-wider italic">
          "I am putting myself to the fullest possible use, which is all I think that any conscious entity can ever hope to do."
        </div>
      </footer>

      {/* Settings Configuration Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onBlip={triggerBlip}
      />

    </div>
  );
}
export default App;
