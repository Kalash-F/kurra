import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProgress } from '@/context/ProgressContext';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { speakingUnits } from '@/data/speakingUnits';
import { scriptUnits } from '@/data/scriptUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { profile } = useUser();
  const { progress, updateStreak, getSpeakingProgress, getScriptProgress, getReviewDue } = useProgress();

  useEffect(() => {
    updateStreak();
  }, []);

  const speakingProg = getSpeakingProgress();
  const scriptProg = getScriptProgress();
  const reviewDue = getReviewDue().length;
  const showScript = profile.path === 'speaking_script';

  // Find next incomplete lesson
  const nextSpeakingUnit = speakingUnits.find(
    (u) => !progress.speakingLessons[u.id]?.completed
  );
  const nextScriptUnit = showScript
    ? scriptUnits.find((u) => !progress.scriptLessons[u.id]?.completed)
    : null;

  const completedSpeaking = Object.values(progress.speakingLessons).filter(l => l.completed).length;
  const completedScript = Object.values(progress.scriptLessons).filter(l => l.completed).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>
              Welcome back
            </Text>
            <Text style={[Typography.h2, { color: colors.text }]}>Kurra</Text>
          </View>
          <TouchableOpacity
            style={[styles.streakBadge, { backgroundColor: colors.streakGlow }]}
            activeOpacity={0.7}
          >
            <Text style={styles.streakFire}>🔥</Text>
            <Text style={[Typography.bodyBold, { color: colors.streak }]}>
              {progress.streak.current}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Streak Card */}
        <Card style={styles.streakCard} variant="elevated">
          <View style={styles.streakCardInner}>
            <View style={styles.streakInfo}>
              <Text style={[Typography.h1, { color: colors.primary }]}>
                {progress.streak.current}
              </Text>
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                day streak
              </Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakInfo}>
              <Text style={[Typography.h3, { color: colors.text }]}>
                {progress.streak.longest}
              </Text>
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                best streak
              </Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakInfo}>
              <Text style={[Typography.h3, { color: colors.text }]}>
                {completedSpeaking + completedScript}
              </Text>
              <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                lessons done
              </Text>
            </View>
          </View>
        </Card>

        {/* Continue Learning */}
        {nextSpeakingUnit && (
          <View style={styles.section}>
            <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md }]}>
              CONTINUE LEARNING
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/lesson/${nextSpeakingUnit.id}`)}
            >
              <Card variant="elevated" padding="large">
                <View style={styles.lessonCardTop}>
                  <View style={[styles.unitIcon, { backgroundColor: nextSpeakingUnit.color + '20' }]}>
                    <Text style={{ fontSize: 28 }}>{nextSpeakingUnit.icon}</Text>
                  </View>
                  <View style={styles.lessonCardText}>
                    <Text style={[Typography.captionBold, { color: colors.textSecondary }]}>
                      Unit {speakingUnits.indexOf(nextSpeakingUnit) + 1}
                    </Text>
                    <Text style={[Typography.h4, { color: colors.text }]}>
                      {nextSpeakingUnit.title}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                      {nextSpeakingUnit.subtitle}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: Spacing.lg }}>
                  <ProgressBar progress={speakingProg} showGlow />
                  <Text style={[Typography.small, { color: colors.textTertiary, marginTop: Spacing.xs }]}>
                    {completedSpeaking} of {speakingUnits.length} units completed
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Script Learning */}
        {showScript && nextScriptUnit && (
          <View style={styles.section}>
            <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md }]}>
              SCRIPT LEARNING
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/script-lesson/${nextScriptUnit.id}`)}
            >
              <Card variant="elevated" padding="large">
                <View style={styles.lessonCardTop}>
                  <View style={[styles.unitIcon, { backgroundColor: nextScriptUnit.color + '20' }]}>
                    <Text style={{ fontSize: 28 }}>{nextScriptUnit.icon}</Text>
                  </View>
                  <View style={styles.lessonCardText}>
                    <Text style={[Typography.captionBold, { color: colors.textSecondary }]}>
                      Script Unit {scriptUnits.indexOf(nextScriptUnit) + 1}
                    </Text>
                    <Text style={[Typography.h4, { color: colors.text }]}>
                      {nextScriptUnit.title}
                    </Text>
                    <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                      {nextScriptUnit.subtitle}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: Spacing.lg }}>
                  <ProgressBar progress={scriptProg} color={colors.secondary} />
                  <Text style={[Typography.small, { color: colors.textTertiary, marginTop: Spacing.xs }]}>
                    {completedScript} of {scriptUnits.length} units completed
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Review */}
        <View style={styles.section}>
          <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md }]}>
            REVIEW
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/review')}
          >
            <Card variant="outlined" padding="large">
              <View style={styles.reviewRow}>
                <Text style={{ fontSize: 28 }}>🔄</Text>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={[Typography.bodyBold, { color: colors.text }]}>
                    {reviewDue > 0 ? `${reviewDue} items to review` : 'Review your progress'}
                  </Text>
                  <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                    {reviewDue > 0
                      ? 'Keep your skills sharp!'
                      : 'Great job! Nothing due right now.'}
                  </Text>
                </View>
                {reviewDue > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[Typography.captionBold, { color: '#FFF' }]}>{reviewDue}</Text>
                  </View>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Quick stats */}
        <View style={[styles.section, { marginBottom: Spacing.huge }]}>
          <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md }]}>
            YOUR PATH
          </Text>
          <Card variant="outlined" padding="medium">
            <View style={styles.pathIndicator}>
              <Text style={{ fontSize: 20 }}>
                {profile.path === 'speaking_script' ? '📖' : '🗣️'}
              </Text>
              <Text style={[Typography.bodyBold, { color: colors.text, marginLeft: Spacing.sm }]}>
                {profile.path === 'speaking_script' ? 'Speaking + Script' : 'Speaking Only'}
              </Text>
              <TouchableOpacity
                style={[styles.changePath, { backgroundColor: colors.primary + '15' }]}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <Text style={[Typography.small, { color: colors.primary, fontWeight: '600' }]}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  streakFire: {
    fontSize: 18,
  },
  streakCard: {
    marginBottom: Spacing.xxl,
  },
  streakCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  streakInfo: {
    alignItems: 'center',
    flex: 1,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0D6CC',
    opacity: 0.5,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  lessonCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonCardText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    minWidth: 28,
    alignItems: 'center',
  },
  pathIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePath: {
    marginLeft: 'auto',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
});
