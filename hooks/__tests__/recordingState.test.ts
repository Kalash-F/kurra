import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  INITIAL_RECORDING_SNAPSHOT,
  reduceRecording,
  type RecordingSnapshot,
} from '../recordingState';

function recorded(uri = 'file:///take-1.m4a'): RecordingSnapshot {
  return { state: 'recorded', uri };
}

describe('recording state machine', () => {
  it('granted === false → permission_denied only', () => {
    // Simulates requestPermissionsAsync().granted === false
    const denied = reduceRecording(INITIAL_RECORDING_SNAPSHOT, { type: 'permission_denied' });
    assert.deepEqual(denied, { state: 'permissionDenied', uri: null });
  });

  it('sticky permissionDenied only after real OS denial', () => {
    const denied = reduceRecording(INITIAL_RECORDING_SNAPSHOT, { type: 'permission_denied' });
    const afterReset = reduceRecording(denied, { type: 'reset' });
    assert.deepEqual(afterReset, { state: 'permissionDenied', uri: null });
  });

  it('other start errors → idle (retryable), never permission_denied', () => {
    // Simulates prepare / audio-session / other throws in startRecording catch
    const afterGlitch = reduceRecording(INITIAL_RECORDING_SNAPSHOT, { type: 'start_failed' });
    assert.equal(afterGlitch.state, 'idle');
    assert.equal(afterGlitch.uri, null);
    assert.notEqual(afterGlitch.state, 'permissionDenied');

    const fromMidStart = reduceRecording({ state: 'recording', uri: null }, { type: 'start_failed' });
    assert.deepEqual(fromMidStart, { state: 'idle', uri: null });
  });

  it('reset clears non-OS errors (start_failed is not sticky)', () => {
    const failed = reduceRecording(INITIAL_RECORDING_SNAPSHOT, { type: 'start_failed' });
    assert.equal(failed.state, 'idle');

    const afterReset = reduceRecording(failed, { type: 'reset' });
    assert.deepEqual(afterReset, { state: 'idle', uri: null });

    // Retry path remains open
    const restarted = reduceRecording(afterReset, { type: 'recording_started' });
    assert.equal(restarted.state, 'recording');
  });

  it('unmount cleanup stops and discards URI (including mid-prepare)', () => {
    const afterCleanup = reduceRecording(recorded('file:///live.m4a'), { type: 'unmount_cleanup' });
    assert.deepEqual(afterCleanup, { state: 'idle', uri: null });

    const midPrepare = reduceRecording({ state: 'recording', uri: null }, { type: 'unmount_cleanup' });
    assert.deepEqual(midPrepare, { state: 'idle', uri: null });
  });

  it('retake discards the previous URI before a new take', () => {
    const afterRetake = reduceRecording(recorded('file:///old-take.m4a'), { type: 'retake_cleared' });
    assert.deepEqual(afterRetake, { state: 'idle', uri: null });

    const restarted = reduceRecording(afterRetake, { type: 'recording_started' });
    assert.deepEqual(restarted, { state: 'recording', uri: null });

    const newTake = reduceRecording(restarted, {
      type: 'recording_stopped',
      uri: 'file:///new-take.m4a',
    });
    assert.deepEqual(newTake, { state: 'recorded', uri: 'file:///new-take.m4a' });
  });
});
