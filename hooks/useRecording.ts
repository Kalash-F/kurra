import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type RecordingUiState =
  | 'idle'
  | 'recording'
  | 'recorded'
  | 'playingUser'
  | 'playingModel'
  | 'permissionDenied';

export interface UseRecordingResult {
  state: RecordingUiState;
  uri: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playUser: () => Promise<void>;
  playModel: (playModelAudio: () => Promise<void> | void) => Promise<void>;
  retake: () => Promise<void>;
  reset: () => Promise<void>;
  cleanup: () => Promise<void>;
}

/**
 * One-take recorder with compare playback.
 * States: idle → recording → recorded → playingUser → playingModel
 * Retake replaces the current take. Cleanup on unmount.
 * Mic denial sets permissionDenied and never throws.
 */
export function useRecording(): UseRecordingResult {
  const [state, setState] = useState<RecordingUiState>('idle');
  const [uri, setUri] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const mountedRef = useRef(true);

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // already unloaded
      }
      soundRef.current = null;
    }
  }, []);

  const unloadRecording = useCallback(async () => {
    if (recordingRef.current) {
      try {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording) {
          await recordingRef.current.stopAndUnloadAsync();
        } else {
          await recordingRef.current.stopAndUnloadAsync().catch(() => {});
        }
      } catch {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch {
          // ignore
        }
      }
      recordingRef.current = null;
    }
  }, []);

  const cleanup = useCallback(async () => {
    await unloadSound();
    await unloadRecording();
  }, [unloadRecording, unloadSound]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  const reset = useCallback(async () => {
    await cleanup();
    if (!mountedRef.current) return;
    setUri(null);
    setState((prev) => (prev === 'permissionDenied' ? 'permissionDenied' : 'idle'));
  }, [cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        if (mountedRef.current) setState('permissionDenied');
        return;
      }

      await unloadSound();
      await unloadRecording();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;

      if (mountedRef.current) {
        setUri(null);
        setState('recording');
      }
    } catch {
      if (mountedRef.current) setState('permissionDenied');
    }
  }, [unloadRecording, unloadSound]);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const nextUri = recording.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });

      if (mountedRef.current) {
        setUri(nextUri);
        setState(nextUri ? 'recorded' : 'idle');
      }
    } catch {
      recordingRef.current = null;
      if (mountedRef.current) setState('idle');
    }
  }, []);

  const playUser = useCallback(async () => {
    if (!uri) return;
    await unloadSound();

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      if (mountedRef.current) setState('playingUser');

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
          if (mountedRef.current) setState('recorded');
        }
      });
    } catch {
      if (mountedRef.current) setState('recorded');
    }
  }, [uri, unloadSound]);

  const playModel = useCallback(
    async (playModelAudio: () => Promise<void> | void) => {
      await unloadSound();
      if (mountedRef.current) setState('playingModel');
      try {
        await playModelAudio();
      } finally {
        // Model playback may be fire-and-forget TTS; return to recorded promptly.
        if (mountedRef.current) setState(uri ? 'recorded' : 'idle');
      }
    },
    [uri, unloadSound]
  );

  const retake = useCallback(async () => {
    await cleanup();
    if (mountedRef.current) {
      setUri(null);
      setState('idle');
    }
    await startRecording();
  }, [cleanup, startRecording]);

  return {
    state,
    uri,
    startRecording,
    stopRecording,
    playUser,
    playModel,
    retake,
    reset,
    cleanup,
  };
}
