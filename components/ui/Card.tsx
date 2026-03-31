import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { BorderRadius, Spacing } from '@/constants/Typography';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export function Card({ children, style, variant = 'default', padding = 'medium' }: CardProps) {
  const { colors } = useTheme();

  const paddingMap = {
    none: 0,
    small: Spacing.md,
    medium: Spacing.lg,
    large: Spacing.xxl,
  };

  const getStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: BorderRadius.lg,
      padding: paddingMap[padding],
    };

    switch (variant) {
      case 'elevated':
        return {
          ...base,
          backgroundColor: colors.surfaceElevated,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 4,
        };
      case 'outlined':
        return {
          ...base,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return {
          ...base,
          backgroundColor: colors.card,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 2,
        };
    }
  };

  return <View style={[getStyle(), style]}>{children}</View>;
}
