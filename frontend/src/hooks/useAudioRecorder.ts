import { useState, useRef, useCallback } from 'react';

interface UseAudioRecorderProps {
  onAudioData: (base64Audio: string, format: string) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export function useAudioRecorder({
  onAudioData,
  onRecordingStart,
  onRecordingStop
}: UseAudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const actualMime = recorder.mimeType || 'audio/webm';
        const format = actualMime.includes('ogg') ? 'ogg' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        if (audioBlob.size > 500) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Audio = result.split(',')[1];
            if (base64Audio) {
              onAudioData(base64Audio, format);
            }
          };
          reader.readAsDataURL(audioBlob);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      if (onRecordingStart) onRecordingStart();
    } catch (err) {
      console.error('[useAudioRecorder] Mic access error:', err);
      setIsRecording(false);
    }
  }, [isRecording, onAudioData, onRecordingStart]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return;
    try {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (e) {
      console.warn('[useAudioRecorder] Stop error:', e);
    }
    setIsRecording(false);
    if (onRecordingStop) onRecordingStop();
  }, [isRecording, onRecordingStop]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    toggleRecording
  };
}
