import { useCallback } from 'react';
import * as Speech from 'expo-speech';

export function useSpeech() {
  const speak = useCallback((text: string, options?: { rate?: number; language?: string }) => {
    Speech.stop();
    Speech.speak(text, {
      language: options?.language || 'ne-NP',
      rate: options?.rate || 0.85,
      pitch: 1.0,
    });
  }, []);

  const speakEnglish = useCallback((text: string) => {
    Speech.stop();
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      pitch: 1.0,
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
  }, []);

  return { speak, speakEnglish, stop };
}
