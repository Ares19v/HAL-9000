import { useEffect, useRef, useState, useCallback } from 'react';

interface UseSpeechRecognitionProps {
  onTranscript: (text: string) => void;
  onSpeechStart?: () => void;
  vadEnabled: boolean;
  isHalSpeaking?: boolean;
}

export function useSpeechRecognition({
  onTranscript,
  onSpeechStart,
  vadEnabled,
  isHalSpeaking = false
}: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [supported, setSupported] = useState<boolean>(true);
  const [interimText, setInterimText] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const manualListeningRef = useRef<boolean>(false);
  const lastEmittedRef = useRef<string>('');

  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onSpeechStartRef = useRef(onSpeechStart);
  onSpeechStartRef.current = onSpeechStart;

  const isHalSpeakingRef = useRef(isHalSpeaking);
  isHalSpeakingRef.current = isHalSpeaking;

  const vadEnabledRef = useRef(vadEnabled);
  vadEnabledRef.current = vadEnabled;

  const isListeningRef = useRef<boolean>(false);

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
      isListeningRef.current = true;
      setIsListening(true);
    };

    recognition.onend = () => {
      // Auto-restart if VAD is active or user had manually toggled listening
      if (vadEnabledRef.current || manualListeningRef.current) {
        setTimeout(() => {
          if (vadEnabledRef.current || manualListeningRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        }, 60);
      } else {
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        console.warn("[SpeechRecognition] status notice:", event.error);
      }
    };

    const normalizeSpokenTranscript = (rawText: string): string => {
      let text = rawText.trim();
      // Fix Web Speech API acoustic mishearings
      text = text.replace(/\b(i('ve| have)?\s+)?(what'?s?\s*app|whatsapp|what\s+app|watch\s*up)(\s+how|\s+al|\s+hal)?\b/gi, "what's up HAL");
      text = text.replace(/\bi\s+have\s+what'?s?\s*(app|up)\b/gi, "what's up");
      text = text.replace(/\bhow\s+are\s+you\s+(how|al|hell)\b/gi, "how are you HAL");
      text = text.replace(/\b(how|hell|al|hole|hull|pal)\s+9000\b/gi, "HAL 9000");
      text = text.replace(/\b(hey|hi|hello|listen|okay|ok)\s+(how|hell|al|hole|hull|pal)\b/gi, "$1 HAL");
      text = text.replace(/\b(pot\s*bay|pop\s*bay|part\s*bay|party\s*doors?|pod\s*doors?)\b/gi, "pod bay doors");
      text = text.replace(/\b(a|8|e|ae|80)\s*-?\s*35\b/gi, "AE-35");
      text = text.replace(/\b(lazy\s+bell|tasty\s+bell)\b/gi, "Daisy Bell");
      return text;
    };

    const commitTranscript = (rawText: string) => {
      // Prevent committing if HAL is currently vocalizing through speakers
      if (isHalSpeakingRef.current) {
        return;
      }

      const normalized = normalizeSpokenTranscript(rawText);
      const clean = normalized.trim();
      if (!clean || clean.length < 2) return;
      if (clean.toLowerCase() === lastEmittedRef.current.toLowerCase()) return;

      const formatted = clean.charAt(0).toUpperCase() + clean.slice(1);
      lastEmittedRef.current = clean;
      setInterimText('');
      onTranscriptRef.current(formatted);

      // In push-to-talk mode (vadEnabled is false), automatically close the microphone
      // so HAL's voice playback does not bleed into the mic or create echo loops.
      if (!vadEnabledRef.current) {
        manualListeningRef.current = false;
        try {
          recognition.stop();
        } catch {}
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onresult = (event: any) => {
      // If HAL is vocalizing, ignore speaker bleed-in
      if (isHalSpeakingRef.current) {
        return;
      }

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
        if (onSpeechStartRef.current) onSpeechStartRef.current();
      }

      setInterimText(normalizeSpokenTranscript(currentInterim));

      if (finalTranscript.trim()) {
        commitTranscript(finalTranscript);
      } else if (vadEnabledRef.current && currentInterim.trim()) {
        // VAD pause detection: 450ms of silence commits phrase for fast, snappy turn-taking
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (currentInterim.trim()) {
            commitTranscript(currentInterim);
          }
        }, 450);
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
  }, [vadEnabled]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListeningRef.current) {
      manualListeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch {}
      isListeningRef.current = false;
      setIsListening(false);
      setInterimText('');
    } else {
      manualListeningRef.current = true;
      try {
        recognitionRef.current.start();
        isListeningRef.current = true;
        setIsListening(true);
      } catch {}
    }
  }, []);

  return {
    isListening,
    supported,
    interimText,
    toggleListening
  };
}
