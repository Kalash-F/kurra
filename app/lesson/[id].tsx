import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProgress } from '@/context/ProgressContext';
import { useSpeech } from '@/hooks/useSpeech';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { speakingUnits, Phrase } from '@/data/speakingUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

const { width } = Dimensions.get('window');

type ExerciseType = 'intro' | 'listen' | 'recall' | 'audioMatch' | 'fillGap' | 'recap';

interface Exercise {
  type: ExerciseType;
  phrase: Phrase;
  options?: string[];
  correctAnswer?: string;
  gapSentence?: string;
  missingWord?: string;
}

function buildExercises(phrases: Phrase[]): Exercise[] {
  const exercises: Exercise[] = [];

  // Show each phrase: intro → listen → recall exercise
  phrases.forEach((phrase, idx) => {
    // Intro card
    exercises.push({ type: 'intro', phrase });

    // Listen and repeat
    if (idx < 4) {
      exercises.push({ type: 'listen', phrase });
    }

    // Recall: English → Romanized (multiple choice)
    const otherOptions = phrases
      .filter((p) => p.id !== phrase.id)
      .map((p) => p.romanized)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    exercises.push({
      type: 'recall',
      phrase,
      options: [phrase.romanized, ...otherOptions].sort(() => Math.random() - 0.5),
      correctAnswer: phrase.romanized,
    });

    // Audio match: what does this mean?
    if (idx % 2 === 0) {
      const otherEnglish = phrases
        .filter((p) => p.id !== phrase.id)
        .map((p) => p.english)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      exercises.push({
        type: 'audioMatch',
        phrase,
        options: [phrase.english, ...otherEnglish].sort(() => Math.random() - 0.5),
        correctAnswer: phrase.english,
      });
    }
  });

  // Recap at end
  exercises.push({ type: 'recap', phrase: phrases[0] });

  return exercises;
}

function IntroCard({
  phrase,
  showScript,
  showRomanized,
  onNext,
}: {
  phrase: Phrase;
  showScript: boolean;
  showRomanized: boolean;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  const { speak } = useSpeech();

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
        NEW PHRASE
      </Text>

      <Card variant="elevated" padding="large" style={styles.introCard}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.xl }]}>
          {phrase.english}
        </Text>

        {showRomanized && (
          <View style={{ marginBottom: Spacing.md }}>
            <Text style={[Typography.romanized, { color: colors.romanized, textAlign: 'center' }]}>
              {phrase.romanized}
            </Text>
            <Text style={[Typography.caption, { color: colors.textTertiary, textAlign: 'center', fontStyle: 'italic', marginTop: Spacing.xs }]}>
              {phrase.phonetic}
            </Text>
          </View>
        )}

        {showScript && (
          <Text style={[Typography.devanagariMedium, { color: colors.devanagari, textAlign: 'center', marginBottom: Spacing.lg }]}>
            {phrase.devanagari}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.audioButton, { backgroundColor: colors.primary + '15' }]}
          onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 24 }}>🔊</Text>
          <Text style={[Typography.captionBold, { color: colors.primary, marginLeft: Spacing.sm }]}>
            Play Audio
          </Text>
        </TouchableOpacity>

        {phrase.notes && (
          <View style={[styles.noteBox, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
            <Text style={[Typography.caption, { color: colors.text }]}>
              💡 {phrase.notes}
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

function ListenCard({ phrase, onNext }: { phrase: Phrase; onNext: () => void }) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const [hasListened, setHasListened] = useState(false);

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
        LISTEN & REPEAT
      </Text>

      <View style={styles.centerContent}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.xxxl }]}>
          {phrase.english}
        </Text>

        <TouchableOpacity
          style={[styles.bigAudioBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            speak(phrase.devanagari, { audioFile: phrase.audioFile });
            setHasListened(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 40 }}>🔊</Text>
        </TouchableOpacity>

        <Text style={[Typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg }]}>
          Tap to listen, then repeat aloud
        </Text>
      </View>

      <View style={styles.bottomButton}>
        <Button
          title={hasListened ? "I've Repeated It" : 'Listen First'}
          onPress={onNext}
          disabled={!hasListened}
          size="large"
          fullWidth
        />
      </View>
    </View>
  );
}

function RecallCard({
  phrase,
  options,
  correctAnswer,
  onNext,
  onAnswer,
}: {
  phrase: Phrase;
  options: string[];
  correctAnswer: string;
  onNext: () => void;
  onAnswer: (correct: boolean) => void;
}) {
  const { colors } = useTheme();
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
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
        RECALL
      </Text>

      <View style={styles.centerContent}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.xxxl }]}>
          "{phrase.english}"
        </Text>

        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
          Choose the correct Nepali phrase
        </Text>

        <View style={styles.optionsList}>
          {options.map((option, idx) => {
            const isSelected = selected === option;
            const isCorrect = option === correctAnswer;
            let bg = colors.surface;
            let border = colors.border;

            if (showResult) {
              if (isCorrect) {
                bg = colors.correctBg;
                border = colors.correctBorder;
              } else if (isSelected && !isCorrect) {
                bg = colors.incorrectBg;
                border = colors.incorrectBorder;
              }
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
                {showResult && isCorrect && (
                  <Text style={styles.optionMark}>✓</Text>
                )}
                {showResult && isSelected && !isCorrect && (
                  <Text style={[styles.optionMark, { color: colors.error }]}>✗</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {showResult && (
        <View style={styles.bottomButton}>
          <View style={styles.resultFeedback}>
            <Text
              style={[
                Typography.bodyBold,
                { color: selected === correctAnswer ? colors.success : colors.error },
              ]}
            >
              {selected === correctAnswer ? '🎉 Correct!' : `The answer was: ${correctAnswer}`}
            </Text>
          </View>
          <Button title="Continue" onPress={onNext} size="large" fullWidth />
        </View>
      )}
    </View>
  );
}

function AudioMatchCard({
  phrase,
  options,
  correctAnswer,
  onNext,
  onAnswer,
}: {
  phrase: Phrase;
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
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
        AUDIO MATCH
      </Text>

      <View style={styles.centerContent}>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }]}>
          Listen and choose the meaning
        </Text>

        <TouchableOpacity
          style={[styles.bigAudioBtn, { backgroundColor: colors.secondary }]}
          onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 40 }}>🔊</Text>
        </TouchableOpacity>

        <View style={[styles.optionsList, { marginTop: Spacing.xxxl }]}>
          {options.map((option, idx) => {
            const isSelected = selected === option;
            const isCorrect = option === correctAnswer;
            let bg = colors.surface;
            let border = colors.border;

            if (showResult) {
              if (isCorrect) {
                bg = colors.correctBg;
                border = colors.correctBorder;
              } else if (isSelected && !isCorrect) {
                bg = colors.incorrectBg;
                border = colors.incorrectBorder;
              }
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
          <Button title="Continue" onPress={onNext} size="large" fullWidth />
        </View>
      )}
    </View>
  );
}

function RecapCard({
  phrases,
  score,
  total,
  onFinish,
}: {
  phrases: Phrase[];
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
          Lesson Complete!
        </Text>
        <Text style={[Typography.h1, { color: colors.primary, textAlign: 'center' }]}>
          {pct}%
        </Text>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
          {score} of {total} correct
        </Text>

        <View style={[styles.recapList, { backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.lg }]}>
          <Text style={[Typography.captionBold, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            PHRASES LEARNED
          </Text>
          {phrases.slice(0, 6).map((phrase) => (
            <TouchableOpacity
              key={phrase.id}
              style={styles.recapRow}
              onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={[Typography.caption, { color: colors.text }]}>{phrase.english}</Text>
                <Text style={[Typography.small, { color: colors.romanized }]}>{phrase.romanized}</Text>
                <Text style={[Typography.small, { color: colors.textTertiary, fontStyle: 'italic' }]}>
                  {phrase.phonetic}
                </Text>
              </View>
              <Text style={{ fontSize: 16 }}>🔊</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomButton}>
        <Button title="Finish" onPress={onFinish} size="large" fullWidth />
      </View>
    </View>
  );
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { profile } = useUser();
  const { completeSpeakingLesson, updateItemMastery, updateStreak } = useProgress();

  const unit = speakingUnits.find((u) => u.id === id);
  if (!unit) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginTop: 100 }]}>
          Lesson not found
        </Text>
      </SafeAreaView>
    );
  }

  const showScript = profile.path === 'speaking_script';
  const exercises = useMemo(() => buildExercises(unit.phrases), [unit.id]);

  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const progress = ((currentStep + 1) / exercises.length) * 100;
  const current = exercises[currentStep];

  const handleNext = () => {
    if (currentStep < exercises.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    setTotalAnswered(totalAnswered + 1);
    if (correct) setScore(score + 1);
    await updateItemMastery(current.phrase.id, correct);
  };

  const handleFinish = async () => {
    const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 100;
    await completeSpeakingLesson(unit.id, pct);
    await updateStreak();
    router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.lessonHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={[Typography.h4, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: Spacing.md }}>
          <ProgressBar progress={progress} height={6} />
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
        {current.type === 'intro' && (
          <IntroCard
            phrase={current.phrase}
            showScript={showScript}
            showRomanized={profile.showRomanized}
            onNext={handleNext}
          />
        )}
        {current.type === 'listen' && (
          <ListenCard phrase={current.phrase} onNext={handleNext} />
        )}
        {current.type === 'recall' && current.options && current.correctAnswer && (
          <RecallCard
            phrase={current.phrase}
            options={current.options}
            correctAnswer={current.correctAnswer}
            onNext={handleNext}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === 'audioMatch' && current.options && current.correctAnswer && (
          <AudioMatchCard
            phrase={current.phrase}
            options={current.options}
            correctAnswer={current.correctAnswer}
            onNext={handleNext}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === 'recap' && (
          <RecapCard
            phrases={unit.phrases}
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
  introCard: {
    marginTop: Spacing.xxl,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
    alignSelf: 'center',
  },
  noteBox: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  bigAudioBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
  optionMark: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  resultFeedback: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  bottomButton: {
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.lg,
  },
  recapList: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    width: '100%',
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});
