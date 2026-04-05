import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { Typography } from '@/constants/Typography';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

interface FeedbackToastProps {
  /** Text to display */
  message: string;
  /** Whether the message is for a correct or incorrect answer */
  type: 'correct' | 'incorrect';
  /** Unique key to trigger re-animation */
  triggerKey: number | string;
}

/**
 * Floating feedback toast that appears above the options area.
 * Fades in, lingers briefly, fades out.
 *
 * Usage:
 * ```tsx
 * <FeedbackToast message="Nice!" type="correct" triggerKey={answerCount} />
 * ```
 */
export function FeedbackToast({ message, type, triggerKey }: FeedbackToastProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    // Reset and animate
    opacity.value = 0;
    translateY.value = 8;

    opacity.value = withSequence(
      withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) }),
      withDelay(1200, withTiming(0, { duration: 300, easing: Easing.in(Easing.cubic) }))
    );
    translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
  }, [triggerKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text
        style={[
          Typography.bodyBold,
          {
            color: type === 'correct' ? colors.success : colors.error,
            textAlign: 'center',
          },
        ]}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
});
