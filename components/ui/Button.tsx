import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing, Typography } from '@/constants/Typography';
import { usePressAnimation } from '@/src/hooks/usePressAnimation';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: BorderRadius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.sm,
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
      medium: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
      large: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: colors.secondary },
      outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.primary },
      ghost: { backgroundColor: 'transparent' },
    };

    return {
      ...base,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(disabled && { opacity: 0.5 }),
      ...(fullWidth && { width: '100%' }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      small: Typography.buttonSmall,
      medium: Typography.buttonMedium,
      large: Typography.buttonLarge,
    };

    const colorMap: Record<string, string> = {
      primary: '#FFFFFF',
      secondary: '#FFFFFF',
      outline: colors.primary,
      ghost: colors.primary,
    };

    return {
      ...sizeStyles[size],
      color: colorMap[variant],
    };
  };

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={disabled || loading ? undefined : onPressIn}
        onPressOut={disabled || loading ? undefined : onPressOut}
        disabled={disabled || loading}
        style={getButtonStyle()}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' || variant === 'secondary' ? '#FFF' : colors.primary} />
        ) : (
          <>
            {icon}
            <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
