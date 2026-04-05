/**
 * Spaced Repetition Module
 *
 * Selects items for review sessions based on due dates,
 * mastery status, and confidence decay.
 */

import { MasteryItem, MasteryStatus, decayConfidence } from './masteryEngine';

/**
 * Get all items that are due for review (nextReviewDate ≤ today).
 * Sorted: fragile items first, then by lowest decayed confidence.
 */
export function getItemsDueForReview(
  items: Record<string, MasteryItem>,
  today: string = new Date().toISOString().split('T')[0]
): MasteryItem[] {
  return Object.values(items)
    .filter(item => item.nextReviewDate <= today && item.status !== 'new')
    .sort((a, b) => {
      // Fragile items always come first
      if (a.status === 'fragile' && b.status !== 'fragile') return -1;
      if (b.status === 'fragile' && a.status !== 'fragile') return 1;
      // Then sort by decayed confidence (lowest = most forgotten)
      return decayConfidence(a) - decayConfidence(b);
    });
}

/**
 * Get items that are "weak" — fragile status or low confidence.
 */
export function getWeakItems(
  items: Record<string, MasteryItem>
): MasteryItem[] {
  return Object.values(items).filter(
    item => item.status === 'fragile' || decayConfidence(item) < 0.3
  );
}

/**
 * Select a balanced set of items for a review session.
 *
 * Composition:
 *  - 40% fragile items (highest priority)
 *  - 30% learning items
 *  - 30% strong items (maintenance)
 *
 * Capped at maxItems (default 20).
 */
export function selectSessionItems(
  due: MasteryItem[],
  maxItems: number = 20
): MasteryItem[] {
  const fragile = due.filter(i => i.status === 'fragile');
  const learning = due.filter(i => i.status === 'learning');
  const strong = due.filter(i => i.status === 'strong' || i.status === 'mastered');

  const fragileSlots = Math.ceil(maxItems * 0.4);
  const learningSlots = Math.ceil(maxItems * 0.3);
  const strongSlots = maxItems - fragileSlots - learningSlots;

  const selected = [
    ...fragile.slice(0, fragileSlots),
    ...learning.slice(0, learningSlots),
    ...strong.slice(0, strongSlots),
  ];

  // Shuffle so the session doesn't feel predictable
  return selected.sort(() => Math.random() - 0.5).slice(0, maxItems);
}

/**
 * Get items for micro-review within lessons.
 * Picks a few fragile/learning items from previously completed items.
 */
export function getMicroReviewItems(
  items: Record<string, MasteryItem>,
  excludeIds: string[],
  count: number = 2
): MasteryItem[] {
  const candidates = Object.values(items)
    .filter(item =>
      !excludeIds.includes(item.itemId) &&
      item.status !== 'new' &&
      (item.status === 'fragile' || item.status === 'learning')
    )
    .sort((a, b) => decayConfidence(a) - decayConfidence(b));

  return candidates.slice(0, count);
}
