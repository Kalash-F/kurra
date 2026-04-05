/**
 * Mastery Engine
 *
 * Lightweight item-level mastery tracking with confidence decay
 * and spaced repetition scheduling.
 *
 * Each item (phrase, letter, word) has a MasteryItem record.
 * Status flows: new → fragile ↔ learning → strong → mastered
 */

export type MasteryStatus = 'new' | 'fragile' | 'learning' | 'strong' | 'mastered';

export interface MasteryItem {
  itemId: string;
  status: MasteryStatus;
  correctStreak: number;       // consecutive correct answers
  totalCorrect: number;
  totalIncorrect: number;
  lastSeen: string;            // ISO date string
  interval: number;            // days until next review
  easeFactor: number;          // SM-2 style, starts at 2.5
  nextReviewDate: string;      // YYYY-MM-DD
  firstSeen: string;           // ISO date string
  confidence: number;          // 0..1, decays over time
}

/** Create a fresh mastery item when an item is first encountered */
export function createMasteryItem(itemId: string): MasteryItem {
  const now = new Date().toISOString();
  const today = now.split('T')[0];
  return {
    itemId,
    status: 'new',
    correctStreak: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    lastSeen: now,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: today,
    firstSeen: now,
    confidence: 0,
  };
}

/** Compute status from current mastery data */
export function computeStatus(item: MasteryItem): MasteryStatus {
  const total = item.totalCorrect + item.totalIncorrect;
  if (total === 0) return 'new';

  const ratio = item.totalCorrect / total;

  if (item.correctStreak >= 5 && ratio >= 0.9 && item.interval >= 14) return 'mastered';
  if (item.correctStreak >= 3 && ratio >= 0.75) return 'strong';
  if (ratio < 0.5 || item.correctStreak === 0) return 'fragile';
  return 'learning';
}

/** Update mastery after an answer */
export function updateMastery(item: MasteryItem, correct: boolean): MasteryItem {
  const updated: MasteryItem = {
    ...item,
    lastSeen: new Date().toISOString(),
  };

  if (correct) {
    updated.totalCorrect++;
    updated.correctStreak++;
    updated.easeFactor = Math.min(3.0, updated.easeFactor + 0.1);
    updated.interval = Math.round(updated.interval * updated.easeFactor);
    updated.confidence = Math.min(1, updated.confidence + 0.15);
  } else {
    updated.totalIncorrect++;
    updated.correctStreak = 0;
    updated.easeFactor = Math.max(1.3, updated.easeFactor - 0.2);
    updated.interval = 1;
    updated.confidence = Math.max(0, updated.confidence - 0.3);
  }

  // Schedule next review
  const next = new Date();
  next.setDate(next.getDate() + updated.interval);
  updated.nextReviewDate = next.toISOString().split('T')[0];

  // Recompute status
  updated.status = computeStatus(updated);

  return updated;
}

/** Calculate confidence with time decay */
export function decayConfidence(item: MasteryItem): number {
  const daysSince = Math.floor(
    (Date.now() - new Date(item.lastSeen).getTime()) / 86400000
  );
  return Math.max(0, item.confidence - daysSince * 0.02);
}

/**
 * Migrate existing ItemMastery data from the old format
 * (ProgressContext) to the new MasteryItem format.
 */
export function migrateOldMastery(old: {
  correctCount: number;
  incorrectCount: number;
  lastReviewed?: string;
  interval: number;
  easeFactor: number;
  nextReview?: string;
}, itemId: string): MasteryItem {
  const now = new Date().toISOString();
  const item: MasteryItem = {
    itemId,
    status: 'new',
    correctStreak: 0, // can't reconstruct from old data
    totalCorrect: old.correctCount,
    totalIncorrect: old.incorrectCount,
    lastSeen: old.lastReviewed || now,
    interval: old.interval,
    easeFactor: old.easeFactor,
    nextReviewDate: old.nextReview || now.split('T')[0],
    firstSeen: old.lastReviewed || now,
    confidence: 0.5, // default for migrated items
  };
  item.status = computeStatus(item);
  return item;
}
