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
  it('permission denial sets permissionDenied and clears URI', () => {
    const fromRecording = reduceRecording(
      { state: 'recording', uri: null },
      { type: 'permission_denied' }
    );
    assert.deepEqual(fromRecording, { state: 'permissionDenied', uri: null });

    const fromRecorded = reduceRecording(recorded(), { type: 'permission_denied' });
    assert.equal(fromRecorded.state, 'permissionDenied');
    assert.equal(fromRecorded.uri, null);
  });

  it('permissionDenied is sticky across reset', () => {
    const denied = reduceRecording(INITIAL_RECORDING_SNAPSHOT, { type: 'permission_denied' });
    const afterReset = reduceRecording(denied, { type: 'reset' });
    assert.deepEqual(afterReset, { state: 'permissionDenied', uri: null });
  });

  it('unmount cleanup stops and discards URI', () => {
    const afterCleanup = reduceRecording(recorded('file:///live.m4a'), { type: 'unmount_cleanup' });
    assert.deepEqual(afterCleanup, { state: 'idle', uri: null });

    const fromPlaying = reduceRecording(
      { state: 'playingUser', uri: 'file:///live.m4a' },
      { type: 'unmount_cleanup' }
    );
    assert.equal(fromPlaying.state, 'idle');
    assert.equal(fromPlaying.uri, null);
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

  it('happy path: idle → recording → recorded → playingUser → recorded', () => {
    let snap = INITIAL_RECORDING_SNAPSHOT;
    snap = reduceRecording(snap, { type: 'recording_started' });
    assert.equal(snap.state, 'recording');

    snap = reduceRecording(snap, { type: 'recording_stopped', uri: 'file:///a.m4a' });
    assert.equal(snap.state, 'recorded');
    assert.equal(snap.uri, 'file:///a.m4a');

    snap = reduceRecording(snap, { type: 'play_user' });
    assert.equal(snap.state, 'playingUser');

    snap = reduceRecording(snap, { type: 'playback_finished' });
    assert.deepEqual(snap, { state: 'recorded', uri: 'file:///a.m4a' });
  });
});
