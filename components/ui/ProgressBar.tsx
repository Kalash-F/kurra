import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { BorderRadius } from '@/constants/Typography';

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

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: bgColor, borderRadius: height / 2 },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            height,
            backgroundColor: fillColor,
            borderRadius: height / 2,
            ...(showGlow && {
              shadowColor: fillColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 6,
            }),
          },
        ]}
      />
    </View>
  );
}

interface ProgressRingProps {
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
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * clampedProgress) / 100;

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
        {/* Simple visual overlay for progress */}
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
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
