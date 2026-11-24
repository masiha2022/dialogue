import { DEFAULT_SCENARIOS } from '../data/defaultScenarios';
import { DEFAULT_LAST_MOVE_CARDS, DEFAULT_ROSTERS } from '../data/lastMoveCards';
import {
  ActiveGameSession,
  AppPreferences,
  LastMoveCard,
  ModeratorMatchState,
  RevealMode,
  SavedRoster,
  Scenario,
} from '../types/game';

const STORAGE_KEY_V2 = 'ravi_naghsh_scenarios_v2';
const LEGACY_STORAGE_KEY_V1 = 'ravi_naghsh_scenarios_v1';
const ROSTERS_KEY = 'ravi_naghsh_rosters_v1';
const LAST_MOVE_KEY = 'ravi_naghsh_last_move_v1';
const REVEAL_MODE_KEY = 'ravi_naghsh_reveal_mode_v1';
const ACTIVE_SESSION_KEY = 'ravi_naghsh_active_session_v1';
const MOD_STATE_KEY = 'ravi_naghsh_mod_state_v1';
const PREFS_KEY = 'ravi_naghsh_prefs_v1';

export const DEFAULT_APP_PREFERENCES: AppPreferences = {
  nightTrackId: 'custom',
  nightCustomTrackName: '',
  customNightTracks: [],
  nightVolume: 0.65,
  alarmSoundId: 'bell',
  alarmCustomName: '',
  revealSoundId: 'silent',
  themeMode: 'dark',
  hapticFeedbackEnabled: false,
  vibrateOnTimerEnd: false,
  warningCountdownSeconds: 10,
  defaultSpeechSeconds: 30,
  challengeSeconds: 20,
  defenseSeconds: 60,
  customTimerPresets: [15, 30, 60],
  revealMode: 'tap',
  holdRevealMs: 650,
  autoHideAfterSeconds: 0,
  showRoleTeamBadgeOnReveal: false,
  largeRevealFont: false,
  defenseVoteFormula: 'half',
  sniperPenaltyOnCitizen: true,
  homeBackdropId: 'logo',
  homeBackdropCustomDataUrl: '',
};

const LEGACY_TIMER_PRESETS = [20, 30, 45, 60, 90];

export function loadAppPreferences(): AppPreferences {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_APP_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    const hasLegacyPresets =
      Array.isArray(parsed.customTimerPresets) &&
      parsed.customTimerPresets.length === LEGACY_TIMER_PRESETS.length &&
      parsed.customTimerPresets.every((v, i) => v === LEGACY_TIMER_PRESETS[i]);
    const customTracks = Array.isArray(parsed.customNightTracks) ? parsed.customNightTracks : [];
    const savedTrackId = parsed.nightTrackId;
    const isCustomTrackId =
      savedTrackId === 'custom' ||
      (typeof savedTrackId === 'string' && savedTrackId.startsWith('custom:'));
    const resolvedNightTrackId = isCustomTrackId
      ? savedTrackId
      : customTracks.length > 0
      ? (`custom:${customTracks[0].id}` as const)
      : 'custom';
    const resolvedAlarmSoundId =
      parsed.alarmSoundId === 'custom' ? 'custom' : 'bell';

    return {
      ...DEFAULT_APP_PREFERENCES,
      ...parsed,
      nightTrackId: resolvedNightTrackId,
      customNightTracks: customTracks,
      alarmSoundId: resolvedAlarmSoundId,
      revealSoundId: 'silent',
      hapticFeedbackEnabled: false,
      vibrateOnTimerEnd: false,
      defaultSpeechSeconds:
        hasLegacyPresets && parsed.defaultSpeechSeconds === 45
          ? DEFAULT_APP_PREFERENCES.defaultSpeechSeconds
          : parsed.defaultSpeechSeconds ?? DEFAULT_APP_PREFERENCES.defaultSpeechSeconds,
      customTimerPresets:
        Array.isArray(parsed.customTimerPresets) &&
        parsed.customTimerPresets.length > 0 &&
        !hasLegacyPresets
          ? parsed.customTimerPresets
          : DEFAULT_APP_PREFERENCES.customTimerPresets,
    };
  } catch {
    return DEFAULT_APP_PREFERENCES;
  }
}

export function saveAppPreferences(prefs: AppPreferences): void {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    window.localStorage.setItem(REVEAL_MODE_KEY, prefs.revealMode);
  } catch {
    // ignore
  }
}

/**
 * Loads saved scenarios from localStorage; seeds the full researched library on first launch.
 */
export function loadScenarios(): Scenario[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V2);
    if (!raw) {
      const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY_V1);
      if (legacyRaw) {
        window.localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
      }
      saveScenarios(DEFAULT_SCENARIOS);
      return DEFAULT_SCENARIOS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveScenarios(DEFAULT_SCENARIOS);
      return DEFAULT_SCENARIOS;
    }
    return parsed as Scenario[];
  } catch {
    return DEFAULT_SCENARIOS;
  }
}

export function saveScenarios(scenarios: Scenario[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(scenarios));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function mergeDefaultLibrary(current: Scenario[]): Scenario[] {
  const existingIds = new Set(current.map((s) => s.id));
  const missingBuiltIns = DEFAULT_SCENARIOS.filter((s) => !existingIds.has(s.id));
  if (missingBuiltIns.length === 0) {
    const customOnes = current.filter((s) => !s.isBuiltIn);
    return [...DEFAULT_SCENARIOS, ...customOnes];
  }
  return [...current, ...missingBuiltIns];
}

// --- Saved Player Rosters (اکیپ‌ها) ---

export function loadRosters(): SavedRoster[] {
  try {
    const raw = window.localStorage.getItem(ROSTERS_KEY);
    if (!raw) {
      saveRosters(DEFAULT_ROSTERS);
      return DEFAULT_ROSTERS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ROSTERS;
    return parsed as SavedRoster[];
  } catch {
    return DEFAULT_ROSTERS;
  }
}

export function saveRosters(rosters: SavedRoster[]): void {
  try {
    window.localStorage.setItem(ROSTERS_KEY, JSON.stringify(rosters));
  } catch {
    // ignore
  }
}

// --- Last Move Cards (کارت‌های حرکت آخر) ---

export function loadLastMoveCards(): LastMoveCard[] {
  try {
    const raw = window.localStorage.getItem(LAST_MOVE_KEY);
    if (!raw) {
      saveLastMoveCards(DEFAULT_LAST_MOVE_CARDS);
      return DEFAULT_LAST_MOVE_CARDS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LAST_MOVE_CARDS;
    return parsed as LastMoveCard[];
  } catch {
    return DEFAULT_LAST_MOVE_CARDS;
  }
}

export function saveLastMoveCards(cards: LastMoveCard[]): void {
  try {
    window.localStorage.setItem(LAST_MOVE_KEY, JSON.stringify(cards));
  } catch {
    // ignore
  }
}

// --- Reveal Security Mode Preference ---

export function loadRevealMode(): RevealMode {
  try {
    const raw = window.localStorage.getItem(REVEAL_MODE_KEY);
    return raw === 'hold' ? 'hold' : 'tap';
  } catch {
    return 'tap';
  }
}

export function saveRevealMode(mode: RevealMode): void {
  try {
    window.localStorage.setItem(REVEAL_MODE_KEY, mode);
  } catch {
    // ignore
  }
}

// --- Active Match Session & Moderator Board Persistence ---

export function loadActiveSession(): ActiveGameSession | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ActiveGameSession;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveGameSession | null): void {
  try {
    if (!session) {
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }
    window.localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export function loadModeratorMatchState(): ModeratorMatchState | null {
  try {
    const raw = window.localStorage.getItem(MOD_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ModeratorMatchState;
  } catch {
    return null;
  }
}

export function saveModeratorMatchState(state: ModeratorMatchState | null): void {
  try {
    if (!state) {
      window.localStorage.removeItem(MOD_STATE_KEY);
      return;
    }
    window.localStorage.setItem(MOD_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

const GUIDE_BANNER_DISMISSED_KEY = 'ravi_naghsh_guide_dismissed_v1';

export function loadGuideDismissed(): boolean {
  try {
    return window.localStorage.getItem(GUIDE_BANNER_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveGuideDismissed(dismissed: boolean): void {
  try {
    if (dismissed) {
      window.localStorage.setItem(GUIDE_BANNER_DISMISSED_KEY, '1');
    } else {
      window.localStorage.removeItem(GUIDE_BANNER_DISMISSED_KEY);
    }
  } catch {
    // ignore
  }
}
