import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProgress } from '@/context/ProgressContext';
import { useSpeech } from '@/hooks/useSpeech';
import { useFeedback } from '@/hooks/useFeedback';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { speakingUnits, Phrase } from '@/data/speakingUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

const { width } = Dimensions.get('window');

/* ────────────────────────── types ────────────────────────── */

type ExerciseType =
  | 'intro'
  | 'listen'
  | 'guidedRecall'
  | 'recall'
  | 'reverseRecall'
  | 'audioMatch'
  | 'microReview'
  | 'recap';

interface Exercise {
  type: ExerciseType;
  phrase: Phrase;
  options?: string[];
  correctAnswer?: string;
}

/* ────────────────────── helpers ─────────────────────── */

function shuffleOptions(correct: string, pool: string[]): string[] {
  const others = pool
    .filter((p) => p !== correct)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return [correct, ...others].sort(() => Math.random() - 0.5);
}

/* ────────── multi-stage progressive exercise builder ─────── */

function buildExercises(phrases: Phrase[]): Exercise[] {
  const exercises: Exercise[] = [];
  const batchSize = 2;
  const batches: Phrase[][] = [];

  for (let i = 0; i < phrases.length; i += batchSize) {
    batches.push(phrases.slice(i, i + batchSize));
  }

  const allRomanized = phrases.map((p) => p.romanized);
  const allEnglish = phrases.map((p) => p.english);
  const introduced: Phrase[] = [];

  batches.forEach((batch, batchIdx) => {
    // ── STAGE 1: INTRODUCE ──
    batch.forEach((phrase) => {
      exercises.push({ type: 'intro', phrase });
      exercises.push({ type: 'listen', phrase });
    });

    // ── STAGE 2: GUIDED RECALL (answer visible at top as hint) ──
    batch.forEach((phrase) => {
      exercises.push({
        type: 'guidedRecall',
        phrase,
        options: shuffleOptions(phrase.romanized, allRomanized),
        correctAnswer: phrase.romanized,
      });
    });

    introduced.push(...batch);

    // ── STAGE 3: PRACTICE — varied unguided exercises ──
    batch.forEach((phrase) => {
      exercises.push({
        type: 'recall',
        phrase,
        options: shuffleOptions(phrase.romanized, allRomanized),
        correctAnswer: phrase.romanized,
      });
    });

    // Alternate reverse / audio across the batch
    exercises.push({
      type: 'reverseRecall',
      phrase: batch[0],
      options: shuffleOptions(batch[0].english, allEnglish),
      correctAnswer: batch[0].english,
    });

    if (batch.length > 1) {
      exercises.push({
        type: 'audioMatch',
        phrase: batch[1],
        options: shuffleOptions(batch[1].english, allEnglish),
        correctAnswer: batch[1].english,
      });
    }

    // ── STAGE 4: MICRO-REVIEW from earlier batches ──
    if (batchIdx > 0) {
      const previous = introduced.slice(0, -batch.length);
      const pick = previous[Math.floor(Math.random() * previous.length)];
      exercises.push({
        type: 'microReview',
        phrase: pick,
        options: shuffleOptions(pick.romanized, allRomanized),
        correctAnswer: pick.romanized,
      });
    }
  });

  // ── CHALLENGE ROUND: mixed quiz over all phrases ──
  const challenge = [...phrases].sort(() => Math.random() - 0.5).slice(0, Math.min(6, phrases.length));
  challenge.forEach((phrase, idx) => {
    if (idx % 3 === 0) {
      exercises.push({
        type: 'recall',
        phrase,
        options: shuffleOptions(phrase.romanized, allRomanized),
        correctAnswer: phrase.romanized,
      });
    } else if (idx % 3 === 1) {
      exercises.push({
        type: 'reverseRecall',
        phrase,
        options: shuffleOptions(phrase.english, allEnglish),
        correctAnswer: phrase.english,
      });
    } else {
      exercises.push({
        type: 'audioMatch',
        phrase,
        options: shuffleOptions(phrase.english, allEnglish),
        correctAnswer: phrase.english,
      });
    }
  });

  // ── RECAP ──
  exercises.push({ type: 'recap', phrase: phrases[0] });

  return exercises;
}

/* ═══════════════════════ CARD COMPONENTS ═══════════════════════ */

/* ──────────── Intro Card ──────────── */

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

/* ──────────── Listen Card ──────────── */

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

/* ──────────── Guided Recall Card (with hint) ──────────── */

function GuidedRecallCard({
  phrase,
  options,
  correctAnswer,
  showScript,
  onNext,
  onAnswer,
}: {
  phrase: Phrase;
  options: string[];
  correctAnswer: string;
  showScript: boolean;
  onNext: () => void;
  onAnswer: (correct: boolean) => void;
}) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const { correctFeedback, incorrectFeedback } = useFeedback();
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    const correct = option === correctAnswer;
    correct ? correctFeedback() : incorrectFeedback();
    onAnswer(correct);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.md }]}>
        GUIDED PRACTICE
      </Text>

      <View style={styles.centerContent}>
        {/* Hint area — shows the answer so the user can match */}
        <Card variant="outlined" padding="medium" style={{ marginBottom: Spacing.xxl, width: '100%' }}>
          <Text style={[Typography.caption, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.sm }]}>
            Remember this phrase:
          </Text>
          <Text style={[Typography.h4, { color: colors.text, textAlign: 'center' }]}>
            {phrase.english}
          </Text>
          <TouchableOpacity onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })} style={{ alignSelf: 'center', marginTop: Spacing.sm }}>
            <Text style={[Typography.romanized, { color: colors.romanized, textAlign: 'center' }]}>
              {phrase.romanized} 🔊
            </Text>
          </TouchableOpacity>
        </Card>

        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg }]}>
          Now pick the correct phrase for "{phrase.english}"
        </Text>

        <View style={styles.optionsList}>
          {options.map((option, idx) => {
            const isSelected = selected === option;
            const isCorrect = option === correctAnswer;
            let bg = colors.surface;
            let border = colors.border;

            // Subtle hint: correct option gets a tiny accent bg
            if (!showResult && isCorrect) {
              bg = colors.primary + '08';
            }

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
                {showResult && isCorrect && <Text style={styles.optionMark}>✓</Text>}
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
              {selected === correctAnswer ? '🎉 Great start!' : `The answer was: ${correctAnswer}`}
            </Text>
          </View>
          <Button title="Continue" onPress={onNext} size="large" fullWidth />
        </View>
      )}
    </View>
  );
}

/* ──────────── Recall Card (English → Nepali) ──────────── */

function RecallCard({
  phrase,
  options,
  correctAnswer,
  label,
  onNext,
  onAnswer,
}: {
  phrase: Phrase;
  options: string[];
  correctAnswer: string;
  label?: string;
  onNext: () => void;
  onAnswer: (correct: boolean) => void;
}) {
  const { colors } = useTheme();
  const { correctFeedback, incorrectFeedback } = useFeedback();
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    const correct = option === correctAnswer;
    correct ? correctFeedback() : incorrectFeedback();
    onAnswer(correct);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
        {label || 'RECALL'}
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
              if (isCorrect) { bg = colors.correctBg; border = colors.correctBorder; }
              else if (isSelected && !isCorrect) { bg = colors.incorrectBg; border = colors.incorrectBorder; }
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
                {showResult && isCorrect && <Text style={styles.optionMark}>✓</Text>}
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

/* ──────────── Reverse Recall Card (Nepali → English) ──────────── */

function ReverseRecallCard({
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
  const { correctFeedback, incorrectFeedback } = useFeedback();
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    const correct = option === correctAnswer;
    correct ? correctFeedback() : incorrectFeedback();
    onAnswer(correct);
  };

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
        WHAT DOES THIS MEAN?
      </Text>

      <View style={styles.centerContent}>
        <TouchableOpacity
          onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })}
          style={{ alignItems: 'center', marginBottom: Spacing.lg }}
        >
          <Text style={[Typography.devanagariSmall, { color: colors.devanagari, textAlign: 'center' }]}>
            {phrase.devanagari}
          </Text>
          <Text style={[Typography.romanized, { color: colors.romanized, textAlign: 'center', marginTop: Spacing.xs }]}>
            {phrase.romanized}
          </Text>
          <Text style={[Typography.caption, { color: colors.primary, marginTop: Spacing.sm }]}>
            🔊 Tap to hear
          </Text>
        </TouchableOpacity>

        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }]}>
          Choose the English meaning
        </Text>

        <View style={styles.optionsList}>
          {options.map((option, idx) => {
            const isSelected = selected === option;
            const isCorrect = option === correctAnswer;
            let bg = colors.surface;
            let border = colors.border;

            if (showResult) {
              if (isCorrect) { bg = colors.correctBg; border = colors.correctBorder; }
              else if (isSelected && !isCorrect) { bg = colors.incorrectBg; border = colors.incorrectBorder; }
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
                {showResult && isCorrect && <Text style={styles.optionMark}>✓</Text>}
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

/* ──────────── Audio Match Card ──────────── */

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
  const { correctFeedback, incorrectFeedback } = useFeedback();
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    const correct = option === correctAnswer;
    correct ? correctFeedback() : incorrectFeedback();
    onAnswer(correct);
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
              if (isCorrect) { bg = colors.correctBg; border = colors.correctBorder; }
              else if (isSelected && !isCorrect) { bg = colors.incorrectBg; border = colors.incorrectBorder; }
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

/* ──────────── Recap Card ──────────── */

function RecapCard({
  phrases,
  score,
  total,
  missedCount,
  onFinish,
}: {
  phrases: Phrase[];
  score: number;
  total: number;
  missedCount: number;
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

        {missedCount > 0 && (
          <View style={[styles.noteBox, { backgroundColor: colors.warningLight, borderColor: colors.warning + '40', marginTop: Spacing.lg, alignSelf: 'stretch' }]}>
            <Text style={[Typography.caption, { color: colors.text, textAlign: 'center' }]}>
              💪 You retried {missedCount} phrase{missedCount > 1 ? 's' : ''} — great persistence!
            </Text>
          </View>
        )}

        <View style={[styles.recapList, { backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.lg }]}>
          <Text style={[Typography.captionBold, { color: colors.textSecondary, marginBottom: Spacing.md }]}>
            PHRASES PRACTICED
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

/* ═══════════════════════ MAIN LESSON SCREEN ═══════════════════════ */

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
  const initialExercises = useMemo(() => buildExercises(unit.phrases), [unit.id]);

  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const missedIds = useRef(new Set<string>());
  const [requeueInserted, setRequeueInserted] = useState(false);
  const [requeueCount, setRequeueCount] = useState(0);

  const progress = ((currentStep + 1) / exercises.length) * 100;
  const current = exercises[currentStep];

  const handleNext = () => {
    const next = currentStep + 1;
    if (next >= exercises.length) return;

    // Before showing recap, inject re-queue exercises for missed items
    if (
      exercises[next].type === 'recap' &&
      missedIds.current.size > 0 &&
      !requeueInserted
    ) {
      const missed = unit.phrases.filter((p) => missedIds.current.has(p.id));
      const allRomanized = unit.phrases.map((p) => p.romanized);

      const requeueExs: Exercise[] = missed.map((phrase) => ({
        type: 'recall' as ExerciseType,
        phrase,
        options: shuffleOptions(phrase.romanized, allRomanized),
        correctAnswer: phrase.romanized,
      }));

      setExercises((prev) => [
        ...prev.slice(0, next),
        ...requeueExs,
        prev[prev.length - 1], // recap stays at end
      ]);
      setRequeueInserted(true);
      setRequeueCount(missed.length);
    }

    setCurrentStep(next);
  };

  const handleAnswer = async (correct: boolean) => {
    setTotalAnswered((t) => t + 1);
    if (correct) {
      setScore((s) => s + 1);
      missedIds.current.delete(current.phrase.id);
    } else {
      missedIds.current.add(current.phrase.id);
    }
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
        {current.type === 'guidedRecall' && current.options && current.correctAnswer && (
          <GuidedRecallCard
            key={currentStep}
            phrase={current.phrase}
            options={current.options}
            correctAnswer={current.correctAnswer}
            showScript={showScript}
            onNext={handleNext}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === 'recall' && current.options && current.correctAnswer && (
          <RecallCard
            key={currentStep}
            phrase={current.phrase}
            options={current.options}
            correctAnswer={current.correctAnswer}
            onNext={handleNext}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === 'reverseRecall' && current.options && current.correctAnswer && (
          <ReverseRecallCard
            key={currentStep}
            phrase={current.phrase}
            options={current.options}
            correctAnswer={current.correctAnswer}
            onNext={handleNext}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === 'audioMatch' && current.options && current.correctAnswer && (
          <AudioMatchCard
            key={currentStep}
            phrase={current.phrase}
            options={current.options}
            correctAnswer={current.correctAnswer}
            onNext={handleNext}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === 'microReview' && current.options && current.correctAnswer && (
          <RecallCard
            key={currentStep}
            phrase={current.phrase}
            options={current.options}
            correctAnswer={current.correctAnswer}
            label="⚡ QUICK REVIEW"
            onNext={handleNext}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === 'recap' && (
          <RecapCard
            phrases={unit.phrases}
            score={score}
            total={totalAnswered}
            missedCount={requeueCount}
            onFinish={handleFinish}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ═══════════════════════ STYLES ═══════════════════════ */

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
