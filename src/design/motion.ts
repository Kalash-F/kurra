import { Easing } from 'react-native-reanimated';

/**
 * Motion Design Tokens
 *
 * Central motion language for the entire app.
 * All animations should reference these tokens instead of ad-hoc values.
 *
 * Feel: soft, fluid, responsive, reassuring, premium, non-aggressive.
 */

// ── Durations (ms) ──────────────────────────────────────────────
export const duration = {
  instant: 100,
  fast: 200,
  medium: 350,
  slow: 500,
  dramatic: 800,
} as const;

// ── Spring presets { damping, stiffness, mass? } ────────────────
export const spring = {
  /** Button press-in: snappy, immediate */
  press: { damping: 15, stiffness: 300 },
  /** Button release / bounce-back: slightly softer */
  release: { damping: 12, stiffness: 200 },
  /** Correct answer pop / reward scale */
  pop: { damping: 8, stiffness: 250 },
  /** Progress bar fill, page transitions */
  settle: { damping: 20, stiffness: 120 },
  /** Celebration elements, particles */
  bounce: { damping: 6, stiffness: 180 },
  /** Ambient / idle motion */
  gentle: { damping: 25, stiffness: 90 },
} as const;

// ── Easing curves ───────────────────────────────────────────────
export const curve = {
  /** Elements appearing */
  enter: Easing.out(Easing.cubic),
  /** Elements disappearing */
  exit: Easing.in(Easing.cubic),
  /** Repositioning */
  move: Easing.inOut(Easing.cubic),
  /** Slowing to rest */
  decel: Easing.out(Easing.quad),
  /** Overshoot (celebration, delight) */
  bounce: Easing.bezier(0.34, 1.56, 0.64, 1),
} as const;

// ── Entry/exit pattern configs ──────────────────────────────────
export const enter = {
  fadeUp: { fromOpacity: 0, toOpacity: 1, fromTranslateY: 12, toTranslateY: 0, duration: duration.medium },
  fadeIn: { fromOpacity: 0, toOpacity: 1, duration: duration.fast },
  scaleIn: { fromOpacity: 0, toOpacity: 1, fromScale: 0.85, toScale: 1, duration: duration.medium },
  slideRight: { fromOpacity: 0, toOpacity: 1, fromTranslateX: -20, toTranslateX: 0, duration: duration.medium },
} as const;

export const exit = {
  fadeDown: { fromOpacity: 1, toOpacity: 0, fromTranslateY: 0, toTranslateY: 8, duration: duration.fast },
  fadeOut: { fromOpacity: 1, toOpacity: 0, duration: duration.fast },
  scaleOut: { fromOpacity: 1, toOpacity: 0, fromScale: 1, toScale: 0.9, duration: duration.fast },
} as const;

// ── Interaction-specific values ─────────────────────────────────
export const interaction = {
  /** Button press scale */
  pressScale: 0.96,
  /** Card press scale */
  cardPressScale: 0.98,
  /** Correct answer pop scale */
  correctPopScale: 1.03,
  /** Incorrect shake distance (px) */
  shakeDistance: 6,
  /** Glow pulse max opacity */
  glowPulseOpacity: 0.6,
  /** Idle breathing scale range */
  breatheMin: 0.97,
  breatheMax: 1.03,
  /** Idle breathing cycle (ms) */
  breatheCycle: 2500,
} as const;
