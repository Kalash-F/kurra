import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import {
  INITIAL_RECORDING_SNAPSHOT,
  reduceRecording,
  type RecordingSnapshot,
  type RecordingUiState,
} from './recordingState';

export type { RecordingUiState } from './recordingState';

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
  const [snapshot, setSnapshot] = useState<RecordingSnapshot>(INITIAL_RECORDING_SNAPSHOT);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const mountedRef = useRef(true);
  const uriRef = useRef<string | null>(null);

  const apply = useCallback((event: Parameters<typeof reduceRecording>[1]) => {
    setSnapshot((prev) => {
      const next = reduceRecording(prev, event);
      uriRef.current = next.uri;
      return next;
    });
  }, []);

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
      void cleanup().then(() => {
        // Mirror unmount stop: discard URI / leave recording
        uriRef.current = null;
      });
    };
  }, [cleanup]);

  const reset = useCallback(async () => {
    await cleanup();
    if (!mountedRef.current) return;
    apply({ type: 'reset' });
  }, [apply, cleanup]);

  const startRecording = useCallback(async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        if (mountedRef.current) apply({ type: 'permission_denied' });
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

      if (mountedRef.current) apply({ type: 'recording_started' });
    } catch {
      if (mountedRef.current) apply({ type: 'permission_denied' });
    }
  }, [apply, unloadRecording, unloadSound]);

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

      if (mountedRef.current) apply({ type: 'recording_stopped', uri: nextUri });
    } catch {
      recordingRef.current = null;
      if (mountedRef.current) apply({ type: 'recording_stopped', uri: null });
    }
  }, [apply]);

  const playUser = useCallback(async () => {
    const uri = uriRef.current;
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
      if (mountedRef.current) apply({ type: 'play_user' });

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
          if (mountedRef.current) apply({ type: 'playback_finished' });
        }
      });
    } catch {
      if (mountedRef.current) apply({ type: 'playback_finished' });
    }
  }, [apply, unloadSound]);

  const playModel = useCallback(
    async (playModelAudio: () => Promise<void> | void) => {
      await unloadSound();
      if (mountedRef.current) apply({ type: 'play_model' });
      try {
        await playModelAudio();
      } finally {
        if (mountedRef.current) apply({ type: 'playback_finished' });
      }
    },
    [apply, unloadSound]
  );

  const retake = useCallback(async () => {
    await cleanup();
    if (mountedRef.current) apply({ type: 'retake_cleared' });
    await startRecording();
  }, [apply, cleanup, startRecording]);

  return {
    state: snapshot.state,
    uri: snapshot.uri,
    startRecording,
    stopRecording,
    playUser,
    playModel,
    retake,
    reset,
    cleanup,
  };
}
