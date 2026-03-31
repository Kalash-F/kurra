import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProgress } from '@/context/ProgressContext';
import { Card } from '@/components/ui/Card';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

export default function SettingsScreen() {
  const { mode, setMode, colors, isDark } = useTheme();
  const { profile, updateProfile, resetProfile } = useUser();
  const { resetProgress, progress } = useProgress();

  const handlePathChange = async () => {
    const newPath = profile.path === 'speaking' ? 'speaking_script' : 'speaking';
    await updateProfile({ path: newPath });
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Everything',
      'This will clear all your progress, streak, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetProgress();
            await resetProfile();
          },
        },
      ]
    );
  };

  const completedSpeaking = Object.values(progress.speakingLessons).filter(l => l.completed).length;
  const completedScript = Object.values(progress.scriptLessons).filter(l => l.completed).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[Typography.h2, { color: colors.text }]}>Settings</Text>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md }]}>
            APPEARANCE
          </Text>
          <Card variant="outlined" padding="none">
            {(['light', 'dark', 'system'] as const).map((themeMode, idx) => (
              <TouchableOpacity
                key={themeMode}
                style={[
                  styles.settingRow,
                  idx < 2 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
                onPress={() => setMode(themeMode)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20, marginRight: Spacing.md }}>
                  {themeMode === 'light' ? '☀️' : themeMode === 'dark' ? '🌙' : '📱'}
                </Text>
                <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>
                  {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
                </Text>
                {mode === themeMode && (
                  <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '700' }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        </View>

        {/* Learning Path */}
        <View style={styles.section}>
          <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md }]}>
            LEARNING PATH
          </Text>
          <Card variant="outlined" padding="none">
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handlePathChange}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20, marginRight: Spacing.md }}>
                {profile.path === 'speaking_script' ? '📖' : '🗣️'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.body, { color: colors.text }]}>
                  {profile.path === 'speaking_script' ? 'Speaking + Script' : 'Speaking Only'}
                </Text>
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                  Tap to switch path
                </Text>
              </View>
              <View style={[styles.switchBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[Typography.small, { color: colors.primary, fontWeight: '600' }]}>
                  Switch
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md }]}>
            PREFERENCES
          </Text>
          <Card variant="outlined" padding="none">
            <View style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <Text style={{ fontSize: 20, marginRight: Spacing.md }}>🔤</Text>
              <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>
                Show Romanized Text
              </Text>
              <Switch
                value={profile.showRomanized}
                onValueChange={(val) => updateProfile({ showRomanized: val })}
                trackColor={{ false: colors.progressTrack, true: colors.primary + '60' }}
                thumbColor={profile.showRomanized ? colors.primary : colors.textTertiary}
              />
            </View>
            <View style={styles.settingRow}>
              <Text style={{ fontSize: 20, marginRight: Spacing.md }}>🐢</Text>
              <Text style={[Typography.body, { color: colors.text, flex: 1 }]}>
                Slow Audio
              </Text>
              <Switch
                value={profile.audioSpeed === 'slow'}
                onValueChange={(val) => updateProfile({ audioSpeed: val ? 'slow' : 'normal' })}
                trackColor={{ false: colors.progressTrack, true: colors.primary + '60' }}
                thumbColor={profile.audioSpeed === 'slow' ? colors.primary : colors.textTertiary}
              />
            </View>
          </Card>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md }]}>
            STATISTICS
          </Text>
          <Card variant="outlined" padding="medium">
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[Typography.h3, { color: colors.primary }]}>
                  {progress.streak.current}
                </Text>
                <Text style={[Typography.small, { color: colors.textSecondary }]}>
                  Current Streak
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[Typography.h3, { color: colors.accent }]}>
                  {progress.streak.longest}
                </Text>
                <Text style={[Typography.small, { color: colors.textSecondary }]}>
                  Best Streak
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[Typography.h3, { color: colors.secondary }]}>
                  {completedSpeaking}
                </Text>
                <Text style={[Typography.small, { color: colors.textSecondary }]}>
                  Speaking Done
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[Typography.h3, { color: colors.secondary }]}>
                  {completedScript}
                </Text>
                <Text style={[Typography.small, { color: colors.textSecondary }]}>
                  Script Done
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { marginBottom: Spacing.huge }]}>
          <Text style={[Typography.label, { color: colors.error, marginBottom: Spacing.md }]}>
            DANGER ZONE
          </Text>
          <TouchableOpacity
            style={[styles.dangerButton, { borderColor: colors.error }]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Text style={[Typography.bodyBold, { color: colors.error }]}>
              Reset All Progress
            </Text>
          </TouchableOpacity>
        </View>

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={[Typography.caption, { color: colors.textTertiary, textAlign: 'center' }]}>
            Kurra v1.0.0
          </Text>
          <Text style={[Typography.small, { color: colors.textTertiary, textAlign: 'center', marginTop: Spacing.xs }]}>
            Learn real Nepali 🇳🇵
          </Text>
        </View>

        <View style={{ height: Spacing.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  switchBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  dangerButton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
  },
  appInfo: {
    paddingVertical: Spacing.xxl,
  },
});
