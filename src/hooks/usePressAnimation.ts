import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spring, interaction } from '@/src/design/motion';
import { useReducedMotion } from './useReducedMotion';

interface PressAnimationOptions {
  /** Scale target on press. Default: 0.96 (button) */
  pressScale?: number;
  /** Whether to fire haptic on press-in. Default: true */
  haptic?: boolean;
}

/**
 * Reanimated press animation hook.
 *
 * Returns an animated style and press handlers to wire onto
 * a Pressable component. Provides scale-down spring on press
 * with light haptic feedback.
 *
 * Usage:
 * ```tsx
 * const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();
 * <Animated.View style={animatedStyle}>
 *   <Pressable onPressIn={onPressIn} onPressOut={onPressOut}>
 *     ...
 *   </Pressable>
 * </Animated.View>
 * ```
 */
export function usePressAnimation(options?: PressAnimationOptions) {
  const reduced = useReducedMotion();
  const targetScale = options?.pressScale ?? interaction.pressScale;
  const shouldHaptic = options?.haptic ?? true;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    if (reduced) return {};
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onPressIn = useCallback(() => {
    if (!reduced) {
      scale.value = withSpring(targetScale, spring.press);
    }
    if (shouldHaptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [reduced, targetScale, shouldHaptic]);

  const onPressOut = useCallback(() => {
    if (!reduced) {
      scale.value = withSpring(1, spring.release);
    }
  }, [reduced]);

  return { animatedStyle, onPressIn, onPressOut };
}
