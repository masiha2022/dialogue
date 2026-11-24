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
  return false;
}

/**
 * Tactile vibration is globally disabled across the application.
 */
export function triggerHaptic(_pattern: HapticPatternName, _enabled = false): boolean {
  return false;
}
