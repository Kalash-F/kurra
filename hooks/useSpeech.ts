import { useCallback, useRef } from 'react';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { phraseAudioMapFemale, phraseAudioMapMale, scriptAudioMapFemale, scriptAudioMapMale } from '../constants/audioMap';
import { useUser } from '../context/UserContext';

export function useSpeech() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const { profile } = useUser();

  const stop = useCallback(async () => {
    Speech.stop();
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (e) {
        // ignore errors on unload when it's already unloaded
      }
      soundRef.current = null;
    }
  }, []);

  const speak = useCallback(async (
    text: string, 
    options?: { rate?: number; language?: string; audioFile?: string }
  ) => {
    await stop();

    // Check if we have a pre-generated audio file
    if (options?.audioFile) {
      try {
        const phraseMap = profile.voicePreference === 'male' ? phraseAudioMapMale : phraseAudioMapFemale;
        const scriptMap = profile.voicePreference === 'male' ? scriptAudioMapMale : scriptAudioMapFemale;
        const audioAsset = phraseMap[options.audioFile] || scriptMap[options.audioFile];
        if (audioAsset) {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
          });

          const { sound } = await Audio.Sound.createAsync(audioAsset, { shouldPlay: true });
          soundRef.current = sound;
          
          // Apply playback rate if requested natively or via profile
          const requestedRate = options.rate || (profile.audioSpeed === 'slow' ? 0.5 : 1.0);
          if (requestedRate && requestedRate !== 1.0) {
            await sound.setRateAsync(requestedRate, true);
          }
          
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              sound.unloadAsync().catch(() => {});
              if (soundRef.current === sound) {
                soundRef.current = null;
              }
            }
          });
          return; // Skip fallback if successful
        }
      } catch (err) {
        console.warn(`Failed to play local audio file ${options.audioFile}, falling back to TTS`, err);
      }
    }

    // Fallback to TTS using device's speech engine
    Speech.speak(text, {
      language: options?.language || 'ne-NP',
      rate: options?.rate || 0.85,
      pitch: 1.0,
    });
  }, [stop]);

  const speakEnglish = useCallback(async (text: string) => {
    await stop();
    Speech.speak(text, {
      language: 'en-US',
      rate: 0.9,
      pitch: 1.0,
    });
  }, [stop]);

  return { speak, speakEnglish, stop };
}
