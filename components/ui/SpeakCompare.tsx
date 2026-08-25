import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';
import type { RecordingUiState } from '@/hooks/useRecording';

interface SpeakCompareProps {
  state: RecordingUiState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayUser: () => void;
  onPlayModel: () => void;
  onRetake: () => void;
  /** When mic is denied, parent can show reveal path instead */
  onRevealFallback?: () => void;
  modelLabel?: string;
}

/**
 * Presentational compare UI driven by lifted useRecording state.
 * Primary post-record action: play user, then play model.
 */
export function SpeakCompare({
  state,
  onStartRecording,
  onStopRecording,
  onPlayUser,
  onPlayModel,
  onRetake,
  onRevealFallback,
  modelLabel = 'Model',
}: SpeakCompareProps) {
  const { colors } = useTheme();

  if (state === 'permissionDenied') {
    return (
      <View style={styles.wrap}>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md }]}>
          Microphone access denied. You can still continue by revealing the phrase.
        </Text>
        {onRevealFallback && (
          <Button title="Reveal phrase" onPress={onRevealFallback} variant="outline" fullWidth />
        )}
      </View>
    );
  }

  if (state === 'idle') {
    return (
      <View style={styles.wrap}>
        <TouchableOpacity
          style={[styles.recordBtn, { backgroundColor: colors.error }]}
          onPress={onStartRecording}
          activeOpacity={0.7}
          accessibilityLabel="Start recording"
        >
          <Text style={{ fontSize: 28 }}>🎙️</Text>
        </TouchableOpacity>
        <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.md, textAlign: 'center' }]}>
          Tap to record your take
        </Text>
      </View>
    );
  }

  if (state === 'recording') {
    return (
      <View style={styles.wrap}>
        <TouchableOpacity
          style={[styles.recordBtn, { backgroundColor: colors.error, opacity: 0.9 }]}
          onPress={onStopRecording}
          activeOpacity={0.7}
          accessibilityLabel="Stop recording"
        >
          <View style={styles.stopIcon} />
        </TouchableOpacity>
        <Text style={[Typography.captionBold, { color: colors.error, marginTop: Spacing.md, textAlign: 'center' }]}>
          Recording… tap to stop
        </Text>
      </View>
    );
  }

  const isPlaying = state === 'playingUser' || state === 'playingModel';

  return (
    <View style={styles.wrap}>
      <Text style={[Typography.captionBold, { color: colors.textSecondary, marginBottom: Spacing.md, textAlign: 'center' }]}>
        Compare your take
      </Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.compareBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}
          onPress={onPlayUser}
          disabled={isPlaying && state !== 'playingUser'}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 20 }}>🎧</Text>
          <Text style={[Typography.captionBold, { color: colors.primary, marginTop: Spacing.xs }]}>
            {state === 'playingUser' ? 'Playing you…' : 'You'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.compareBtn, { backgroundColor: colors.secondary + '18', borderColor: colors.secondary }]}
          onPress={onPlayModel}
          disabled={isPlaying && state !== 'playingModel'}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 20 }}>🔊</Text>
          <Text style={[Typography.captionBold, { color: colors.secondary, marginTop: Spacing.xs }]}>
            {state === 'playingModel' ? 'Playing model…' : modelLabel}
          </Text>
        </TouchableOpacity>
      </View>
      <Button title="Retake" onPress={onRetake} variant="ghost" size="small" style={{ marginTop: Spacing.md }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  recordBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  compareBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
});
