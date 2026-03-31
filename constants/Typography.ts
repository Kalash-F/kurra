import { StyleSheet, Platform } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const devanagariFont = Platform.select({
  ios: 'DevanagariSangamMN',
  android: 'NotoSansDevanagari',
  default: 'serif',
});

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  captionBold: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  devanagariLarge: {
    fontSize: 72,
    fontWeight: '400',
    lineHeight: 90,
  },
  devanagariMedium: {
    fontSize: 48,
    fontWeight: '400',
    lineHeight: 60,
  },
  devanagariSmall: {
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 36,
  },
  devanagariBody: {
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 28,
  },
  romanized: {
    fontSize: 18,
    fontWeight: '400',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  buttonLarge: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  buttonMedium: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  streak: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 44,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  massive: 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};
