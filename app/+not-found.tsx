import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Typography, Spacing } from '@/constants/Typography';

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ fontSize: 64, marginBottom: Spacing.xxl }}>🤔</Text>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center' }]}>
          This screen doesn't exist
        </Text>
        <Link href="/" style={{ marginTop: Spacing.xxl }}>
          <Text style={[Typography.bodyBold, { color: colors.primary }]}>
            Go to Home
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
