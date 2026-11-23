export type HapticPatternName =
  | 'tap'
  | 'confirm'
  | 'timerStart'
  | 'timerPause'
  | 'countdownTick'
  | 'timerEnd'
  | 'roleReveal'
  | 'warning';

const HAPTIC_PATTERNS: Record<HapticPatternName, number | number[]> = {
  tap: 10,
  confirm: 20,
  timerStart: [18, 28, 18],
  timerPause: 12,
  countdownTick: 32,
  timerEnd: [200, 90, 240],
  roleReveal: [14, 24, 28],
  warning: [36, 36, 56],
};

export function isHapticsSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  );
}

/**
 * Triggers tactile vibration via the Web Vibration API.
 * Gracefully no-ops on desktop or browsers without vibration support (e.g., iOS Safari).
 */
export function triggerHaptic(pattern: HapticPatternName, enabled = true): boolean {
  if (!enabled || !isHapticsSupported()) return false;
  try {
    return navigator.vibrate(HAPTIC_PATTERNS[pattern]);
  } catch {
    return false;
  }
}
