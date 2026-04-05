import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useUser } from '@/context/UserContext';
import { useProgress } from '@/context/ProgressContext';
import { useSpeech } from '@/hooks/useSpeech';
import { useFeedbackEffects } from '@/src/hooks/useFeedbackEffects';
import { useEntryAnimation } from '@/src/hooks/useEntryAnimation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ParticleEffect } from '@/components/ui/ParticleEffect';
import { speakingUnits, Phrase } from '@/data/speakingUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';
import { spring, interaction, duration } from '@/src/design/motion';
import { pickRandom, CORRECT_MESSAGES, INCORRECT_MESSAGES, getCompletionMessage, XP_AWARDS } from '@/src/design/cultural';

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

/** Props shared by every quiz-style card — state lives in the PARENT */
interface QuizState {
  selected: string | null;
  showResult: boolean;
  onSelect: (option: string) => void;
  onNext: () => void;
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

    // ── STAGE 2: GUIDED RECALL ──
    batch.forEach((phrase) => {
      exercises.push({
        type: 'guidedRecall',
        phrase,
        options: shuffleOptions(phrase.romanized, allRomanized),
        correctAnswer: phrase.romanized,
      });
    });

    introduced.push(...batch);

    // ── STAGE 3: PRACTICE ──
    batch.forEach((phrase) => {
      exercises.push({
        type: 'recall',
        phrase,
        options: shuffleOptions(phrase.romanized, allRomanized),
        correctAnswer: phrase.romanized,
      });
    });

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

    // ── STAGE 4: MICRO-REVIEW ──
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

  // ── CHALLENGE ROUND ──
  const challenge = [...phrases].sort(() => Math.random() - 0.5).slice(0, Math.min(6, phrases.length));
  challenge.forEach((phrase, idx) => {
    if (idx % 3 === 0) {
      exercises.push({ type: 'recall', phrase, options: shuffleOptions(phrase.romanized, allRomanized), correctAnswer: phrase.romanized });
    } else if (idx % 3 === 1) {
      exercises.push({ type: 'reverseRecall', phrase, options: shuffleOptions(phrase.english, allEnglish), correctAnswer: phrase.english });
    } else {
      exercises.push({ type: 'audioMatch', phrase, options: shuffleOptions(phrase.english, allEnglish), correctAnswer: phrase.english });
    }
  });

  exercises.push({ type: 'recap', phrase: phrases[0] });
  return exercises;
}

/* ═══════════════════════ CARD COMPONENTS ═══════════════════════
 *
 *  IMPORTANT: Quiz cards receive selected / showResult / onSelect
 *  from the PARENT. They have ZERO internal quiz state.
 *  This makes cross-exercise state leaks impossible.
 *
 * ═══════════════════════════════════════════════════════════════ */

/* ──────────── Animated Option (individual) ──────────── */

function AnimatedOption({
  option,
  correctAnswer,
  selected,
  showResult,
  onSelect,
}: {
  option: string;
  correctAnswer: string;
  selected: string | null;
  showResult: boolean;
  onSelect: (opt: string) => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const isSelected = selected === option;
  const isCorrect = option === correctAnswer;

  useEffect(() => {
    if (!showResult) {
      scale.value = 1;
      translateX.value = 0;
      return;
    }
    if (isCorrect) {
      // Scale pop for correct answer
      scale.value = withSequence(
        withSpring(interaction.correctPopScale, spring.pop),
        withSpring(1, spring.release)
      );
    } else if (isSelected && !isCorrect) {
      // Horizontal shake for incorrect
      const d = interaction.shakeDistance;
      translateX.value = withSequence(
        withTiming(-d, { duration: 50 }),
        withTiming(d, { duration: 50 }),
        withTiming(-d / 2, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [showResult]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
  }));

  let bg = colors.surface;
  let border = colors.border;
  if (showResult) {
    if (isCorrect) { bg = colors.correctBg; border = colors.correctBorder; }
    else if (isSelected && !isCorrect) { bg = colors.incorrectBg; border = colors.incorrectBorder; }
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]}
        onPress={() => onSelect(option)}
        disabled={showResult}
      >
        <Text style={[Typography.body, { color: colors.text }]}>{option}</Text>
        {showResult && isCorrect && <Text style={styles.optionMark}>✓</Text>}
        {showResult && isSelected && !isCorrect && (
          <Text style={[styles.optionMark, { color: colors.error }]}>✗</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

/* ──────────── Option list (shared renderer) ──────────── */

function OptionList({
  options,
  correctAnswer,
  selected,
  showResult,
  onSelect,
}: {
  options: string[];
  correctAnswer: string;
  selected: string | null;
  showResult: boolean;
  onSelect: (opt: string) => void;
}) {
  return (
    <View style={styles.optionsList}>
      {options.map((option, idx) => (
        <AnimatedOption
          key={idx}
          option={option}
          correctAnswer={correctAnswer}
          selected={selected}
          showResult={showResult}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

/* ──────────── Result + Continue (shared renderer) ──────────── */

function ResultFooter({
  selected,
  correctAnswer,
  onNext,
  successText,
}: {
  selected: string | null;
  correctAnswer: string;
  onNext: () => void;
  successText?: string;
}) {
  const { colors } = useTheme();
  const isCorrect = selected === correctAnswer;
  const message = isCorrect
    ? (successText || pickRandom(CORRECT_MESSAGES))
    : pickRandom(INCORRECT_MESSAGES);

  return (
    <View style={styles.bottomButton}>
      <View style={styles.resultFeedback}>
        <Text style={[Typography.bodyBold, { color: isCorrect ? colors.success : colors.error }]}>
          {isCorrect ? `🎉 ${message}` : message}
        </Text>
        {!isCorrect && (
          <Text style={[Typography.caption, { color: colors.textSecondary, marginTop: Spacing.xs }]}>
            The answer was: {correctAnswer}
          </Text>
        )}
      </View>
      <Button title="Continue" onPress={onNext} size="large" fullWidth />
    </View>
  );
}

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
          <Text style={[Typography.captionBold, { color: colors.primary, marginLeft: Spacing.sm }]}>Play Audio</Text>
        </TouchableOpacity>

        {phrase.notes && (
          <View style={[styles.noteBox, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
            <Text style={[Typography.caption, { color: colors.text }]}>💡 {phrase.notes}</Text>
          </View>
        )}
      </Card>

      <View style={styles.bottomButton}>
        <Button title="Continue" onPress={onNext} size="large" fullWidth />
      </View>
    </View>
  );
}

/* ──────────── Listen Card (hasListened comes from parent) ──────────── */

function ListenCard({
  phrase,
  hasListened,
  onListen,
  onNext,
}: {
  phrase: Phrase;
  hasListened: boolean;
  onListen: () => void;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  const { speak } = useSpeech();

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
          onPress={() => { speak(phrase.devanagari, { audioFile: phrase.audioFile }); onListen(); }}
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

/* ──────────── Guided Recall Card ──────────── */

function GuidedRecallCard({
  phrase,
  options,
  correctAnswer,
  selected,
  showResult,
  onSelect,
  onNext,
}: {
  phrase: Phrase;
  options: string[];
  correctAnswer: string;
  showScript: boolean;
} & QuizState) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [phrase.id]);

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.md }]}>
        GUIDED PRACTICE
      </Text>
      <View style={styles.centerContent}>
        {!showHint ? (
          <TouchableOpacity
            style={{ marginBottom: Spacing.xxl, width: '100%', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface }}
            onPress={() => setShowHint(true)}
            activeOpacity={0.7}
          >
            <Text style={[Typography.bodyBold, { color: colors.primary }]}>💡 Show Hint</Text>
          </TouchableOpacity>
        ) : (
          <Card variant="outlined" padding="medium" style={{ marginBottom: Spacing.xxl, width: '100%' }}>
            <Text style={[Typography.caption, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.sm }]}>Remember this phrase:</Text>
            <Text style={[Typography.h4, { color: colors.text, textAlign: 'center' }]}>{phrase.english}</Text>
            <TouchableOpacity onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })} style={{ alignSelf: 'center', marginTop: Spacing.sm }}>
              <Text style={[Typography.romanized, { color: colors.romanized, textAlign: 'center' }]}>{phrase.romanized} 🔊</Text>
            </TouchableOpacity>
          </Card>
        )}

        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg }]}>
          Now pick the correct phrase for "{phrase.english}"
        </Text>

        <OptionList options={options} correctAnswer={correctAnswer} selected={selected} showResult={showResult} onSelect={onSelect} />
      </View>

      {showResult && <ResultFooter selected={selected} correctAnswer={correctAnswer} onNext={onNext} successText="🎉 Great start!" />}
    </View>
  );
}

/* ──────────── Recall Card (English → Nepali) ──────────── */

function RecallCard({
  phrase,
  options,
  correctAnswer,
  label,
  selected,
  showResult,
  onSelect,
  onNext,
}: {
  phrase: Phrase;
  options: string[];
  correctAnswer: string;
  label?: string;
} & QuizState) {
  const { colors } = useTheme();

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
        {label || 'RECALL'}
      </Text>
      <View style={styles.centerContent}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.xxxl }]}>"{phrase.english}"</Text>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl }]}>Choose the correct Nepali phrase</Text>
        <OptionList options={options} correctAnswer={correctAnswer} selected={selected} showResult={showResult} onSelect={onSelect} />
      </View>
      {showResult && <ResultFooter selected={selected} correctAnswer={correctAnswer} onNext={onNext} />}
    </View>
  );
}

/* ──────────── Reverse Recall Card (Nepali → English) ──────────── */

function ReverseRecallCard({
  phrase,
  options,
  correctAnswer,
  selected,
  showResult,
  onSelect,
  onNext,
}: {
  phrase: Phrase;
  options: string[];
  correctAnswer: string;
} & QuizState) {
  const { colors } = useTheme();
  const { speak } = useSpeech();

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>WHAT DOES THIS MEAN?</Text>
      <View style={styles.centerContent}>
        <TouchableOpacity onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })} style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
          <Text style={[Typography.devanagariSmall, { color: colors.devanagari, textAlign: 'center' }]}>{phrase.devanagari}</Text>
          <Text style={[Typography.romanized, { color: colors.romanized, textAlign: 'center', marginTop: Spacing.xs }]}>{phrase.romanized}</Text>
          <Text style={[Typography.caption, { color: colors.primary, marginTop: Spacing.sm }]}>🔊 Tap to hear</Text>
        </TouchableOpacity>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }]}>Choose the English meaning</Text>
        <OptionList options={options} correctAnswer={correctAnswer} selected={selected} showResult={showResult} onSelect={onSelect} />
      </View>
      {showResult && <ResultFooter selected={selected} correctAnswer={correctAnswer} onNext={onNext} />}
    </View>
  );
}

/* ──────────── Audio Match Card ──────────── */

function AudioMatchCard({
  phrase,
  options,
  correctAnswer,
  selected,
  showResult,
  onSelect,
  onNext,
}: {
  phrase: Phrase;
  options: string[];
  correctAnswer: string;
} & QuizState) {
  const { colors } = useTheme();
  const { speak } = useSpeech();

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>AUDIO MATCH</Text>
      <View style={styles.centerContent}>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl }]}>Listen and choose the meaning</Text>
        <TouchableOpacity
          style={[styles.bigAudioBtn, { backgroundColor: colors.secondary }]}
          onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 40 }}>🔊</Text>
        </TouchableOpacity>
        <View style={{ marginTop: Spacing.xxxl, width: '100%' }}>
          <OptionList options={options} correctAnswer={correctAnswer} selected={selected} showResult={showResult} onSelect={onSelect} />
        </View>
      </View>
      {showResult && <ResultFooter selected={selected} correctAnswer={correctAnswer} onNext={onNext} />}
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
  const { onComplete } = useFeedbackEffects();
  const pct = total > 0 ? Math.round((score / total) * 100) : 100;
  
  useEffect(() => {
    onComplete();
  }, []);

  const headerStyle = useEntryAnimation(0);
  const percentStyle = useEntryAnimation(200);
  const listStyle = useEntryAnimation(400);

  return (
    <View style={styles.exerciseContainer}>
      <ParticleEffect active={true} count={12} spread={120} />
      <View style={styles.centerContent}>
        <Animated.View style={[headerStyle, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: Spacing.xxl }}>
            {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}
          </Text>
          <Text style={[Typography.h2, { color: colors.text, textAlign: 'center', marginBottom: Spacing.xs }]}>
            {getCompletionMessage(pct)}
          </Text>
        </Animated.View>
        <Animated.View style={[percentStyle, { alignItems: 'center', marginTop: Spacing.lg }]}>
          <Text style={[Typography.h1, { color: colors.primary, textAlign: 'center' }]}>{pct}%</Text>
          <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>{score} of {total} correct</Text>
          <View style={[styles.noteBox, { backgroundColor: colors.accent + '20', borderColor: 'transparent', alignSelf: 'stretch', alignItems: 'center', marginTop: Spacing.md }]}>
             <Text style={[Typography.captionBold, { color: colors.accentDark }]}>+{pct >= 100 ? XP_AWARDS.perfectLesson : XP_AWARDS.lessonComplete} XP earned</Text>
          </View>
        </Animated.View>

        {missedCount > 0 && (
          <Animated.View style={[percentStyle, styles.noteBox, { backgroundColor: colors.warningLight, borderColor: colors.warning + '40', marginTop: Spacing.md, alignSelf: 'stretch' }]}>
            <Text style={[Typography.caption, { color: colors.text, textAlign: 'center' }]}>
              💪 You retried {missedCount} phrase{missedCount > 1 ? 's' : ''} — great persistence!
            </Text>
          </Animated.View>
        )}

        <Animated.View style={[listStyle, styles.recapList, { backgroundColor: colors.surfaceElevated, borderRadius: BorderRadius.lg }]}>
          <Text style={[Typography.captionBold, { color: colors.textSecondary, marginBottom: Spacing.md }]}>PHRASES PRACTICED</Text>
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
                <Text style={[Typography.small, { color: colors.textTertiary, fontStyle: 'italic' }]}>{phrase.phonetic}</Text>
              </View>
              <Text style={{ fontSize: 16 }}>🔊</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
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
  const { progress, completeSpeakingLesson, updateItemMastery, updateStreak, addXP } = useProgress();
  const { onCorrect, onIncorrect, onProgress } = useFeedbackEffects();

  const unit = speakingUnits.find((u) => u.id === id);
  if (!unit) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginTop: 100 }]}>Lesson not found</Text>
      </SafeAreaView>
    );
  }

  const showScript = profile.path === 'speaking_script';
  const lessonProgress = progress.speakingLessons[unit.id];
  const completedIds = lessonProgress?.completedItems || [];
  const sessionPhrasesRef = useRef<Phrase[]>([]);

  const initialExercises = useMemo(() => {
    const uncompletedPhrases = unit.phrases.filter(p => !completedIds.includes(p.id));
    const sessionPhrases = uncompletedPhrases.length > 0 ? uncompletedPhrases.slice(0, 3) : [...unit.phrases].sort(() => Math.random() - 0.5).slice(0, 3);
    sessionPhrasesRef.current = sessionPhrases;

    let exs = buildExercises(sessionPhrases);

    const completedPhrasesData = unit.phrases.filter(p => completedIds.includes(p.id));
    if (completedPhrasesData.length > 0 && uncompletedPhrases.length > 0) {
      const shuffled = [...completedPhrasesData].sort(() => Math.random() - 0.5).slice(0, 2);
      const allRomanized = unit.phrases.map((p) => p.romanized);
      const prepends = shuffled.map(phrase => ({
        type: 'microReview' as ExerciseType,
        phrase,
        options: shuffleOptions(phrase.romanized, allRomanized),
        correctAnswer: phrase.romanized,
      }));
      exs = [...prepends, ...exs];
    }
    return exs;
  }, [unit.id, completedIds.length]);

  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const missedIds = useRef(new Set<string>());
  const [requeueInserted, setRequeueInserted] = useState(false);
  const [requeueCount, setRequeueCount] = useState(0);

  /* ── Lifted quiz state: SINGLE source of truth, reset every step ── */
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [resultRevealed, setResultRevealed] = useState(false);
  const [hasListened, setHasListened] = useState(false);

  // Explicitly reset ALL quiz state whenever the step changes
  useEffect(() => {
    setSelectedAnswer(null);
    setResultRevealed(false);
    setHasListened(false);
  }, [currentStep]);

  const progressPct = ((currentStep + 1) / exercises.length) * 100;
  const current = exercises[currentStep];
  const currentPhraseRef = useRef(current.phrase.id);
  currentPhraseRef.current = current.phrase.id;

  const handleSelect = (option: string) => {
    if (resultRevealed) return; // prevent double-tap
    setSelectedAnswer(option);
    setResultRevealed(true);

    const isCorrect = option === current.correctAnswer;
    isCorrect ? onCorrect() : onIncorrect();

    const phraseId = currentPhraseRef.current;
    setTotalAnswered((t) => t + 1);
    if (isCorrect) {
      setScore((s) => s + 1);
      missedIds.current.delete(phraseId);
    } else {
      missedIds.current.add(phraseId);
    }
    updateItemMastery(phraseId, isCorrect);
  };

  const handleNext = () => {
    const next = currentStep + 1;
    if (next >= exercises.length) return;
    onProgress();

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
        prev[prev.length - 1],
      ]);
      setRequeueInserted(true);
      setRequeueCount(missed.length);
    }

    setCurrentStep(next);
  };

  const handleFinish = async () => {
    const newlyCompletedIds = sessionPhrasesRef.current.map(p => p.id);
    const isComplete = completedIds.length + sessionPhrasesRef.current.length >= unit.phrases.length;
    await completeSpeakingLesson(unit.id, newlyCompletedIds, isComplete);
    await updateStreak();
    
    // Award XP
    const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 100;
    const isPerfect = pct >= 100;
    await addXP(isPerfect ? XP_AWARDS.perfectLesson : XP_AWARDS.lessonComplete);
    
    router.back();
  };

  const quizProps: QuizState = {
    selected: selectedAnswer,
    showResult: resultRevealed,
    onSelect: handleSelect,
    onNext: handleNext,
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.lessonHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={[Typography.h4, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: Spacing.md }}>
          <ProgressBar progress={progressPct} height={6} />
        </View>
        <Text style={[Typography.caption, { color: colors.textSecondary }]}>
          {currentStep + 1}/{exercises.length}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Animated.View key={currentStep} style={[{ flex: 1 }, useEntryAnimation(0)]}>
          {current.type === 'intro' && (
            <IntroCard phrase={current.phrase} showScript={showScript} showRomanized={profile.showRomanized} onNext={handleNext} />
          )}
          {current.type === 'listen' && (
            <ListenCard phrase={current.phrase} hasListened={hasListened} onListen={() => setHasListened(true)} onNext={handleNext} />
          )}
          {current.type === 'guidedRecall' && current.options && current.correctAnswer && (
            <GuidedRecallCard phrase={current.phrase} options={current.options} correctAnswer={current.correctAnswer} showScript={showScript} {...quizProps} />
          )}
          {current.type === 'recall' && current.options && current.correctAnswer && (
            <RecallCard phrase={current.phrase} options={current.options} correctAnswer={current.correctAnswer} {...quizProps} />
          )}
          {current.type === 'reverseRecall' && current.options && current.correctAnswer && (
            <ReverseRecallCard phrase={current.phrase} options={current.options} correctAnswer={current.correctAnswer} {...quizProps} />
          )}
          {current.type === 'audioMatch' && current.options && current.correctAnswer && (
            <AudioMatchCard phrase={current.phrase} options={current.options} correctAnswer={current.correctAnswer} {...quizProps} />
          )}
          {current.type === 'microReview' && current.options && current.correctAnswer && (
            <RecallCard phrase={current.phrase} options={current.options} correctAnswer={current.correctAnswer} label="⚡ QUICK REVIEW" {...quizProps} />
          )}
          {current.type === 'recap' && (
            <RecapCard phrases={unit.phrases} score={score} total={totalAnswered} missedCount={requeueCount} onFinish={handleFinish} />
          )}
        </Animated.View>
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
  introCard: { marginTop: Spacing.xxl },
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
    borderColor: 'transparent',
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
  optionsList: { width: '100%', gap: Spacing.sm },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  optionMark: { fontSize: 18, fontWeight: '700', color: '#4CAF50' },
  resultFeedback: { alignItems: 'center', marginBottom: Spacing.lg },
  bottomButton: { paddingBottom: Spacing.xxxl, paddingTop: Spacing.lg },
  recapList: { marginTop: Spacing.xxl, padding: Spacing.lg, width: '100%' },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
});
