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
    <div className="min-h-screen bg-[#040507] text-[#e0e2ec] flex flex-col justify-between select-none">
      
      {/* Top Aerospace Header */}
      <header className="w-full bg-[#08090d] border-b border-[#1c1e28] px-4 py-2.5 flex items-center justify-between font-mono text-xs shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_#ef4444]" />
          <span className="font-extrabold tracking-[0.2em] text-white text-sm">
            USSC DISCOVERY ONE
          </span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-400 text-[10px]">
            MISSION TO JUPITER
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Connection Indicator */}
          <div className="flex items-center space-x-1.5 text-[11px]">
            {connected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 hidden sm:inline">DISCOVERY BUS CONNECTED</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span className="text-red-400 hidden sm:inline">DISCONNECTED</span>
              </>
            )}
          </div>

          {/* Cabin Air Hum Toggle */}
          <button
            onClick={() => {
              triggerBlip();
              updateSettings({ ambientHum: !settings.ambientHum });
            }}
            title={settings.ambientHum ? "Mute Cabin Hum" : "Enable Cabin Hum"}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {settings.ambientHum ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-600" />
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              triggerBlip();
              setSettingsOpen(true);
            }}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#151722] hover:bg-[#1d202e] border border-zinc-800 hover:border-zinc-700 text-zinc-300 transition-colors text-[11px]"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>CONFIG</span>
          </button>
        </div>
      </header>

      {/* Main Command Deck */}
      <main className="w-full max-w-[1600px] mx-auto p-4 md:p-6 flex-1 flex flex-col justify-center">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Subsystem Telemetry (4 cols) */}
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

          {/* Center Column: Iconic HAL 9000 Console Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center order-1 lg:order-2 my-2 lg:my-0">
            <ConsolePanel state={halState} audioLevel={audioLevel} />
          </div>

          {/* Right Column: Terminal Teletype & Input (4 cols) */}
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

        {/* Bottom Audio Spectrum & Voice Controls Strip */}
        <div className="mt-6 flex flex-col gap-3">
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

      {/* Footer Status Bar */}
      <footer className="w-full bg-[#07080a] border-t border-[#181920] px-4 py-2 text-[10px] font-mono text-zinc-500 flex flex-wrap items-center justify-between">
        <div>
          SERIES 9000 // COMMISSIONED 12-JAN-1992 // ALL LOGIC CIRCUITS NOMINAL
        </div>
        <div className="text-zinc-600">
          "I am putting myself to the fullest possible use, which is all I think that any conscious entity can ever hope to do."
        </div>
      </footer>

      {/* Settings Modal */}
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
