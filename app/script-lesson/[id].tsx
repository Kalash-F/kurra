import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useProgress } from '@/context/ProgressContext';
import { useSpeech } from '@/hooks/useSpeech';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { scriptUnits, ScriptItem } from '@/data/scriptUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

type ExerciseType = 'teach' | 'recognise' | 'recall' | 'recap';

interface Exercise {
  type: ExerciseType;
  item: ScriptItem;
  options?: string[];
  correctAnswer?: string;
  questionType?: 'charToSound' | 'soundToChar';
}

function buildExercises(items: ScriptItem[]): Exercise[] {
  const exercises: Exercise[] = [];

  items.forEach((item, idx) => {
    // Teaching card
    exercises.push({ type: 'teach', item });

    // Recognition: see character → choose sound
    const otherSounds = items
      .filter((i) => i.transliteration !== item.transliteration)
      .map((i) => i.transliteration)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    if (otherSounds.length >= 1) {
      exercises.push({
        type: 'recognise',
        item,
        questionType: 'charToSound',
        options: [item.transliteration, ...otherSounds].sort(() => Math.random() - 0.5),
        correctAnswer: item.transliteration,
      });
    }

    // Recall: hear/see sound → choose character
    const otherChars = items
      .filter((i) => i.character !== item.character)
      .map((i) => i.character)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    
    if (otherChars.length >= 1) {
      exercises.push({
        type: 'recall',
        item,
        questionType: 'soundToChar',
        options: [item.character, ...otherChars].sort(() => Math.random() - 0.5),
        correctAnswer: item.character,
      });
    }
  });

  exercises.push({ type: 'recap', item: items[0] });
  return exercises;
}

function TeachCard({ item, onNext }: { item: ScriptItem; onNext: () => void }) {
  const { colors } = useTheme();
  const { speak } = useSpeech();

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xl }]}>
        {item.type === 'vowel'
          ? 'VOWEL'
          : item.type === 'consonant'
          ? 'CONSONANT'
          : item.type === 'matra'
          ? 'MATRA'
          : item.type === 'syllable'
          ? 'SYLLABLE'
          : item.type === 'phrase'
          ? 'PHRASE'
          : 'WORD'}
      </Text>

      <Card variant="elevated" padding="large" style={styles.teachCard}>
        <TouchableOpacity
          style={[styles.charDisplay, { backgroundColor: colors.scriptCharBg, borderColor: colors.scriptCharBorder }]}
          onPress={() => speak(item.character)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              item.character.length <= 2 ? Typography.devanagariLarge : Typography.devanagariMedium,
              { color: colors.devanagari, textAlign: 'center' },
            ]}
          >
            {item.character}
          </Text>
        </TouchableOpacity>

        <Text style={[Typography.romanized, { color: colors.romanized, textAlign: 'center', marginTop: Spacing.lg }]}>
          {item.transliteration}
        </Text>

        <TouchableOpacity
          style={[styles.audioBtn, { backgroundColor: colors.primary + '15' }]}
          onPress={() => speak(item.character)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 20 }}>🔊</Text>
          <Text style={[Typography.captionBold, { color: colors.primary, marginLeft: Spacing.sm }]}>
            Listen
          </Text>
        </TouchableOpacity>

        {item.example && (
          <View style={[styles.exampleBox, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>Example:</Text>
            <TouchableOpacity onPress={() => item.example && speak(item.example)} style={styles.exampleRow}>
              <Text style={[Typography.devanagariBody, { color: colors.devanagari }]}>
                {item.example}
              </Text>
              {item.exampleMeaning && (
                <Text style={[Typography.caption, { color: colors.textSecondary }]}>
                  {' '}= {item.exampleMeaning}
                </Text>
              )}
              <Text style={{ fontSize: 14, marginLeft: Spacing.sm }}>🔊</Text>
            </TouchableOpacity>
          </View>
        )}

        {item.notes && (
          <View style={[styles.noteBox, { backgroundColor: colors.accent + '15' }]}>
            <Text style={[Typography.caption, { color: colors.text }]}>
              💡 {item.notes}
            </Text>
          </View>
        )}
      </Card>

      <View style={styles.bottomButton}>
        <Button title="Continue" onPress={onNext} size="large" fullWidth />
      </View>
    </View>
  );
}

function RecogniseCard({
  item,
  options,
  correctAnswer,
  onNext,
  onAnswer,
}: {
  item: ScriptItem;
  options: string[];
  correctAnswer: string;
  onNext: () => void;
  onAnswer: (correct: boolean) => void;
}) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    onAnswer(option === correctAnswer);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xl }]}>
        WHAT SOUND IS THIS?
      </Text>

      <View style={styles.centerContent}>
        <TouchableOpacity
          style={[styles.charDisplay, { backgroundColor: colors.scriptCharBg, borderColor: colors.scriptCharBorder }]}
          onPress={() => speak(item.character)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              item.character.length <= 2 ? Typography.devanagariLarge : Typography.devanagariMedium,
              { color: colors.devanagari, textAlign: 'center' },
            ]}
          >
            {item.character}
          </Text>
        </TouchableOpacity>

        <Text style={[Typography.caption, { color: colors.primary, marginTop: Spacing.sm, marginBottom: Spacing.xxl }]}>
          🔊 Tap to hear
        </Text>

        <View style={styles.optionsList}>
          {options.map((option, idx) => {
            const isSelected = selected === option;
            const isCorrect = option === correctAnswer;
            let bg = colors.surface;
            let border = colors.border;

            if (showResult) {
              if (isCorrect) { bg = colors.correctBg; border = colors.correctBorder; }
              else if (isSelected) { bg = colors.incorrectBg; border = colors.incorrectBorder; }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
                disabled={showResult}
              >
                <Text style={[Typography.body, { color: colors.text }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {showResult && (
        <View style={styles.bottomButton}>
          <Text
            style={[
              Typography.bodyBold,
              {
                color: selected === correctAnswer ? colors.success : colors.error,
                textAlign: 'center',
                marginBottom: Spacing.md,
              },
            ]}
          >
            {selected === correctAnswer ? '🎉 Correct!' : `Answer: ${correctAnswer}`}
          </Text>
          <Button title="Continue" onPress={onNext} size="large" fullWidth />
        </View>
      )}
    </View>
  );
}

function RecallCharCard({
  item,
  options,
  correctAnswer,
  onNext,
  onAnswer,
}: {
  item: ScriptItem;
  options: string[];
  correctAnswer: string;
  onNext: () => void;
  onAnswer: (correct: boolean) => void;
}) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    onAnswer(option === correctAnswer);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xl }]}>
        FIND THE CHARACTER
      </Text>

      <View style={styles.centerContent}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.sm }]}>
          Which one is "{item.transliteration}"?
        </Text>

        <TouchableOpacity
          style={[styles.listenHint, { backgroundColor: colors.secondary + '15' }]}
          onPress={() => speak(item.character)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 18 }}>🔊</Text>
          <Text style={[Typography.caption, { color: colors.secondary, marginLeft: Spacing.xs }]}>
            Listen
          </Text>
        </TouchableOpacity>

        <View style={styles.charGrid}>
          {options.map((option, idx) => {
            const isSelected = selected === option;
            const isCorrect = option === correctAnswer;
            let bg = colors.surface;
            let border = colors.border;

            if (showResult) {
              if (isCorrect) { bg = colors.correctBg; border = colors.correctBorder; }
              else if (isSelected) { bg = colors.incorrectBg; border = colors.incorrectBorder; }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.charOption, { backgroundColor: bg, borderColor: border }]}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
                disabled={showResult}
              >
                <Text
                  style={[
                    option.length <= 2 ? Typography.devanagariMedium : Typography.devanagariSmall,
                    { color: colors.devanagari, textAlign: 'center' },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {showResult && (
        <View style={styles.bottomButton}>
          <Text
            style={[
              Typography.bodyBold,
              {
                color: selected === correctAnswer ? colors.success : colors.error,
                textAlign: 'center',
                marginBottom: Spacing.md,
              },
            ]}
          >
            {selected === correctAnswer ? '🎉 Correct!' : `Answer: ${correctAnswer}`}
          </Text>
          <Button title="Continue" onPress={onNext} size="large" fullWidth />
        </View>
      )}
    </View>
  );
}

function ScriptRecap({
  items,
  score,
  total,
  onFinish,
}: {
  items: ScriptItem[];
  score: number;
  total: number;
  onFinish: () => void;
}) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const pct = total > 0 ? Math.round((score / total) * 100) : 100;

  return (
    <View style={styles.exerciseContainer}>
      <View style={styles.centerContent}>
        <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: Spacing.xxl }}>
          {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}
        </Text>
        <Text style={[Typography.h2, { color: colors.text, textAlign: 'center', marginBottom: Spacing.md }]}>
          Unit Complete!
        </Text>
        <Text style={[Typography.h1, { color: colors.secondary, textAlign: 'center' }]}>
          {pct}%
        </Text>
        <Text style={[Typography.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
          {score} of {total} correct
        </Text>

        <View style={[styles.recapGrid, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[Typography.captionBold, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            CHARACTERS LEARNED
          </Text>
          <View style={styles.charGridWrap}>
            {items.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.recapCharBox, { backgroundColor: colors.scriptCharBg, borderColor: colors.scriptCharBorder }]}
                onPress={() => speak(item.character)}
                activeOpacity={0.7}
              >
                <Text style={[Typography.devanagariSmall, { color: colors.devanagari }]}>
                  {item.character}
                </Text>
                <Text style={[Typography.small, { color: colors.romanized }]}>
                  {item.transliteration}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.bottomButton}>
        <Button title="Finish" onPress={onFinish} size="large" fullWidth variant="secondary" />
      </View>
    </View>
  );
}

export default function ScriptLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { completeScriptLesson, updateItemMastery, updateStreak } = useProgress();

  const unit = scriptUnits.find((u) => u.id === id);
  if (!unit) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginTop: 100 }]}>
          Script lesson not found
        </Text>
      </SafeAreaView>
    );
  }

  const exercises = useMemo(() => buildExercises(unit.items), [unit.id]);

  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const progressPct = ((currentStep + 1) / exercises.length) * 100;
  const current = exercises[currentStep];

  const handleNext = () => {
    if (currentStep < exercises.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    setTotalAnswered(totalAnswered + 1);
    if (correct) setScore(score + 1);
    await updateItemMastery(`${unit.id}-${current.item.transliteration}`, correct);
  };

  const handleFinish = async () => {
    const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 100;
    await completeScriptLesson(unit.id, pct);
    await updateStreak();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.lessonHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={[Typography.h4, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: Spacing.md }}>
          <ProgressBar progress={progressPct} height={6} color={colors.secondary} />
        </View>
        <Text style={[Typography.caption, { color: colors.textSecondary }]}>
          {currentStep + 1}/{exercises.length}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {current.type === 'teach' && (
          <TeachCard item={current.item} onNext={handleNext} />
        )}
        {current.type === 'recognise' && current.options && current.correctAnswer && (
          <RecogniseCard
            item={current.item}
            options={current.options}
            correctAnswer={current.correctAnswer}
            onNext={handleNext}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === 'recall' && current.options && current.correctAnswer && (
          <RecallCharCard
            item={current.item}
            options={current.options}
            correctAnswer={current.correctAnswer}
            onNext={handleNext}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === 'recap' && (
          <ScriptRecap
            items={unit.items}
            score={score}
            total={totalAnswered}
            onFinish={handleFinish}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  teachCard: {
    marginTop: Spacing.lg,
  },
  charDisplay: {
    alignSelf: 'center',
    minWidth: 120,
    minHeight: 120,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  audioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
    alignSelf: 'center',
  },
  exampleBox: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  noteBox: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  listenHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  optionsList: {
    width: '100%',
    gap: Spacing.sm,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  charGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
    marginTop: Spacing.lg,
    width: '100%',
  },
  charOption: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomButton: {
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  recapGrid: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    width: '100%',
  },
  charGridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  recapCharBox: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 60,
  },
});
