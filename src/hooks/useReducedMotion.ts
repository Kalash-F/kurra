import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Reads the system "Reduce Motion" accessibility setting.
 *
 * When true, all animation hooks should degrade to instant
 * opacity changes with no scale, translate, or particle effects.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced
    );
    return () => subscription.remove();
  }, []);

  return reduced;
}
