import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { soundManager } from '@/src/design/sound';
import { useReducedMotion } from './useReducedMotion';

/**
 * Combined feedback effects hook.
 *
 * Triggers haptic + sound in a single call. Animation triggers
 * are handled by shared values in the component — this hook
 * only handles the non-visual feedback channels.
 *
 * Replaces the simpler `useFeedback` hook for full-spectrum feedback.
 */
export function useFeedbackEffects() {
  const reducedMotion = useReducedMotion();

  const onCorrect = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    soundManager.play('correct');
  }, []);

  const onIncorrect = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    soundManager.play('incorrect');
  }, []);

  const onTap = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    soundManager.play('tap');
  }, []);

  const onSelect = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    soundManager.play('select');
  }, []);

  const onComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    soundManager.play('complete');
  }, []);

  const onStreak = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    soundManager.play('streak');
  }, []);

  const onProgress = useCallback(() => {
    soundManager.play('progress');
  }, []);

  const onLevelUp = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    soundManager.play('levelup');
  }, []);

  return {
    onCorrect,
    onIncorrect,
    onTap,
    onSelect,
    onComplete,
    onStreak,
    onProgress,
    onLevelUp,
    reducedMotion,
  };
}
