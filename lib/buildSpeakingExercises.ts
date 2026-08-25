import { Phrase } from '../data/speakingUnits';

export type SpeakingExerciseType =
  | 'intro'
  | 'listenRepeat'
  | 'produce'
  | 'listenProduce'
  | 'microReview'
  | 'recap';

/** Speak-first exercise — no multiple-choice fields. */
export interface SpeakingExercise {
  type: SpeakingExerciseType;
  phrase: Phrase;
}

const BATCH_SIZE = 2;

/**
 * Build a 4-stage speak-first session for the given phrases.
 * Stages: introduce → listen/repeat → produce → micro-review,
 * then a short produce challenge, then recap.
 * Output never includes options / 4-choice fields.
 */
export function buildSpeakingExercises(phrases: Phrase[]): SpeakingExercise[] {
  const exercises: SpeakingExercise[] = [];
  if (phrases.length === 0) {
    return exercises;
  }

  const batches: Phrase[][] = [];
  for (let i = 0; i < phrases.length; i += BATCH_SIZE) {
    batches.push(phrases.slice(i, i + BATCH_SIZE));
  }

  const introduced: Phrase[] = [];

  batches.forEach((batch, batchIdx) => {
    // STAGE 1: INTRODUCE
    batch.forEach((phrase) => {
      exercises.push({ type: 'intro', phrase });
    });

    // STAGE 2: LISTEN & REPEAT
    batch.forEach((phrase) => {
      exercises.push({ type: 'listenRepeat', phrase });
    });

    introduced.push(...batch);

    // STAGE 3: PRODUCE (from English)
    batch.forEach((phrase, idx) => {
      // Alternate produce / listenProduce for variety within the batch
      exercises.push({
        type: idx % 2 === 0 ? 'produce' : 'listenProduce',
        phrase,
      });
    });

    // STAGE 4: MICRO-REVIEW (prior phrases as produce)
    if (batchIdx > 0) {
      const previous = introduced.slice(0, -batch.length);
      const pick = previous[Math.floor(Math.random() * previous.length)];
      exercises.push({ type: 'microReview', phrase: pick });
    }
  });

  // CHALLENGE ROUND — produce-from-English only
  const challenge = [...phrases]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(6, phrases.length));
  challenge.forEach((phrase, idx) => {
    exercises.push({
      type: idx % 2 === 0 ? 'produce' : 'listenProduce',
      phrase,
    });
  });

  exercises.push({ type: 'recap', phrase: phrases[0] });
  return exercises;
}

/** Build produce requeue cards for missed phrases (inserted before recap). */
export function buildRequeueExercises(missed: Phrase[]): SpeakingExercise[] {
  return missed.map((phrase) => ({ type: 'produce' as const, phrase }));
}

/** True when the exercise should render the produce + self-grade card. */
export function isProduceStyle(type: SpeakingExerciseType): boolean {
  return type === 'produce' || type === 'listenProduce' || type === 'microReview';
}
