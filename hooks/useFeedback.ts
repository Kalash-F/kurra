import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

/**
 * Hook for providing tactile + haptic feedback on quiz answers.
 * Uses expo-haptics for device vibration patterns.
 */
export function useFeedback() {
  const correctFeedback = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const incorrectFeedback = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const tapFeedback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return { correctFeedback, incorrectFeedback, tapFeedback };
}
