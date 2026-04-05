import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import { useFeedback } from '@/hooks/useFeedback';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { scriptUnits, ScriptItem } from '@/data/scriptUnits';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

/* ────────────────────────── types ────────────────────────── */

type ExerciseType = 'teach' | 'guidedRecognise' | 'recognise' | 'recall' | 'microReview' | 'recap';

interface Exercise {
  type: ExerciseType;
  item: ScriptItem;
  options?: string[];
  correctAnswer?: string;
  questionType?: 'charToSound' | 'soundToChar';
  label?: string;
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

function buildExercises(items: ScriptItem[]): Exercise[] {
  const exercises: Exercise[] = [];
  const batchSize = 2;
  const batches: ScriptItem[][] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const allSounds = items.map((i) => i.transliteration);
  const allChars = items.map((i) => i.character);
  const introduced: ScriptItem[] = [];

  batches.forEach((batch, batchIdx) => {
    batch.forEach((item) => { exercises.push({ type: 'teach', item }); });

    batch.forEach((item) => {
      if (allSounds.filter((s) => s !== item.transliteration).length >= 1) {
        exercises.push({
          type: 'guidedRecognise', item, questionType: 'charToSound',
          options: shuffleOptions(item.transliteration, allSounds),
          correctAnswer: item.transliteration,
        });
      }
    });

    introduced.push(...batch);

    batch.forEach((item) => {
      if (allSounds.filter((s) => s !== item.transliteration).length >= 1) {
        exercises.push({
          type: 'recognise', item, questionType: 'charToSound',
          options: shuffleOptions(item.transliteration, allSounds),
          correctAnswer: item.transliteration,
        });
      }
    });

    if (allChars.filter((c) => c !== batch[0].character).length >= 1) {
      exercises.push({
        type: 'recall', item: batch[0], questionType: 'soundToChar',
        options: shuffleOptions(batch[0].character, allChars),
        correctAnswer: batch[0].character,
      });
    }
    if (batch.length > 1 && allChars.filter((c) => c !== batch[1].character).length >= 1) {
      exercises.push({
        type: 'recall', item: batch[1], questionType: 'soundToChar',
        options: shuffleOptions(batch[1].character, allChars),
        correctAnswer: batch[1].character,
      });
    }

    if (batchIdx > 0) {
      const previous = introduced.slice(0, -batch.length);
      const pick = previous[Math.floor(Math.random() * previous.length)];
      if (allSounds.filter((s) => s !== pick.transliteration).length >= 1) {
        exercises.push({
          type: 'microReview', item: pick, questionType: 'charToSound',
          options: shuffleOptions(pick.transliteration, allSounds),
          correctAnswer: pick.transliteration, label: '⚡ QUICK REVIEW',
        });
      }
    }
  });

  const challenge = [...items].sort(() => Math.random() - 0.5).slice(0, Math.min(4, items.length));
  challenge.forEach((item, idx) => {
    if (idx % 2 === 0) {
      if (allSounds.filter((s) => s !== item.transliteration).length >= 1) {
        exercises.push({ type: 'recognise', item, questionType: 'charToSound', options: shuffleOptions(item.transliteration, allSounds), correctAnswer: item.transliteration });
      }
    } else {
      if (allChars.filter((c) => c !== item.character).length >= 1) {
        exercises.push({ type: 'recall', item, questionType: 'soundToChar', options: shuffleOptions(item.character, allChars), correctAnswer: item.character });
      }
    }
  });

  exercises.push({ type: 'recap', item: items[0] });
  return exercises;
}

/* ═══════════════════════ CARD COMPONENTS ═══════════════════════
 *
 *  Quiz cards receive selected / showResult / onSelect from the PARENT.
 *  They have ZERO internal quiz state.
 *
 * ═══════════════════════════════════════════════════════════════ */

/* ──────────── Option List (shared renderer for text options) ──────────── */

function OptionList({
  options, correctAnswer, selected, showResult, onSelect,
}: {
  options: string[]; correctAnswer: string; selected: string | null;
  showResult: boolean; onSelect: (opt: string) => void;
}) {
  const { colors } = useTheme();
  return (
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
          <TouchableOpacity key={idx} style={[styles.optionBtn, { backgroundColor: bg, borderColor: border }]} onPress={() => onSelect(option)} activeOpacity={0.7} disabled={showResult}>
            <Text style={[Typography.body, { color: colors.text }]}>{option}</Text>
            {showResult && isCorrect && <Text style={styles.optionMark}>✓</Text>}
            {showResult && isSelected && !isCorrect && <Text style={[styles.optionMark, { color: colors.error }]}>✗</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ──────────── Result Footer (shared) ──────────── */

function ResultFooter({ selected, correctAnswer, onNext, successText }: { selected: string | null; correctAnswer: string; onNext: () => void; successText?: string; }) {
  const { colors } = useTheme();
  const isCorrect = selected === correctAnswer;
  return (
    <View style={styles.bottomButton}>
      <Text style={[Typography.bodyBold, { color: isCorrect ? colors.success : colors.error, textAlign: 'center', marginBottom: Spacing.md }]}>
        {isCorrect ? (successText || '🎉 Correct!') : `Answer: ${correctAnswer}`}
      </Text>
      <Button title="Continue" onPress={onNext} size="large" fullWidth />
    </View>
  );
}

/* ──────────── Teach Card ──────────── */

function TeachCard({ item, onNext }: { item: ScriptItem; onNext: () => void }) {
  const { colors } = useTheme();
  const { speak } = useSpeech();

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xl }]}>
        {item.type === 'vowel' ? 'VOWEL' : item.type === 'consonant' ? 'CONSONANT' : item.type === 'matra' ? 'MATRA' : item.type === 'syllable' ? 'SYLLABLE' : item.type === 'phrase' ? 'PHRASE' : 'WORD'}
      </Text>
      <Card variant="elevated" padding="large" style={styles.teachCard}>
        <TouchableOpacity
          style={[styles.charDisplay, { backgroundColor: colors.scriptCharBg, borderColor: colors.scriptCharBorder }]}
          onPress={() => speak(item.character, { audioFile: item.audioFile })}
          activeOpacity={0.7}
        >
          <Text style={[item.character.length <= 2 ? Typography.devanagariLarge : Typography.devanagariMedium, { color: colors.devanagari, textAlign: 'center' }]}>
            {item.character}
          </Text>
        </TouchableOpacity>
        <View style={{ marginTop: Spacing.lg }}>
          <Text style={[Typography.romanized, { color: colors.romanized, textAlign: 'center' }]}>{item.transliteration}</Text>
          {item.phonetic && <Text style={[Typography.caption, { color: colors.textTertiary, textAlign: 'center', fontStyle: 'italic', marginTop: Spacing.xs }]}>{item.phonetic}</Text>}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.lg }}>
          <TouchableOpacity style={[styles.audioBtn, { backgroundColor: colors.primary + '15' }]} onPress={() => speak(item.character, { audioFile: item.audioFile, rate: 1.0 })} activeOpacity={0.7}>
            <Text style={{ fontSize: 20 }}>🔊</Text>
            <Text style={[Typography.captionBold, { color: colors.primary, marginLeft: Spacing.sm }]}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.audioBtn, { backgroundColor: colors.secondary + '15' }]} onPress={() => speak(item.character, { audioFile: item.audioFile, rate: 0.5 })} activeOpacity={0.7}>
            <Text style={{ fontSize: 20 }}>🐢</Text>
            <Text style={[Typography.captionBold, { color: colors.secondary, marginLeft: Spacing.sm }]}>Slow</Text>
          </TouchableOpacity>
        </View>
        {item.example && (
          <View style={[styles.exampleBox, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[Typography.caption, { color: colors.textSecondary }]}>Example:</Text>
            <TouchableOpacity onPress={() => item.example && speak(item.example)} style={styles.exampleRow}>
              <Text style={[Typography.devanagariBody, { color: colors.devanagari }]}>{item.example}</Text>
              {item.exampleMeaning && <Text style={[Typography.caption, { color: colors.textSecondary }]}> = {item.exampleMeaning}</Text>}
              <Text style={{ fontSize: 14, marginLeft: Spacing.sm }}>🔊</Text>
            </TouchableOpacity>
          </View>
        )}
        {item.notes && (
          <View style={[styles.noteBox, { backgroundColor: colors.accent + '15' }]}>
            <Text style={[Typography.caption, { color: colors.text }]}>💡 {item.notes}</Text>
          </View>
        )}
      </Card>
      <View style={styles.bottomButton}>
        <Button title="Continue" onPress={onNext} size="large" fullWidth />
      </View>
    </View>
  );
}

/* ──────────── Guided Recognise Card ──────────── */

function GuidedRecogniseCard({ item, options, correctAnswer, selected, showResult, onSelect, onNext }: { item: ScriptItem; options: string[]; correctAnswer: string; } & QuizState) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setShowHint(false);
  }, [item.character]);

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.md }]}>GUIDED PRACTICE</Text>
      <View style={styles.centerContent}>
        {!showHint ? (
          <TouchableOpacity
            style={{ marginBottom: Spacing.xl, width: '100%', alignItems: 'center', padding: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: colors.surface }}
            onPress={() => setShowHint(true)}
            activeOpacity={0.7}
          >
            <Text style={[Typography.bodyBold, { color: colors.primary }]}>💡 Show Hint</Text>
          </TouchableOpacity>
        ) : (
          <Card variant="outlined" padding="medium" style={{ marginBottom: Spacing.xl, width: '100%' }}>
            <Text style={[Typography.caption, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.sm }]}>Remember this character:</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.md }}>
              <Text style={[Typography.devanagariSmall, { color: colors.devanagari }]}>{item.character}</Text>
              <Text style={[Typography.h4, { color: colors.text }]}>=</Text>
              <Text style={[Typography.romanized, { color: colors.romanized }]}>{item.transliteration}</Text>
            </View>
          </Card>
        )}
        <TouchableOpacity style={[styles.charDisplay, { backgroundColor: colors.scriptCharBg, borderColor: colors.scriptCharBorder }]} onPress={() => speak(item.character, { audioFile: item.audioFile })} activeOpacity={0.7}>
          <Text style={[item.character.length <= 2 ? Typography.devanagariLarge : Typography.devanagariMedium, { color: colors.devanagari, textAlign: 'center' }]}>{item.character}</Text>
        </TouchableOpacity>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg, marginBottom: Spacing.lg }]}>Now pick the correct sound</Text>
        <OptionList options={options} correctAnswer={correctAnswer} selected={selected} showResult={showResult} onSelect={onSelect} />
      </View>
      {showResult && <ResultFooter selected={selected} correctAnswer={correctAnswer} onNext={onNext} successText="🎉 Great start!" />}
    </View>
  );
}

/* ──────────── Recognise Card (no hints) ──────────── */

function RecogniseCard({ item, options, correctAnswer, label, selected, showResult, onSelect, onNext }: { item: ScriptItem; options: string[]; correctAnswer: string; label?: string; } & QuizState) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xl }]}>{label || 'WHAT SOUND IS THIS?'}</Text>
      <View style={styles.centerContent}>
        <TouchableOpacity style={[styles.charDisplay, { backgroundColor: colors.scriptCharBg, borderColor: colors.scriptCharBorder }]} onPress={() => speak(item.character, { audioFile: item.audioFile })} activeOpacity={0.7}>
          <Text style={[item.character.length <= 2 ? Typography.devanagariLarge : Typography.devanagariMedium, { color: colors.devanagari, textAlign: 'center' }]}>{item.character}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.xl }}>
          <TouchableOpacity style={[styles.listenHint, { backgroundColor: colors.primary + '15' }]} onPress={() => speak(item.character, { audioFile: item.audioFile, rate: 1.0 })} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>🔊</Text>
            <Text style={[Typography.caption, { color: colors.primary, marginLeft: Spacing.xs }]}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.listenHint, { backgroundColor: colors.secondary + '15' }]} onPress={() => speak(item.character, { audioFile: item.audioFile, rate: 0.5 })} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>🐢</Text>
            <Text style={[Typography.caption, { color: colors.secondary, marginLeft: Spacing.xs }]}>Slow</Text>
          </TouchableOpacity>
        </View>
        <OptionList options={options} correctAnswer={correctAnswer} selected={selected} showResult={showResult} onSelect={onSelect} />
      </View>
      {showResult && <ResultFooter selected={selected} correctAnswer={correctAnswer} onNext={onNext} />}
    </View>
  );
}

/* ──────────── Recall Char Card (sound → character) ──────────── */

function RecallCharCard({ item, options, correctAnswer, selected, showResult, onSelect, onNext }: { item: ScriptItem; options: string[]; correctAnswer: string; } & QuizState) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xl }]}>FIND THE CHARACTER</Text>
      <View style={styles.centerContent}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.sm }]}>Which one is "{item.transliteration}"?</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.xxl }}>
          <TouchableOpacity style={[styles.listenHint, { backgroundColor: colors.primary + '15' }]} onPress={() => speak(item.character, { audioFile: item.audioFile, rate: 1.0 })} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>🔊</Text>
            <Text style={[Typography.caption, { color: colors.primary, marginLeft: Spacing.xs }]}>Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.listenHint, { backgroundColor: colors.secondary + '15' }]} onPress={() => speak(item.character, { audioFile: item.audioFile, rate: 0.5 })} activeOpacity={0.7}>
            <Text style={{ fontSize: 18 }}>🐢</Text>
            <Text style={[Typography.caption, { color: colors.secondary, marginLeft: Spacing.xs }]}>Slow</Text>
          </TouchableOpacity>
        </View>
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
              <TouchableOpacity key={idx} style={[styles.charOption, { backgroundColor: bg, borderColor: border }]} onPress={() => onSelect(option)} activeOpacity={0.7} disabled={showResult}>
                <Text style={[option.length <= 2 ? Typography.devanagariMedium : Typography.devanagariSmall, { color: colors.devanagari, textAlign: 'center' }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {showResult && <ResultFooter selected={selected} correctAnswer={correctAnswer} onNext={onNext} />}
    </View>
  );
}

/* ──────────── Script Recap ──────────── */

function ScriptRecap({ items, score, total, missedCount, onFinish }: { items: ScriptItem[]; score: number; total: number; missedCount: number; onFinish: () => void; }) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const pct = total > 0 ? Math.round((score / total) * 100) : 100;

  return (
    <View style={styles.exerciseContainer}>
      <View style={styles.centerContent}>
        <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: Spacing.xxl }}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</Text>
        <Text style={[Typography.h2, { color: colors.text, textAlign: 'center', marginBottom: Spacing.md }]}>Unit Complete!</Text>
        <Text style={[Typography.h1, { color: colors.secondary, textAlign: 'center' }]}>{pct}%</Text>
        <Text style={[Typography.body, { color: colors.textSecondary, marginTop: Spacing.sm }]}>{score} of {total} correct</Text>
        {missedCount > 0 && (
          <View style={[styles.noteBox, { backgroundColor: colors.warningLight || '#FEF5E7', borderColor: (colors.warning || '#F39C12') + '40', marginTop: Spacing.lg, alignSelf: 'stretch' }]}>
            <Text style={[Typography.caption, { color: colors.text, textAlign: 'center' }]}>💪 You retried {missedCount} character{missedCount > 1 ? 's' : ''} — great persistence!</Text>
          </View>
        )}
        <View style={[styles.recapGrid, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[Typography.captionBold, { color: colors.textSecondary, marginBottom: Spacing.md }]}>CHARACTERS PRACTICED</Text>
          <View style={styles.charGridWrap}>
            {items.map((item, idx) => (
              <TouchableOpacity key={idx} style={[styles.recapCharBox, { backgroundColor: colors.scriptCharBg, borderColor: colors.scriptCharBorder }]} onPress={() => speak(item.character, { audioFile: item.audioFile })} activeOpacity={0.7}>
                <Text style={[Typography.devanagariSmall, { color: colors.devanagari }]}>{item.character}</Text>
                <Text style={[Typography.small, { color: colors.romanized }]}>{item.transliteration}</Text>
                {item.phonetic && <Text style={[Typography.small, { color: colors.textTertiary, fontStyle: 'italic' }]}>{item.phonetic}</Text>}
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

/* ═══════════════════════ MAIN SCREEN ═══════════════════════ */

export default function ScriptLessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { progress, completeScriptLesson, updateItemMastery, updateStreak } = useProgress();
  const { correctFeedback, incorrectFeedback } = useFeedback();

  const unit = scriptUnits.find((u) => u.id === id);
  if (!unit) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginTop: 100 }]}>Script lesson not found</Text>
      </SafeAreaView>
    );
  }

  const lessonProgress = progress.scriptLessons[unit.id];
  const completedIds = lessonProgress?.completedItems || [];
  const sessionItemsRef = useRef<ScriptItem[]>([]);

  const initialExercises = useMemo(() => {
    const uncompletedItems = unit.items.filter(item => !completedIds.includes(`${unit.id}-${item.transliteration}`));
    const sessionItems = uncompletedItems.length > 0 ? uncompletedItems.slice(0, 4) : [...unit.items].sort(() => Math.random() - 0.5).slice(0, 4);
    sessionItemsRef.current = sessionItems;

    let exs = buildExercises(sessionItems);

    const completedItemsData = unit.items.filter(item => completedIds.includes(`${unit.id}-${item.transliteration}`));
    if (completedItemsData.length > 0 && uncompletedItems.length > 0) {
      const shuffled = [...completedItemsData].sort(() => Math.random() - 0.5).slice(0, 2);
      const allSounds = unit.items.map((i) => i.transliteration);
      const prepends = shuffled.map(item => ({
        type: 'microReview' as ExerciseType,
        item,
        questionType: 'charToSound' as const,
        options: shuffleOptions(item.transliteration, allSounds),
        correctAnswer: item.transliteration,
        label: '⚡ QUICK REFRESHER'
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

  useEffect(() => {
    setSelectedAnswer(null);
    setResultRevealed(false);
  }, [currentStep]);

  const progressPct = ((currentStep + 1) / exercises.length) * 100;
  const current = exercises[currentStep];
  const itemKey = (item: ScriptItem) => `${unit.id}-${item.transliteration}`;

  const currentItemKeyRef = useRef(itemKey(current.item));
  currentItemKeyRef.current = itemKey(current.item);

  const handleSelect = (option: string) => {
    if (resultRevealed) return;
    setSelectedAnswer(option);
    setResultRevealed(true);

    const isCorrect = option === current.correctAnswer;
    isCorrect ? correctFeedback() : incorrectFeedback();

    const key = currentItemKeyRef.current;
    setTotalAnswered((t) => t + 1);
    if (isCorrect) {
      setScore((s) => s + 1);
      missedIds.current.delete(key);
    } else {
      missedIds.current.add(key);
    }
    updateItemMastery(key, isCorrect);
  };

  const handleNext = () => {
    const next = currentStep + 1;
    if (next >= exercises.length) return;

    if (
      exercises[next].type === 'recap' &&
      missedIds.current.size > 0 &&
      !requeueInserted
    ) {
      const missed = unit.items.filter((i) => missedIds.current.has(itemKey(i)));
      const allSounds = unit.items.map((i) => i.transliteration);
      const requeueExs: Exercise[] = missed.map((item) => ({
        type: 'recognise' as ExerciseType,
        item, questionType: 'charToSound' as const,
        options: shuffleOptions(item.transliteration, allSounds),
        correctAnswer: item.transliteration,
      }));
      setExercises((prev) => [...prev.slice(0, next), ...requeueExs, prev[prev.length - 1]]);
      setRequeueInserted(true);
      setRequeueCount(missed.length);
    }

    setCurrentStep(next);
  };

  const handleFinish = async () => {
    const newlyCompletedIds = sessionItemsRef.current.map(item => `${unit.id}-${item.transliteration}`);
    const isComplete = completedIds.length + sessionItemsRef.current.length >= unit.items.length;
    await completeScriptLesson(unit.id, newlyCompletedIds, isComplete);
    await updateStreak();
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
          <ProgressBar progress={progressPct} height={6} color={colors.secondary} />
        </View>
        <Text style={[Typography.caption, { color: colors.textSecondary }]}>
          {currentStep + 1}/{exercises.length}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {current.type === 'teach' && <TeachCard item={current.item} onNext={handleNext} />}
        {current.type === 'guidedRecognise' && current.options && current.correctAnswer && (
          <GuidedRecogniseCard item={current.item} options={current.options} correctAnswer={current.correctAnswer} {...quizProps} />
        )}
        {(current.type === 'recognise' || current.type === 'microReview') && current.options && current.correctAnswer && (
          <RecogniseCard item={current.item} options={current.options} correctAnswer={current.correctAnswer} label={current.label} {...quizProps} />
        )}
        {current.type === 'recall' && current.options && current.correctAnswer && (
          <RecallCharCard item={current.item} options={current.options} correctAnswer={current.correctAnswer} {...quizProps} />
        )}
        {current.type === 'recap' && (
          <ScriptRecap items={unit.items} score={score} total={totalAnswered} missedCount={requeueCount} onFinish={handleFinish} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ═══════════════════════ STYLES ═══════════════════════ */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  lessonHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  exerciseContainer: { flex: 1, paddingHorizontal: Spacing.xl, justifyContent: 'space-between' },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  teachCard: { marginTop: Spacing.lg },
  charDisplay: { alignSelf: 'center', minWidth: 120, minHeight: 120, borderRadius: BorderRadius.xl, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  audioBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, borderRadius: BorderRadius.full, alignSelf: 'center' },
  exampleBox: { marginTop: Spacing.lg, padding: Spacing.md, borderRadius: BorderRadius.md },
  exampleRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  noteBox: { marginTop: Spacing.md, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'transparent' },
  listenHint: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.full },
  optionsList: { width: '100%', gap: Spacing.sm },
  optionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 2 },
  optionMark: { fontSize: 18, fontWeight: '700', color: '#4CAF50' },
  charGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'center', marginTop: Spacing.lg, width: '100%' },
  charOption: { width: '45%', aspectRatio: 1, borderRadius: BorderRadius.lg, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bottomButton: { paddingBottom: Spacing.xxxl, paddingTop: Spacing.lg },
  recapGrid: { marginTop: Spacing.xxl, padding: Spacing.lg, borderRadius: BorderRadius.lg, width: '100%' },
  charGridWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  recapCharBox: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center', minWidth: 60 },
});
