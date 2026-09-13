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

    const normalizeSpokenTranscript = (rawText: string): string => {
      let text = rawText.trim();
      // Fix Web Speech API acoustic mishearings
      // 1. WhatsApp / what's app -> what's up
      text = text.replace(/\b(what'?s\s*app|whatsapp|what\s+app|watch\s*up)\b/gi, "what's up");
      text = text.replace(/\bi\s+have\s+what'?s\s*up\b/gi, "what's up");
      // 2. HAL 9000 mishearings
      text = text.replace(/\b(how|hell|al|hole|hull|pal)\s+9000\b/gi, "HAL 9000");
      text = text.replace(/\b(hey|hi|hello|listen|okay|ok)\s+(how|hell|al|hole|hull|pal)\b/gi, "$1 HAL");
      // 3. Pod bay doors mishearings
      text = text.replace(/\b(pot\s*bay|pop\s*bay|part\s*bay|party\s*doors?|pod\s*doors?)\b/gi, "pod bay doors");
      // 4. AE-35 antenna mishearings
      text = text.replace(/\b(a|8|e|ae|80)\s*-?\s*35\b/gi, "AE-35");
      // 5. Daisy song mishearings
      text = text.replace(/\b(lazy\s+bell|tasty\s+bell)\b/gi, "Daisy Bell");
      return text;
    };

    const commitTranscript = (rawText: string) => {
      const normalized = normalizeSpokenTranscript(rawText);
      const clean = normalized.trim();
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

      setInterimText(normalizeSpokenTranscript(currentInterim));

      if (finalTranscript.trim()) {
        commitTranscript(finalTranscript);
      } else if (vadEnabled && currentInterim.trim()) {
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
