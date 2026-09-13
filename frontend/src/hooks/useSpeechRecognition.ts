import { useEffect, useRef, useState, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onTranscript: (text: string) => void;
  onSpeechStart?: () => void;
  vadEnabled: boolean;
}

export function useSpeechRecognition({
  onTranscript,
  onSpeechStart,
  vadEnabled
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [supported, setSupported] = useState<boolean>(true);
  const [interimText, setInterimText] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const manualListeningRef = useRef<boolean>(false);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      // Auto-restart if VAD is active or user had manually toggled listening
      if (vadEnabled || manualListeningRef.current) {
        try {
          recognition.start();
        } catch {}
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn("[SpeechRecognition] error:", event.error);
      }
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          currentInterim += item[0].transcript;
        }
      }

      if (currentInterim || finalTranscript) {
        if (onSpeechStart) onSpeechStart();
      }

      setInterimText(currentInterim);

      if (finalTranscript.trim()) {
        setInterimText('');
        onTranscript(finalTranscript.trim());
      } else if (vadEnabled && currentInterim.trim()) {
        // VAD pause detection: if user stops speaking for 900ms, commit interim text
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (currentInterim.trim()) {
            onTranscript(currentInterim.trim());
            setInterimText('');
          }
        }, 950);
      }
    };

    recognitionRef.current = recognition;

    if (vadEnabled) {
      try {
        recognition.start();
        manualListeningRef.current = true;
      } catch {}
    }

    return () => {
      manualListeningRef.current = false;
      try {
        recognition.stop();
      } catch {}
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [vadEnabled, onTranscript, onSpeechStart]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      manualListeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      setInterimText('');
    } else {
      manualListeningRef.current = true;
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {}
    }
  }, [isListening]);

  return {
    isListening,
    supported,
    interimText,
    toggleListening
  };
}
