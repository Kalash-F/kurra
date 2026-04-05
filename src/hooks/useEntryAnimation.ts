import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { duration, curve } from '@/src/design/motion';
import { useReducedMotion } from './useReducedMotion';

/**
 * Fade-up entry animation for mounting components.
 *
 * Usage:
 * ```tsx
 * const entryStyle = useEntryAnimation(100); // 100ms delay
 * <Animated.View style={entryStyle}>
 *   <MyComponent />
 * </Animated.View>
 * ```
 */
export function useEntryAnimation(delay: number = 0) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(reduced ? 1 : 0);
  const translateY = useSharedValue(reduced ? 0 : 12);

  useEffect(() => {
    if (reduced) return;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: duration.medium, easing: curve.enter })
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: duration.medium, easing: curve.enter })
    );
  }, [delay, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
}
