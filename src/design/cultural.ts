/**
 * Cultural Design Tokens
 *
 * Microcopy pools, level titles (mountain metaphors),
 * streak messages, and completion messages.
 *
 * Tone: short, warm, human, respectful. Never cheesy, never childish.
 */

// ── Correct answer microcopy ────────────────────────────────────
export const CORRECT_MESSAGES = [
  'Nice!',
  'That's it.',
  'Exactly right.',
  'You've got this.',
  'Well remembered.',
  'Spot on.',
  'Great recall.',
  'Nailed it.',
] as const;

// ── Incorrect answer microcopy ──────────────────────────────────
export const INCORRECT_MESSAGES = [
  'Not quite — here's the answer.',
  'Close! This one will come back.',
  'That's a tricky one. You'll get it.',
  'No worries — this one takes practice.',
  'Almost. Let it sink in.',
] as const;

// ── Streak messages (by day count) ──────────────────────────────
export const STREAK_MESSAGES: Record<number, string> = {
  1: 'A good start.',
  2: 'Two days — keep it going.',
  3: 'Three days in a row. You're building something.',
  5: 'Five days strong. Real momentum.',
  7: 'A full week. That's real commitment.',
  10: 'Ten days. Impressive discipline.',
  14: 'Two weeks strong. Your Nepali is growing.',
  21: 'Three weeks. This is becoming a habit.',
  30: 'One month. You should be proud of this.',
  60: 'Two months. Truly dedicated.',
  90: 'Three months. Remarkable.',
  100: 'A hundred days. Extraordinary.',
};

export function getStreakMessage(days: number): string {
  // Find the highest threshold that's ≤ current streak
  const thresholds = Object.keys(STREAK_MESSAGES)
    .map(Number)
    .sort((a, b) => b - a);
  const match = thresholds.find((t) => days >= t);
  return match ? STREAK_MESSAGES[match] : '';
}

// ── Streak recovery (after missing a day) ───────────────────────
export const STREAK_RECOVERY_MESSAGES = [
  'Welcome back. Let's pick up where you left off.',
  'No pressure — every return is a good one.',
  'You're here. That's what matters.',
] as const;

// ── Lesson completion messages ──────────────────────────────────
export function getCompletionMessage(scorePercent: number): string {
  if (scorePercent >= 95) return 'Flawless. You really know this.';
  if (scorePercent >= 80) return 'Excellent work. Solid recall.';
  if (scorePercent >= 65) return 'Good effort. A few to revisit — they'll come back.';
  return 'Keep at it. These phrases will come up again to help you practice.';
}

// ── Level titles (mountain journey metaphors) ───────────────────
export const LEVEL_TITLES: Record<number, string> = {
  1: 'First Steps',
  2: 'Explorer',
  3: 'Pathfinder',
  4: 'Steady Climber',
  5: 'Mountain Walker',
  6: 'Ridge Runner',
  7: 'Summit Seeker',
  8: 'Cloud Crosser',
  9: 'Peak Master',
  10: 'Himalayan Voice',
};

export const LEVEL_XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

export function getLevelForXP(xp: number): { level: number; title: string; xpInLevel: number; xpForLevel: number } {
  let level = 1;
  for (let i = LEVEL_XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  const currentThreshold = LEVEL_XP_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_XP_THRESHOLDS[level] || currentThreshold + 1000;
  return {
    level,
    title: LEVEL_TITLES[level] || `Level ${level}`,
    xpInLevel: xp - currentThreshold,
    xpForLevel: nextThreshold - currentThreshold,
  };
}

// ── XP awards ───────────────────────────────────────────────────
export const XP_AWARDS = {
  lessonComplete: 25,
  perfectLesson: 40,
  reviewSessionComplete: 15,
  streakDay: 10,
  fragileItemRecovered: 5,
  firstCorrect: 2,
} as const;

// ── Session momentum messages ───────────────────────────────────
export const MOMENTUM_MESSAGES: Record<number, string> = {
  3: 'On a roll!',
  5: 'Unstoppable!',
  8: 'Perfect streak!',
  10: 'Incredible focus!',
};

// ── Welcome-back greeting ───────────────────────────────────────
export function getWelcomeGreeting(streakDays: number, isNewDay: boolean): string {
  if (!isNewDay) return 'Welcome back';
  if (streakDays === 0) return 'Ready to start?';
  if (streakDays === 1) return 'Great to see you again';
  return `${streakDays}-day streak — keep it going`;
}

// ── Helper: pick random from array ──────────────────────────────
export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
