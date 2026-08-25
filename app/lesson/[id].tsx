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
import { useUser } from '@/context/UserContext';
import { useProgress } from '@/context/ProgressContext';
import { useSpeech } from '@/hooks/useSpeech';
import { useRecording } from '@/hooks/useRecording';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SpeakCompare } from '@/components/ui/SpeakCompare';
import { speakingUnits, Phrase } from '@/data/speakingUnits';
import {
  buildSpeakingExercises,
  buildRequeueExercises,
  isProduceStyle,
  SpeakingExercise,
  SpeakingExerciseType,
} from '@/lib/buildSpeakingExercises';
import { Spacing, BorderRadius, Typography } from '@/constants/Typography';

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

/* ──────────── Listen & Repeat Card ──────────── */

function ListenRepeatCard({
  phrase,
  recording,
  hasRecorded,
  onRevealFallback,
  onNext,
}: {
  phrase: Phrase;
  recording: ReturnType<typeof useRecording>;
  hasRecorded: boolean;
  onRevealFallback: () => void;
  onNext: () => void;
}) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const micDenied = recording.state === 'permissionDenied';
  const canContinue = hasRecorded || micDenied;

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
        LISTEN & REPEAT
      </Text>
      <View style={styles.centerContent}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.xxl }]}>
          {phrase.english}
        </Text>
        <TouchableOpacity
          style={[styles.bigAudioBtn, { backgroundColor: colors.primary }]}
          onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 40 }}>🔊</Text>
        </TouchableOpacity>
        <Text style={[Typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.lg }]}>
          Listen to the model, then record yourself
        </Text>

        <SpeakCompare
          state={recording.state}
          onStartRecording={recording.startRecording}
          onStopRecording={recording.stopRecording}
          onPlayUser={recording.playUser}
          onPlayModel={() =>
            recording.playModel(() => speak(phrase.devanagari, { audioFile: phrase.audioFile }))
          }
          onRetake={recording.retake}
          onRevealFallback={onRevealFallback}
        />
      </View>
      <View style={styles.bottomButton}>
        <Button
          title={canContinue ? 'Continue' : 'Record once to continue'}
          onPress={onNext}
          disabled={!canContinue}
          size="large"
          fullWidth
        />
      </View>
    </View>
  );
}

/* ──────────── Produce Card (English → speak + self-grade) ──────────── */

function ProduceCard({
  phrase,
  label,
  cueWithAudio,
  recording,
  revealed,
  onReveal,
  onGotIt,
  onAgain,
}: {
  phrase: Phrase;
  label?: string;
  cueWithAudio?: boolean;
  recording: ReturnType<typeof useRecording>;
  revealed: boolean;
  onReveal: () => void;
  onGotIt: () => void;
  onAgain: () => void;
}) {
  const { colors } = useTheme();
  const { speak } = useSpeech();
  const showAnswer = revealed || !!recording.uri || recording.state === 'permissionDenied';
  const audioOnlyCue = !!cueWithAudio;

  useEffect(() => {
    if (cueWithAudio) {
      speak(phrase.devanagari, { audioFile: phrase.audioFile });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrase.id]);

  return (
    <View style={styles.exerciseContainer}>
      <Text style={[Typography.label, { color: colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl }]}>
        {label || 'SAY IT IN NEPALI'}
      </Text>
      <View style={styles.centerContent}>
        {audioOnlyCue && !showAnswer ? (
          <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.xl }]}>
            Listen, then say what you heard
          </Text>
        ) : (
          <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginBottom: Spacing.xl }]}>
            "{phrase.english}"
          </Text>
        )}
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg }]}>
          {audioOnlyCue && !showAnswer
            ? 'Audio-only cue — produce the phrase, then reveal to confirm'
            : 'Produce the Nepali phrase, then check yourself'}
        </Text>

        <SpeakCompare
          state={recording.state}
          onStartRecording={recording.startRecording}
          onStopRecording={recording.stopRecording}
          onPlayUser={recording.playUser}
          onPlayModel={() =>
            recording.playModel(() => speak(phrase.devanagari, { audioFile: phrase.audioFile }))
          }
          onRetake={recording.retake}
          onRevealFallback={onReveal}
        />

        {!showAnswer && recording.state !== 'permissionDenied' && (
          <Button
            title="Reveal answer"
            onPress={onReveal}
            variant="ghost"
            size="small"
            style={{ marginTop: Spacing.md }}
          />
        )}

        {showAnswer && (
          <Card variant="outlined" padding="medium" style={{ marginTop: Spacing.xl, width: '100%' }}>
            <Text style={[Typography.romanized, { color: colors.romanized, textAlign: 'center' }]}>
              {phrase.romanized}
            </Text>
            <Text style={[Typography.caption, { color: colors.textTertiary, textAlign: 'center', fontStyle: 'italic', marginTop: Spacing.xs }]}>
              {phrase.phonetic}
            </Text>
            <TouchableOpacity
              style={[styles.audioButton, { backgroundColor: colors.primary + '15', marginTop: Spacing.md }]}
              onPress={() => speak(phrase.devanagari, { audioFile: phrase.audioFile })}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 20 }}>🔊</Text>
              <Text style={[Typography.captionBold, { color: colors.primary, marginLeft: Spacing.sm }]}>
                Model audio
              </Text>
            </TouchableOpacity>
          </Card>
        )}
      </View>

      {showAnswer && (
        <View style={styles.bottomButton}>
          <View style={styles.selfGradeRow}>
            <Button title="Again" onPress={onAgain} variant="outline" size="large" style={{ flex: 1 }} />
            <Button title="Got it" onPress={onGotIt} size="large" style={{ flex: 1 }} />
          </View>
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
        <Text style={[Typography.h1, { color: colors.primary, textAlign: 'center' }]}>{pct}%</Text>
        <Text style={[Typography.body, { color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm }]}>
          {score} of {total} self-checked
        </Text>

        {missedCount > 0 && (
          <View
            style={[
              styles.noteBox,
              {
                backgroundColor: colors.warningLight,
                borderColor: colors.warning + '40',
                marginTop: Spacing.lg,
                alignSelf: 'stretch',
              },
            ]}
          >
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

function produceLabel(type: SpeakingExerciseType): string {
  if (type === 'microReview') return '⚡ QUICK REVIEW';
  if (type === 'listenProduce') return 'HEAR & PRODUCE';
  return 'SAY IT IN NEPALI';
}

/* ═══════════════════════ MAIN LESSON SCREEN ═══════════════════════ */

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { profile } = useUser();
  const { progress, completeSpeakingLesson, updateItemMastery, updateStreak } = useProgress();
  const recording = useRecording();

  const unit = speakingUnits.find((u) => u.id === id);
  const showScript = profile.path === 'speaking_script';
  const lessonProgress = unit ? progress.speakingLessons[unit.id] : undefined;
  const completedIds = lessonProgress?.completedItems || [];
  const sessionPhrasesRef = useRef<Phrase[]>([]);

  const initialExercises = useMemo(() => {
    if (!unit) return [] as SpeakingExercise[];
    const uncompletedPhrases = unit.phrases.filter((p) => !completedIds.includes(p.id));
    const sessionPhrases =
      uncompletedPhrases.length > 0
        ? uncompletedPhrases.slice(0, 3)
        : [...unit.phrases].sort(() => Math.random() - 0.5).slice(0, 3);
    sessionPhrasesRef.current = sessionPhrases;

    let exs = buildSpeakingExercises(sessionPhrases);

    const completedPhrasesData = unit.phrases.filter((p) => completedIds.includes(p.id));
    if (completedPhrasesData.length > 0 && uncompletedPhrases.length > 0) {
      const shuffled = [...completedPhrasesData].sort(() => Math.random() - 0.5).slice(0, 2);
      const prepends: SpeakingExercise[] = shuffled.map((phrase) => ({
        type: 'microReview' as const,
        phrase,
      }));
      exs = [...prepends, ...exs];
    }
    return exs;
  }, [unit?.id, completedIds.length]);

  const [exercises, setExercises] = useState<SpeakingExercise[]>(initialExercises);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const missedIds = useRef(new Set<string>());
  const [requeueInserted, setRequeueInserted] = useState(false);
  const [requeueCount, setRequeueCount] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const currentPhraseRef = useRef('');

  useEffect(() => {
    recording.reset();
    setHasRecorded(false);
    setAnswerRevealed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  useEffect(() => {
    if (
      recording.uri ||
      recording.state === 'recorded' ||
      recording.state === 'playingUser' ||
      recording.state === 'playingModel'
    ) {
      setHasRecorded(true);
    }
  }, [recording.uri, recording.state]);

  if (!unit) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <Text style={[Typography.h3, { color: colors.text, textAlign: 'center', marginTop: 100 }]}>
          Lesson not found
        </Text>
      </SafeAreaView>
    );
  }

  const progressPct = ((currentStep + 1) / Math.max(exercises.length, 1)) * 100;
  const current = exercises[currentStep];
  if (current) currentPhraseRef.current = current.phrase.id;

  const advanceAfterGrade = (gotIt: boolean) => {
    const phraseId = currentPhraseRef.current;
    setTotalAnswered((t) => t + 1);
    if (gotIt) {
      setScore((s) => s + 1);
      missedIds.current.delete(phraseId);
    } else {
      missedIds.current.add(phraseId);
    }
    updateItemMastery(phraseId, gotIt);
    handleNext();
  };

  const handleNext = () => {
    const next = currentStep + 1;
    if (next >= exercises.length) return;

    if (exercises[next].type === 'recap' && missedIds.current.size > 0 && !requeueInserted) {
      const missed = unit.phrases.filter((p) => missedIds.current.has(p.id));
      const requeueExs = buildRequeueExercises(missed);
      setExercises((prev) => [...prev.slice(0, next), ...requeueExs, prev[prev.length - 1]]);
      setRequeueInserted(true);
      setRequeueCount(missed.length);
    }

    setCurrentStep(next);
  };

  const handleFinish = async () => {
    const newlyCompletedIds = sessionPhrasesRef.current.map((p) => p.id);
    const isComplete = completedIds.length + sessionPhrasesRef.current.length >= unit.phrases.length;
    await completeSpeakingLesson(unit.id, newlyCompletedIds, isComplete);
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
          <ProgressBar progress={progressPct} height={6} />
        </View>
        <Text style={[Typography.caption, { color: colors.textSecondary }]}>
          {currentStep + 1}/{exercises.length}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {current?.type === 'intro' && (
          <IntroCard
            phrase={current.phrase}
            showScript={showScript}
            showRomanized={profile.showRomanized}
            onNext={handleNext}
          />
        )}
        {current?.type === 'listenRepeat' && (
          <ListenRepeatCard
            phrase={current.phrase}
            recording={recording}
            hasRecorded={hasRecorded}
            onRevealFallback={() => setHasRecorded(true)}
            onNext={handleNext}
          />
        )}
        {current && isProduceStyle(current.type) && (
          <ProduceCard
            phrase={current.phrase}
            label={produceLabel(current.type)}
            cueWithAudio={current.type === 'listenProduce'}
            recording={recording}
            revealed={answerRevealed}
            onReveal={() => setAnswerRevealed(true)}
            onGotIt={() => advanceAfterGrade(true)}
            onAgain={() => advanceAfterGrade(false)}
          />
        )}
        {current?.type === 'recap' && (
          <RecapCard
            phrases={sessionPhrasesRef.current}
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
  selfGradeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
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
