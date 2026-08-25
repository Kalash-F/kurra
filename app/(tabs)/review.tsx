import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useProgress } from '@/context/ProgressContext';
import { useUser } from '@/context/UserContext';
import { useSpeech } from '@/hooks/useSpeech';
import { useRecording } from '@/hooks/useRecording';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SpeakCompare } from '@/components/ui/SpeakCompare';
import { speakingUnits, Phrase } from '@/data/speakingUnits';
import { scriptUnits } from '@/data/scriptUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

interface ReviewItem {
  id: string;
  kind: 'speaking' | 'script';
  prompt: string;
  romanized: string;
  phonetic: string;
  devanagari: string;
  audioFile?: string;
}

function phraseToReviewItem(phrase: Phrase): ReviewItem {
  return {
    id: phrase.id,
    kind: 'speaking',
    prompt: phrase.english,
    romanized: phrase.romanized,
    phonetic: phrase.phonetic,
    devanagari: phrase.devanagari,
    audioFile: phrase.audioFile,
  };
}

function buildAllReviewItems(
  progress: ReturnType<typeof useProgress>['progress'],
  showScript: boolean
): ReviewItem[] {
  const items: ReviewItem[] = [];

  speakingUnits.forEach((unit) => {
    const lesson = progress.speakingLessons[unit.id];
    if (lesson?.completed || (lesson?.completedItems?.length ?? 0) > 0) {
      unit.phrases.forEach((phrase) => {
        if (lesson?.completed || lesson?.completedItems?.includes(phrase.id)) {
          items.push(phraseToReviewItem(phrase));
        }
      });
    }
  });

  if (showScript) {
    scriptUnits.forEach((unit) => {
      const lesson = progress.scriptLessons[unit.id];
      if (lesson?.completed || (lesson?.completedItems?.length ?? 0) > 0) {
        unit.items.forEach((item) => {
          const key = `${unit.id}-${item.transliteration}`;
          if (lesson?.completed || lesson?.completedItems?.includes(key)) {
            items.push({
              id: key,
              kind: 'script',
              prompt: item.character,
              romanized: item.transliteration,
              phonetic: item.transliteration,
              devanagari: item.character,
              audioFile: item.audioFile,
            });
          }
        });
      }
    });
  }

  return items;
}

export default function ReviewScreen() {
  const { colors } = useTheme();
  const { progress, updateItemMastery, getWeakItems, getReviewDue } = useProgress();
  const { profile } = useUser();
  const { speak } = useSpeech();
  const recording = useRecording();
  const showScript = profile.path === 'speaking_script';

  const weakItems = getWeakItems();
  const dueItems = getReviewDue();
  const allItems = useMemo(() => buildAllReviewItems(progress, showScript), [progress, showScript]);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  useEffect(() => {
    recording.reset();
    setRevealed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isSessionActive]);

  const startSession = (mode: 'weak' | 'due' | 'random') => {
    let pool = [...allItems];
    if (mode === 'weak') {
      pool = pool.filter((i) => weakItems.includes(i.id));
    } else if (mode === 'due') {
      pool = pool.filter((i) => dueItems.includes(i.id));
    }

    if (pool.length === 0) return;
    pool = pool.sort(() => Math.random() - 0.5).slice(0, 20);

    setReviewItems(pool);
    setCurrentIndex(0);
    setScore(0);
    setAnswered(0);
    setRevealed(false);
    setIsSessionActive(true);
  };

  if (!isSessionActive) {
    const weakCount = allItems.filter((i) => weakItems.includes(i.id)).length;
    const dueCount = allItems.filter((i) => dueItems.includes(i.id)).length;

    if (allItems.length === 0) {
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64, marginBottom: Spacing.xxl }}>📚</Text>
            <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.md }]}>
              Nothing to review yet
            </Text>
            <Text
              style={[
                Typography.body,
                { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xxxl },
              ]}
            >
              Complete some lessons first to build your review deck. Items you've learned will appear here for
              practice.
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.menuContainer}>
          <Text style={[Typography.h2, { color: colors.text, marginBottom: Spacing.xl }]}>Review Hub</Text>

          <Card variant="elevated" padding="large" style={{ marginBottom: Spacing.lg }}>
            <Text style={[Typography.h4, { color: colors.text, marginBottom: Spacing.sm }]}>🎯 Target Weaknesses</Text>
            <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: Spacing.lg }]}>
              Practice items you recently got wrong.
            </Text>
            <Button
              title={weakCount > 0 ? `Relearn Weak Concepts (${weakCount})` : 'No weak concepts yet!'}
              onPress={() => startSession('weak')}
              disabled={weakCount === 0}
              variant="primary"
            />
          </Card>

          <Card variant="elevated" padding="large" style={{ marginBottom: Spacing.lg }}>
            <Text style={[Typography.h4, { color: colors.text, marginBottom: Spacing.sm }]}>📅 Daily Spaced Review</Text>
            <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: Spacing.lg }]}>
              Review items that are due for a refresher to solidify your memory.
            </Text>
            <Button
              title={dueCount > 0 ? `Review Due Items (${dueCount})` : 'All caught up for today!'}
              onPress={() => startSession('due')}
              disabled={dueCount === 0}
              variant="secondary"
            />
          </Card>

          <Card variant="elevated" padding="large">
            <Text style={[Typography.h4, { color: colors.text, marginBottom: Spacing.sm }]}>🎲 Random Practice</Text>
            <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: Spacing.lg }]}>
              A general, randomized mix of everything you've learned so far.
            </Text>
            <Button title="Start General Practice" onPress={() => startSession('random')} variant="outline" />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentIndex >= reviewItems.length) {
    const percentage = answered > 0 ? Math.round((score / answered) * 100) : 100;
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 64, marginBottom: Spacing.xxl }}>
            {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}
          </Text>
          <Text style={[Typography.h2, { color: colors.text, textAlign: 'center', marginBottom: Spacing.md }]}>
            Review Complete!
          </Text>
          <Text style={[Typography.h1, { color: colors.primary }]}>{percentage}%</Text>
          <Text style={[Typography.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
            {score} of {answered} self-checked
          </Text>
          <Button
            title="Back to Review Menu"
            onPress={() => setIsSessionActive(false)}
            style={{ marginTop: Spacing.xxxl }}
            size="large"
          />
        </View>
      </SafeAreaView>
    );
  }

  const current = reviewItems[currentIndex];
  const showAnswer = revealed || !!recording.uri || recording.state === 'permissionDenied';

  const grade = async (gotIt: boolean) => {
    setAnswered((a) => a + 1);
    if (gotIt) setScore((s) => s + 1);
    await updateItemMastery(current.id, gotIt);
    setCurrentIndex((i) => i + 1);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.reviewContainer}>
        <View style={styles.reviewHeader}>
          <Text style={[Typography.h3, { color: colors.text }]}>Review</Text>
          <Text style={[Typography.caption, { color: colors.textSecondary }]}>
            {currentIndex + 1} / {reviewItems.length}
          </Text>
        </View>

        <View style={[styles.progressTrack, { backgroundColor: colors.progressTrack }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${((currentIndex + 1) / reviewItems.length) * 100}%`,
              },
            ]}
          />
        </View>

        <ScrollView contentContainerStyle={styles.sessionBody} showsVerticalScrollIndicator={false}>
          <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md, textAlign: 'center' }]}>
            {current.kind === 'speaking' ? 'SAY IT IN NEPALI' : 'SAY THIS SOUND'}
          </Text>

          {current.kind === 'script' ? (
            <Text style={[Typography.devanagariLarge, { color: colors.devanagari, textAlign: 'center', marginBottom: Spacing.lg }]}>
              {current.prompt}
            </Text>
          ) : (
            <Text style={[Typography.h2, { color: colors.text, textAlign: 'center', marginBottom: Spacing.lg }]}>
              {current.prompt}
            </Text>
          )}

          <SpeakCompare
            state={recording.state}
            onStartRecording={recording.startRecording}
            onStopRecording={recording.stopRecording}
            onPlayUser={recording.playUser}
            onPlayModel={() =>
              recording.playModel(() => speak(current.devanagari, { audioFile: current.audioFile }))
            }
            onRetake={recording.retake}
            onRevealFallback={() => setRevealed(true)}
          />

          {!showAnswer && recording.state !== 'permissionDenied' && (
            <Button
              title="Reveal answer"
              onPress={() => setRevealed(true)}
              variant="ghost"
              size="small"
              style={{ marginTop: Spacing.md, alignSelf: 'center' }}
            />
          )}

          {showAnswer && (
            <Card variant="outlined" padding="medium" style={{ marginTop: Spacing.xl, width: '100%' }}>
              <Text style={[Typography.romanized, { color: colors.romanized, textAlign: 'center' }]}>
                {current.romanized}
              </Text>
              <Text
                style={[
                  Typography.caption,
                  { color: colors.textTertiary, textAlign: 'center', fontStyle: 'italic', marginTop: Spacing.xs },
                ]}
              >
                {current.phonetic}
              </Text>
              <TouchableOpacity
                style={[styles.audioButton, { backgroundColor: colors.primary + '15' }]}
                onPress={() => speak(current.devanagari, { audioFile: current.audioFile })}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 20 }}>🔊</Text>
                <Text style={[Typography.captionBold, { color: colors.primary, marginLeft: Spacing.sm }]}>
                  Model audio
                </Text>
              </TouchableOpacity>
            </Card>
          )}
        </ScrollView>

        {showAnswer && (
          <View style={styles.resultArea}>
            <View style={styles.selfGradeRow}>
              <Button title="Again" onPress={() => grade(false)} variant="outline" size="large" style={{ flex: 1 }} />
              <Button title="Got it" onPress={() => grade(true)} size="large" style={{ flex: 1 }} />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  menuContainer: {
    padding: Spacing.xl,
    flexGrow: 1,
  },
  reviewContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  sessionBody: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: Spacing.xl,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    alignSelf: 'center',
  },
  selfGradeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  resultArea: {
    alignItems: 'center',
    paddingBottom: Spacing.huge,
  },
});
