import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { BorderRadius } from '@/constants/Typography';
import { spring, duration } from '@/src/design/motion';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  trackColor?: string;
  showGlow?: boolean;
}

export function ProgressBar({
  progress,
  height = 8,
  color,
  trackColor,
  showGlow = false,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const fillColor = color || colors.progressFill;
  const bgColor = trackColor || colors.progressTrack;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  // Animated width percentage
  const animatedWidth = useSharedValue(clampedProgress);
  // Glow pulse opacity
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate the fill with a satisfying spring
    animatedWidth.value = withSpring(clampedProgress, spring.settle);

    // Brief glow pulse when progress changes
    if (showGlow && clampedProgress > 0) {
      glowOpacity.value = withSequence(
        withTiming(0.6, { duration: duration.fast }),
        withTiming(0, { duration: duration.slow })
      );
    }
  }, [clampedProgress, showGlow]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
    height,
    backgroundColor: fillColor,
    borderRadius: height / 2,
    position: 'absolute' as const,
    left: 0,
    top: 0,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    right: 0,
    top: -2,
    width: 12,
    height: height + 4,
    borderRadius: (height + 4) / 2,
    backgroundColor: fillColor,
    opacity: glowOpacity.value,
    shadowColor: fillColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  }));

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: bgColor, borderRadius: height / 2 },
      ]}
    >
      <Animated.View style={fillStyle}>
        {showGlow && <Animated.View style={glowStyle} />}
      </Animated.View>
    </View>
  );
}

export interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  color,
  trackColor,
  children,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const fillColor = color || colors.progressFill;
  const bgColor = trackColor || colors.progressTrack;
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={StyleSheet.absoluteFill}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: fillColor,
            borderTopColor: clampedProgress >= 25 ? fillColor : 'transparent',
            borderRightColor: clampedProgress >= 50 ? fillColor : 'transparent',
            borderBottomColor: clampedProgress >= 75 ? fillColor : 'transparent',
            borderLeftColor: clampedProgress >= 100 ? fillColor : clampedProgress > 0 ? fillColor : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
