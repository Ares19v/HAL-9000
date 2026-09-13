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
  const lastEmittedRef = useRef<string>('');

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
    recognition.maxAlternatives = 1;

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
        console.warn("[SpeechRecognition] status notice:", event.error);
      }
    };

    const commitTranscript = (rawText: string) => {
      const clean = rawText.trim();
      if (!clean || clean.length < 2) return;
      if (clean.toLowerCase() === lastEmittedRef.current.toLowerCase()) return;

      // Capitalize first character
      const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
      lastEmittedRef.current = clean;
      setInterimText('');
      onTranscript(formatted);
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
        commitTranscript(finalTranscript);
      } else if (vadEnabled && currentInterim.trim()) {
        // VAD pause detection: 780ms of silence commits phrase for fast turn-taking
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (currentInterim.trim()) {
            commitTranscript(currentInterim);
          }
        }, 780);
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
