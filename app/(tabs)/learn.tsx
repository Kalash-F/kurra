import React from 'react';
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
import { useProgress } from '@/context/ProgressContext';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { speakingUnits } from '@/data/speakingUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

export default function LearnScreen() {
  const { colors } = useTheme();
  const { progress } = useProgress();

  const completedCount = Object.values(progress.speakingLessons).filter(l => l.completed).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[Typography.h2, { color: colors.text }]}>Speaking Path</Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
            {completedCount} of {speakingUnits.length} units completed
          </Text>
          <View style={{ marginTop: Spacing.md }}>
            <ProgressBar progress={(completedCount / speakingUnits.length) * 100} showGlow />
          </View>
        </View>

        {speakingUnits.map((unit, index) => {
          const lessonProgress = progress.speakingLessons[unit.id];
          const isCompleted = lessonProgress?.completed;
          const isLocked = index > 0 && !progress.speakingLessons[speakingUnits[index - 1].id]?.completed;
          const isNext = !isCompleted && !isLocked;

          return (
            <TouchableOpacity
              key={unit.id}
              activeOpacity={isLocked ? 1 : 0.7}
              onPress={() => {
                if (!isLocked) {
                  router.push(`/lesson/${unit.id}`);
                }
              }}
              style={styles.unitContainer}
            >
              <Card
                variant={isNext ? 'elevated' : 'outlined'}
                padding="medium"
                style={[
                  isLocked && { opacity: 0.5 },
                  isNext && {
                    borderWidth: 2,
                    borderColor: unit.color,
                  },
                ]}
              >
                <View style={styles.unitRow}>
                  <View
                    style={[
                      styles.unitNumber,
                      {
                        backgroundColor: isCompleted
                          ? colors.success
                          : isNext
                          ? unit.color
                          : colors.progressTrack,
                      },
                    ]}
                  >
                    {isCompleted ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : isLocked ? (
                      <Text style={styles.lockIcon}>🔒</Text>
                    ) : (
                      <Text style={[Typography.bodyBold, { color: '#FFF' }]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <View style={styles.unitInfo}>
                    <View style={styles.unitTopRow}>
                      <Text style={{ fontSize: 20 }}>{unit.icon}</Text>
                      <Text
                        style={[
                          Typography.bodyBold,
                          { color: isLocked ? colors.textTertiary : colors.text, marginLeft: Spacing.sm },
                        ]}
                      >
                        {unit.title}
                      </Text>
                    </View>
                    <Text
                      style={[
                        Typography.caption,
                        { color: colors.textSecondary, marginTop: Spacing.xs },
                      ]}
                    >
                      {unit.subtitle}
                    </Text>
                    {isCompleted && lessonProgress && (
                      <View style={[styles.scoreBadge, { backgroundColor: colors.successLight }]}>
                        <Text style={[Typography.small, { color: colors.success, fontWeight: '600' }]}>
                          Score: {lessonProgress.score}%
                        </Text>
                      </View>
                    )}
                  </View>
                  {isNext && (
                    <View style={[styles.playButton, { backgroundColor: unit.color }]}>
                      <Text style={{ color: '#FFF', fontSize: 16 }}>▶</Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

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
  unitContainer: {
    marginBottom: Spacing.md,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  lockIcon: {
    fontSize: 16,
  },
  unitInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  unitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
