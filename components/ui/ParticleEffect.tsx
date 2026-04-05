import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useReducedMotion } from '@/src/hooks/useReducedMotion';

interface ParticleEffectProps {
  /** Whether to trigger the effect */
  active: boolean;
  /** Number of particles (max 8 for performance) */
  count?: number;
  /** Colors to choose from */
  colors?: string[];
  /** Spread radius in pixels */
  spread?: number;
}

interface ParticleConfig {
  angle: number;
  distance: number;
  size: number;
  color: string;
  delay: number;
}

/**
 * Lightweight celebration particle effect.
 * 6-8 small circles scatter outward and fade.
 * Uses only transforms + opacity — no layout animations.
 *
 * Usage:
 * ```tsx
 * <ParticleEffect active={showCelebration} />
 * ```
 */
export function ParticleEffect({
  active,
  count = 8,
  colors = ['#E8733A', '#2A9D8F', '#E9C46A', '#4CAF50', '#F4A574', '#5EBDAF'],
  spread = 80,
}: ParticleEffectProps) {
  const reduced = useReducedMotion();
  const particleCount = Math.min(count, 8); // cap for performance

  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      angle: (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      distance: spread * (0.6 + Math.random() * 0.4),
      size: 6 + Math.random() * 6,
      color: colors[i % colors.length],
      delay: i * 30,
    }));
  }, [particleCount, spread]);

  if (reduced || !active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <Particle key={i} config={p} />
      ))}
    </View>
  );
}

function Particle({ config }: { config: ParticleConfig }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    const targetX = Math.cos(config.angle) * config.distance;
    const targetY = Math.sin(config.angle) * config.distance;

    // Burst out
    opacity.value = withDelay(config.delay, withTiming(1, { duration: 100 }));
    translateX.value = withDelay(
      config.delay,
      withSpring(targetX, { damping: 12, stiffness: 120 })
    );
    translateY.value = withDelay(
      config.delay,
      withSpring(targetY, { damping: 12, stiffness: 120 })
    );
    scale.value = withDelay(
      config.delay,
      withSpring(1, { damping: 8, stiffness: 200 })
    );

    // Fade out after scatter
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) });
      scale.value = withTiming(0.3, { duration: 400 });
    }, 300 + config.delay);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: config.size,
    height: config.size,
    borderRadius: config.size / 2,
    backgroundColor: config.color,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={animatedStyle} />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
