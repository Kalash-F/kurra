import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';
import { interaction } from '@/src/design/motion';

/**
 * Animated streak flame icon.
 * Breathes gently on a slow loop.
 */
export function StreakFlame() {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(interaction.breatheMax, { duration: interaction.breatheCycle / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: interaction.breatheCycle / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1, // infinite
      true // reverse
    );
  }, [reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={{ fontSize: 18 }}>🔥</Text>
    </Animated.View>
  );
}
