export type RecordingUiState =
  | 'idle'
  | 'recording'
  | 'recorded'
  | 'playingUser'
  | 'playingModel'
  | 'permissionDenied';

export interface RecordingSnapshot {
  state: RecordingUiState;
  uri: string | null;
}

export type RecordingEvent =
  | { type: 'permission_denied' }
  | { type: 'recording_started' }
  | { type: 'recording_stopped'; uri: string | null }
  | { type: 'play_user' }
  | { type: 'play_model' }
  | { type: 'playback_finished' }
  /** Clears the current take (URI discarded) before a new record starts. */
  | { type: 'retake_cleared' }
  | { type: 'reset' }
  /** Unmount / stop: drop URI and leave a non-recording idle snapshot. */
  | { type: 'unmount_cleanup' };

export const INITIAL_RECORDING_SNAPSHOT: RecordingSnapshot = {
  state: 'idle',
  uri: null,
};

/**
 * Pure recording UI state machine.
 * idle → recording → recorded → playingUser | playingModel
 * permission_denied is sticky across reset; retake discards URI.
 */
export function reduceRecording(
  prev: RecordingSnapshot,
  event: RecordingEvent
): RecordingSnapshot {
  switch (event.type) {
    case 'permission_denied':
      return { state: 'permissionDenied', uri: null };

    case 'recording_started':
      return { state: 'recording', uri: null };

    case 'recording_stopped':
      if (event.uri) {
        return { state: 'recorded', uri: event.uri };
      }
      return { state: 'idle', uri: null };

    case 'play_user':
      if (!prev.uri) return prev;
      return { ...prev, state: 'playingUser' };

    case 'play_model':
      return { ...prev, state: 'playingModel' };

    case 'playback_finished':
      return { ...prev, state: prev.uri ? 'recorded' : 'idle' };

    case 'retake_cleared':
      return { state: 'idle', uri: null };

    case 'reset':
      return prev.state === 'permissionDenied'
        ? { state: 'permissionDenied', uri: null }
        : { state: 'idle', uri: null };

    case 'unmount_cleanup':
      return { state: 'idle', uri: null };

    default:
      return prev;
  }
}
