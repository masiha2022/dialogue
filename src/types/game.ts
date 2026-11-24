export type RoleIconName =
  | 'crown'
  | 'skull'
  | 'search'
  | 'heart-pulse'
  | 'crosshair'
  | 'shield'
  | 'venetian-mask'
  | 'bomb'
  | 'user'
  | 'eye'
  | 'scale'
  | 'swords'
  | 'lock'
  | 'flame'
  | 'sparkles'
  | 'megaphone'
  | 'moon'
  | 'sun'
  | 'ghost'
  | 'zap'
  | 'key'
  | 'gavel'
  | 'feather'
  | 'link'
  | 'book-open'
  | 'gem'
  | 'compass'
  | 'target'
  | 'syringe'
  | 'radio'
  | 'footprints'
  | 'hourglass';

export type ScenarioTierKey = 'basic' | 'advanced' | 'expert';

export type RoleTeam = 'mafia' | 'citizen' | 'independent';

export type RevealMode = 'tap' | 'hold';

export type BuiltInNightTrackId =
  | 'rain-drone'
  | 'wind-night'
  | 'heartbeat'
  | 'techno-pulse'
  | 'cello-noir'
  | 'tick-clock'
  | 'crowd-murmur';

export type NightTrackId = BuiltInNightTrackId | 'custom' | `custom:${string}`;

export interface CustomNightTrack {
  id: string;
  name: string;
}

export type AlarmSoundId =
  | 'bell'
  | 'siren'
  | 'gong'
  | 'chime'
  | 'double-beep'
  | 'custom';

export type RevealSoundId = 'magic' | 'whoosh' | 'chime' | 'silent';

export type HomeBackdropId =
  | 'logo'
  | 'crimson-moon'
  | 'city-noir'
  | 'spotlight'
  | 'custom';

export interface AppPreferences {
  nightTrackId: NightTrackId;
  nightCustomTrackName: string;
  customNightTracks: CustomNightTrack[];
  nightVolume: number;
  alarmSoundId: AlarmSoundId;
  alarmCustomName: string;
  revealSoundId: RevealSoundId;
  themeMode: 'dark' | 'light';
  hapticFeedbackEnabled: boolean;
  vibrateOnTimerEnd: boolean;
  warningCountdownSeconds: 0 | 3 | 5 | 10;
  defaultSpeechSeconds: number;
  challengeSeconds: number;
  defenseSeconds: number;
  customTimerPresets: number[];
  revealMode: RevealMode;
  holdRevealMs: number;
  autoHideAfterSeconds: 0 | 5 | 8 | 12;
  showRoleTeamBadgeOnReveal: boolean;
  largeRevealFont: boolean;
  defenseVoteFormula: 'half' | 'half_plus_one';
  sniperPenaltyOnCitizen: boolean;
  homeBackdropId: HomeBackdropId;
  homeBackdropCustomDataUrl: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  count: number;
  description: string;
  color: string;
  icon: RoleIconName;
  team?: RoleTeam;
  inquiryOverride?: 'auto' | 'positive' | 'negative';
}

export interface ScenarioTier {
  key: ScenarioTierKey;
  label: string;
  recommendedPlayers: number;
  summaryNote: string;
  roles: RoleDefinition[];
}

export interface ScenarioRules {
  overview: string;
  winConditions: string[];
  nightOrder: string[];
  keyMechanics: string[];
  dayAndVoting: string[];
}

export interface Scenario {
  id: string;
  name: string;
  tagline: string;
  tiers: Record<ScenarioTierKey, ScenarioTier>;
  rules: ScenarioRules;
  isBuiltIn?: boolean;
  updatedAt: number;
}

export interface SavedRoster {
  id: string;
  name: string;
  players: string[];
  updatedAt: number;
}

export interface LastMoveCard {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  isBuiltIn?: boolean;
}

export interface GameLogEntry {
  id: string;
  round: number;
  phase: 'day' | 'night';
  text: string;
  timestamp: number;
}

export interface AssignedPlayerRole {
  playerNumber: number;
  playerName: string;
  role: RoleDefinition;
}

export type AppScreen =
  | 'home'
  | 'scenarios'
  | 'editor'
  | 'setup'
  | 'ready'
  | 'reveal'
  | 'complete'
  | 'tools';

export interface ActiveGameSession {
  id: string;
  scenarioId: string;
  scenarioName: string;
  tierKey: ScenarioTierKey;
  tierLabel: string;
  playerCount: number;
  playerNames: string[];
  revealMode: RevealMode;
  rolesUsed: RoleDefinition[];
  rules: ScenarioRules;
  deck: AssignedPlayerRole[];
  createdAt: number;
}

export interface PlayerTrackerState {
  playerNumber: number;
  playerName: string;
  isAlive: boolean;
  warnings: number;
  isSilenced: boolean;
  isShielded: boolean;
  votes: number;
}

export interface ModeratorMatchState {
  sessionId: string | null;
  phase: 'day' | 'night';
  roundNumber: number;
  players: PlayerTrackerState[];
  logs: GameLogEntry[];
  usedCardIds: string[];
  pickedStarter: number | null;
}
