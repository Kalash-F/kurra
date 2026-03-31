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
import { scriptUnits } from '@/data/scriptUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

const stageNames: Record<number, string> = {
  1: 'Vowels',
  2: 'Consonants',
  3: 'Matras',
  4: 'Syllables',
  5: 'Word Reading',
  6: 'Phrase Reading',
};

export default function ScriptScreen() {
  const { colors } = useTheme();
  const { progress } = useProgress();

  const completedCount = Object.values(progress.scriptLessons).filter(l => l.completed).length;

  // Group by stage
  const stages = scriptUnits.reduce((acc, unit) => {
    if (!acc[unit.stage]) acc[unit.stage] = [];
    acc[unit.stage].push(unit);
    return acc;
  }, {} as Record<number, typeof scriptUnits>);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={[Typography.h2, { color: colors.text }]}>Script Path</Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
            Learn to read Devanagari step by step
          </Text>
          <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
            {completedCount} of {scriptUnits.length} units completed
          </Text>
          <View style={{ marginTop: Spacing.md }}>
            <ProgressBar
              progress={(completedCount / scriptUnits.length) * 100}
              color={colors.secondary}
              showGlow
            />
          </View>
        </View>

        {Object.entries(stages).map(([stageNum, units]) => {
          const stage = parseInt(stageNum);
          return (
            <View key={stage} style={styles.stageSection}>
              <View style={styles.stageHeader}>
                <View style={[styles.stageBadge, { backgroundColor: colors.secondary + '20' }]}>
                  <Text style={[Typography.small, { color: colors.secondary, fontWeight: '700' }]}>
                    Stage {stage}
                  </Text>
                </View>
                <Text style={[Typography.captionBold, { color: colors.textSecondary, marginLeft: Spacing.sm }]}>
                  {stageNames[stage]}
                </Text>
              </View>

              {units.map((unit, unitIndex) => {
                const globalIndex = scriptUnits.indexOf(unit);
                const lessonProgress = progress.scriptLessons[unit.id];
                const isCompleted = lessonProgress?.completed;
                const isLocked = globalIndex > 0 && !progress.scriptLessons[scriptUnits[globalIndex - 1].id]?.completed;
                const isNext = !isCompleted && !isLocked;

                return (
                  <TouchableOpacity
                    key={unit.id}
                    activeOpacity={isLocked ? 1 : 0.7}
                    onPress={() => {
                      if (!isLocked) router.push(`/script-lesson/${unit.id}`);
                    }}
                    style={styles.unitContainer}
                  >
                    <Card
                      variant={isNext ? 'elevated' : 'outlined'}
                      padding="medium"
                      style={[
                        isLocked && { opacity: 0.5 },
                        isNext && { borderWidth: 2, borderColor: unit.color },
                      ]}
                    >
                      <View style={styles.unitRow}>
                        <View
                          style={[
                            styles.charBox,
                            {
                              backgroundColor: isCompleted
                                ? colors.success + '20'
                                : unit.color + '15',
                              borderColor: isCompleted ? colors.success : unit.color,
                            },
                          ]}
                        >
                          {isLocked ? (
                            <Text style={{ fontSize: 18 }}>🔒</Text>
                          ) : (
                            <Text style={[Typography.devanagariSmall, { color: isCompleted ? colors.success : unit.color }]}>
                              {typeof unit.icon === 'string' && unit.icon.length <= 2 ? unit.icon : ''}
                            </Text>
                          )}
                          {typeof unit.icon === 'string' && unit.icon.length > 2 && !isLocked && (
                            <Text style={{ fontSize: 20 }}>{unit.icon}</Text>
                          )}
                        </View>
                        <View style={styles.unitInfo}>
                          <Text
                            style={[
                              Typography.bodyBold,
                              { color: isLocked ? colors.textTertiary : colors.text },
                            ]}
                          >
                            {unit.title}
                          </Text>
                          <Text
                            style={[
                              Typography.caption,
                              { color: colors.textSecondary, marginTop: 2 },
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
                        {isCompleted && (
                          <Text style={{ fontSize: 20, color: colors.success }}>✓</Text>
                        )}
                        {isNext && (
                          <View style={[styles.playBtn, { backgroundColor: unit.color }]}>
                            <Text style={{ color: '#FFF', fontSize: 14 }}>▶</Text>
                          </View>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  stageSection: {
    marginBottom: Spacing.xxl,
  },
  stageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stageBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  unitContainer: {
    marginBottom: Spacing.sm,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  charBox: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  scoreBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
