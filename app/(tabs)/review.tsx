import React, { useState, useMemo } from 'react';
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
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { speakingUnits } from '@/data/speakingUnits';
import { scriptUnits } from '@/data/scriptUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

interface ReviewItem {
  id: string;
  type: 'speaking' | 'script';
  question: string;
  answer: string;
  devanagari?: string;
  options: string[];
  audioFile?: string;
}

function buildAllReviewItems(progress: any, showScript: boolean): ReviewItem[] {
  const items: ReviewItem[] = [];

  speakingUnits.forEach((unit) => {
    const lesson = progress.speakingLessons[unit.id];
    if (lesson?.completed || lesson?.completedItems?.length > 0) {
      unit.phrases.forEach((phrase) => {
        if (lesson?.completed || lesson?.completedItems?.includes(phrase.id)) {
          items.push({
            id: phrase.id,
            type: 'speaking',
            question: phrase.english,
            answer: phrase.romanized,
            devanagari: phrase.devanagari,
            options: generateOptions(phrase.romanized, unit.phrases.map(p => p.romanized)),
            audioFile: phrase.audioFile,
          });
        }
      });
    }
  });

  if (showScript) {
    scriptUnits.forEach((unit) => {
      const lesson = progress.scriptLessons[unit.id];
      if (lesson?.completed || lesson?.completedItems?.length > 0) {
        unit.items.forEach((item) => {
          const key = `${unit.id}-${item.transliteration}`;
          if (lesson?.completed || lesson?.completedItems?.includes(key)) {
            items.push({
              id: key,
              type: 'script',
              question: item.character,
              answer: item.transliteration,
              devanagari: item.character,
              options: generateOptions(item.transliteration, unit.items.map(i => i.transliteration)),
              audioFile: item.audioFile,
            });
          }
        });
      }
    });
  }

  return items;
}

function generateOptions(correct: string, pool: string[]): string[] {
  const others = pool.filter((p) => p !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
  const options = [correct, ...others].sort(() => Math.random() - 0.5);
  return options.length >= 2 ? options : [correct, 'option2', 'option3', 'option4'];
}

export default function ReviewScreen() {
  const { colors } = useTheme();
  const { progress, updateItemMastery, getWeakItems, getReviewDue } = useProgress();
  const { profile } = useUser();
  const { speak } = useSpeech();
  const showScript = profile.path === 'speaking_script';

  const weakItems = getWeakItems();
  const dueItems = getReviewDue();
  const allItems = useMemo(() => buildAllReviewItems(progress, showScript), [progress, showScript]);

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const startSession = (mode: 'weak' | 'due' | 'random') => {
    let pool = [...allItems];
    if (mode === 'weak') {
      pool = pool.filter(i => weakItems.includes(i.id));
    } else if (mode === 'due') {
      pool = pool.filter(i => dueItems.includes(i.id));
    }
    
    if (pool.length === 0) return;
    pool = pool.sort(() => Math.random() - 0.5).slice(0, 20);
    
    setReviewItems(pool);
    setCurrentIndex(0);
    setScore(0);
    setAnswered(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsSessionActive(true);
  };

  if (!isSessionActive) {
    const weakCount = allItems.filter(i => weakItems.includes(i.id)).length;
    const dueCount = allItems.filter(i => dueItems.includes(i.id)).length;

    if (allItems.length === 0) {
      return (
        <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 64, marginBottom: Spacing.xxl }}>📚</Text>
            <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.md }]}>
              Nothing to review yet
            </Text>
            <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xxxl }]}>
              Complete some lessons first to build your review deck. Items you've learned will appear here for practice.
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
            <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: Spacing.lg }]}>Practice items you recently got wrong.</Text>
            <Button 
              title={weakCount > 0 ? `Relearn Weak Concepts (${weakCount})` : "No weak concepts yet!"} 
              onPress={() => startSession('weak')} 
              disabled={weakCount === 0} 
              variant="primary" 
            />
          </Card>

          <Card variant="elevated" padding="large" style={{ marginBottom: Spacing.lg }}>
            <Text style={[Typography.h4, { color: colors.text, marginBottom: Spacing.sm }]}>📅 Daily Spaced Review</Text>
            <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: Spacing.lg }]}>Review items that are due for a refresher to solidify your memory.</Text>
            <Button 
              title={dueCount > 0 ? `Review Due Items (${dueCount})` : "All caught up for today!"} 
              onPress={() => startSession('due')} 
              disabled={dueCount === 0} 
              variant="secondary" 
            />
          </Card>

          <Card variant="elevated" padding="large">
            <Text style={[Typography.h4, { color: colors.text, marginBottom: Spacing.sm }]}>🎲 Random Practice</Text>
            <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: Spacing.lg }]}>A general, randomized mix of everything you've learned so far.</Text>
            <Button 
              title="Start General Practice" 
              onPress={() => startSession('random')} 
              variant="outline" 
            />
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (currentIndex >= reviewItems.length) {
    const percentage = Math.round((score / answered) * 100);
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 64, marginBottom: Spacing.xxl }}>
            {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}
          </Text>
          <Text style={[Typography.h2, { color: colors.text, textAlign: 'center', marginBottom: Spacing.md }]}>
            Review Complete!
          </Text>
          <Text style={[Typography.h1, { color: colors.primary }]}>
            {percentage}%
          </Text>
          <Text style={[Typography.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
            {score} of {answered} correct
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

  const handleSelect = async (option: string) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);
    setAnswered(answered + 1);

    const isCorrect = option === current.answer;
    if (isCorrect) setScore(score + 1);
    await updateItemMastery(current.id, isCorrect);
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentIndex(currentIndex + 1);
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

        <View style={styles.questionArea}>
          <Text style={[Typography.label, { color: colors.textTertiary, marginBottom: Spacing.md }]}>
            {current.type === 'speaking' ? 'WHAT IS THIS IN NEPALI?' : 'WHAT SOUND IS THIS?'}
          </Text>

          {current.type === 'script' ? (
            <TouchableOpacity onPress={() => speak(current.devanagari || current.answer, { audioFile: current.audioFile })}>
              <Text style={[Typography.devanagariLarge, { color: colors.devanagari, textAlign: 'center' }]}>
                {current.question}
              </Text>
              <Text style={[Typography.caption, { color: colors.primary, textAlign: 'center', marginTop: Spacing.sm }]}>
                🔊 Tap to hear
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[Typography.h2, { color: colors.text, textAlign: 'center' }]}>
              {current.question}
            </Text>
          )}
        </View>

        <View style={styles.optionsArea}>
          {current.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === current.answer;
            let bgColor = colors.surface;
            let borderColor = colors.border;

            if (showResult) {
              if (isCorrect) {
                bgColor = colors.correctBg;
                borderColor = colors.correctBorder;
              } else if (isSelected && !isCorrect) {
                bgColor = colors.incorrectBg;
                borderColor = colors.incorrectBorder;
              }
            } else if (isSelected) {
              bgColor = colors.primary + '15';
              borderColor = colors.primary;
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.option, { backgroundColor: bgColor, borderColor }]}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
                disabled={showResult}
              >
                <Text style={[Typography.body, { color: colors.text }]}>{option}</Text>
                {showResult && isCorrect && (
                  <Text style={{ fontSize: 18, marginLeft: 'auto' }}>✓</Text>
                )}
                {showResult && isSelected && !isCorrect && (
                  <Text style={{ fontSize: 18, marginLeft: 'auto' }}>✗</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {showResult && (
          <View style={styles.resultArea}>
            {selectedAnswer === current.answer ? (
              <Text style={[Typography.bodyBold, { color: colors.success }]}>Correct! 🎉</Text>
            ) : (
              <Text style={[Typography.body, { color: colors.error }]}>
                The answer was: {current.answer}
              </Text>
            )}
            <Button title="Next" onPress={handleNext} style={{ marginTop: Spacing.lg }} fullWidth />
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
    marginBottom: Spacing.xxxl,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  questionArea: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    flex: 1,
    justifyContent: 'center',
  },
  optionsArea: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  resultArea: {
    alignItems: 'center',
    paddingBottom: Spacing.huge,
  },
});
