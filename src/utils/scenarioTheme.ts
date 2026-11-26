import { ScenarioVisualThemeId } from '../types/game';
import { hexToRgba } from './persian';

export type ThemePatternStyle =
  | 'velvet'
  | 'pinstripe'
  | 'celestial'
  | 'tactical-grid'
  | 'crimson-shards'
  | 'diamond-felt'
  | 'scanlines'
  | 'canyon-sun';

export interface ScenarioVisualThemeConfig {
  id: Exclude<ScenarioVisualThemeId, 'auto'>;
  label: string;
  subtitle: string;
  accentHex: string;
  lightAccentHex: string;
  secondaryHex: string;
  darkBgBase: string;
  darkCardBg: string;
  lightBgBase: string;
  lightCardBg: string;
  pattern: ThemePatternStyle;
}

export const SCENARIO_VISUAL_THEMES: Record<
  Exclude<ScenarioVisualThemeId, 'auto'>,
  ScenarioVisualThemeConfig
> = {
  godfather: {
    id: 'godfather',
    label: 'پدرخوانده اشرافی',
    subtitle: 'مخمل زرشکی و طلای کهربایی',
    accentHex: '#F59E0B',
    lightAccentHex: '#B45309',
    secondaryHex: '#DC2626',
    darkBgBase: '#120A08',
    darkCardBg: 'linear-gradient(155deg, #21120E 0%, #140B09 60%, #1C0D0C 100%)',
    lightBgBase: '#FBF5EA',
    lightCardBg: 'linear-gradient(155deg, #FFFDF8 0%, #F9EEDB 100%)',
    pattern: 'velvet',
  },
  'classic-noir': {
    id: 'classic-noir',
    label: 'نوآر کارآگاهی',
    subtitle: 'سایه آبی شب و نور مهتابی',
    accentHex: '#FBBF24',
    lightAccentHex: '#1E293B',
    secondaryHex: '#64748B',
    darkBgBase: '#090D16',
    darkCardBg: 'linear-gradient(155deg, #161F33 0%, #0D1322 58%, #141A29 100%)',
    lightBgBase: '#EEF2F7',
    lightCardBg: 'linear-gradient(155deg, #FFFFFF 0%, #E4EAF3 100%)',
    pattern: 'pinstripe',
  },
  zodiac: {
    id: 'zodiac',
    label: 'زودیاک کیهانی',
    subtitle: 'بنفش رمزآلود و هاله اخترشناسی',
    accentHex: '#C084FC',
    lightAccentHex: '#6D28D9',
    secondaryHex: '#22D3EE',
    darkBgBase: '#0C071B',
    darkCardBg: 'linear-gradient(155deg, #1D113B 0%, #110A26 55%, #121D36 100%)',
    lightBgBase: '#F4F0FF',
    lightCardBg: 'linear-gradient(155deg, #FFFFFF 0%, #ECE4FF 100%)',
    pattern: 'celestial',
  },
  nato: {
    id: 'nato',
    label: 'ناتو تاکتیکی',
    subtitle: 'آبی رادار و شبکه عملیاتی',
    accentHex: '#38BDF8',
    lightAccentHex: '#0369A1',
    secondaryHex: '#10B981',
    darkBgBase: '#061218',
    darkCardBg: 'linear-gradient(155deg, #0D2430 0%, #081720 60%, #0A2226 100%)',
    lightBgBase: '#ECF6FA',
    lightCardBg: 'linear-gradient(155deg, #FFFFFF 0%, #DEF0F8 100%)',
    pattern: 'tactical-grid',
  },
  crimson: {
    id: 'crimson',
    label: 'شب خونین',
    subtitle: 'زرشکی تند و سایه سایه‌روشن',
    accentHex: '#FB7185',
    lightAccentHex: '#BE123C',
    secondaryHex: '#EF4444',
    darkBgBase: '#16060A',
    darkCardBg: 'linear-gradient(155deg, #2D0C16 0%, #19070D 58%, #260B11 100%)',
    lightBgBase: '#FDF0F3',
    lightCardBg: 'linear-gradient(155deg, #FFFFFF 0%, #FCE0E7 100%)',
    pattern: 'crimson-shards',
  },
  'emerald-casino': {
    id: 'emerald-casino',
    label: 'کازینو و سندیکا',
    subtitle: 'سبز زمردی میز بازی و طلایی',
    accentHex: '#34D399',
    lightAccentHex: '#047857',
    secondaryHex: '#FBBF24',
    darkBgBase: '#06140E',
    darkCardBg: 'linear-gradient(155deg, #0E2B1F 0%, #081B13 60%, #142619 100%)',
    lightBgBase: '#EDFBF3',
    lightCardBg: 'linear-gradient(155deg, #FFFFFF 0%, #D9F5E5 100%)',
    pattern: 'diamond-felt',
  },
  'cyber-neon': {
    id: 'cyber-neon',
    label: 'نئون سایبری',
    subtitle: 'سرخابی و فیروزه‌ای درخشان',
    accentHex: '#F472B6',
    lightAccentHex: '#BE185D',
    secondaryHex: '#06B6D4',
    darkBgBase: '#0B0719',
    darkCardBg: 'linear-gradient(155deg, #25103A 0%, #100B26 55%, #0D2335 100%)',
    lightBgBase: '#F7F2FF',
    lightCardBg: 'linear-gradient(155deg, #FFFFFF 0%, #F6E6FA 100%)',
    pattern: 'scanlines',
  },
  'desert-western': {
    id: 'desert-western',
    label: 'تفتیش و غروب',
    subtitle: 'مسی گرم، کهربا و چوب تیره',
    accentHex: '#FB923C',
    lightAccentHex: '#C2410C',
    secondaryHex: '#FACC15',
    darkBgBase: '#150C06',
    darkCardBg: 'linear-gradient(155deg, #2B180B 0%, #190E07 60%, #271909 100%)',
    lightBgBase: '#FCF4EA',
    lightCardBg: 'linear-gradient(155deg, #FFFFFF 0%, #FBE7D0 100%)',
    pattern: 'canyon-sun',
  },
};

export const SCENARIO_THEME_OPTIONS: {
  id: ScenarioVisualThemeId;
  label: string;
  swatchHex: string;
  secondaryHex: string;
}[] = [
  { id: 'auto', label: 'خودکار', swatchHex: '#E5A93C', secondaryHex: '#64748B' },
  { id: 'godfather', label: 'پدرخوانده', swatchHex: '#F59E0B', secondaryHex: '#DC2626' },
  { id: 'classic-noir', label: 'نوآر', swatchHex: '#FBBF24', secondaryHex: '#334155' },
  { id: 'zodiac', label: 'زودیاک', swatchHex: '#C084FC', secondaryHex: '#22D3EE' },
  { id: 'nato', label: 'ناتو', swatchHex: '#38BDF8', secondaryHex: '#10B981' },
  { id: 'crimson', label: 'شب خونین', swatchHex: '#FB7185', secondaryHex: '#991B1B' },
  { id: 'emerald-casino', label: 'سندیکا', swatchHex: '#34D399', secondaryHex: '#FBBF24' },
  { id: 'cyber-neon', label: 'نئون', swatchHex: '#F472B6', secondaryHex: '#06B6D4' },
  { id: 'desert-western', label: 'وسترن', swatchHex: '#FB923C', secondaryHex: '#FACC15' },
];

export function inferScenarioVisualThemeId(
  scenarioNameOrId: string
): Exclude<ScenarioVisualThemeId, 'auto'> {
  const text = scenarioNameOrId.toLowerCase();
  if (text.includes('پدرخوانده') || text.includes('godfather') || text.includes('اشراف')) {
    return 'godfather';
  }
  if (
    text.includes('زودیاک') ||
    text.includes('zodiac') ||
    text.includes('گرگ') ||
    text.includes('نوستراداموس') ||
    text.includes('جک') ||
    text.includes('جادو')
  ) {
    return 'zodiac';
  }
  if (
    text.includes('ناتو') ||
    text.includes('nato') ||
    text.includes('تکاور') ||
    text.includes('تفنگدار')
  ) {
    return 'nato';
  }
  if (text.includes('سندیکا') || text.includes('کاپو') || text.includes('کازینو')) {
    return 'emerald-casino';
  }
  if (text.includes('بازپرس') || text.includes('تفتیش') || text.includes('محاکمه')) {
    return 'desert-western';
  }
  if (
    text.includes('خون') ||
    text.includes('ترور') ||
    text.includes('شب مافیا') ||
    text.includes('شکار')
  ) {
    return 'crimson';
  }
  return 'classic-noir';
}

export function resolveScenarioVisualTheme(
  themeId: ScenarioVisualThemeId | undefined,
  scenarioNameOrId: string
): ScenarioVisualThemeConfig {
  const resolvedId =
    !themeId || themeId === 'auto'
      ? inferScenarioVisualThemeId(scenarioNameOrId)
      : themeId;
  return SCENARIO_VISUAL_THEMES[resolvedId] ?? SCENARIO_VISUAL_THEMES['classic-noir'];
}

export function getScenarioStageBackground(
  theme: ScenarioVisualThemeConfig,
  isDark: boolean
): string {
  if (isDark) {
    return `radial-gradient(circle at 50% 14%, ${hexToRgba(theme.accentHex, 0.34)} 0%, transparent 52%), radial-gradient(circle at 15% 86%, ${hexToRgba(theme.secondaryHex, 0.28)} 0%, transparent 52%), radial-gradient(circle at 88% 72%, ${hexToRgba(theme.accentHex, 0.18)} 0%, transparent 46%), ${theme.darkBgBase}`;
  }
  return `radial-gradient(circle at 50% 14%, ${hexToRgba(theme.lightAccentHex, 0.2)} 0%, transparent 54%), radial-gradient(circle at 18% 85%, ${hexToRgba(theme.secondaryHex, 0.16)} 0%, transparent 52%), ${theme.lightBgBase}`;
}

export function getThemePatternBackground(
  theme: ScenarioVisualThemeConfig,
  isDark: boolean
): string {
  const lineAlpha = isDark ? 0.11 : 0.08;
  const accent = isDark ? theme.accentHex : theme.lightAccentHex;
  const secondary = theme.secondaryHex;

  switch (theme.pattern) {
    case 'tactical-grid':
      return `linear-gradient(${hexToRgba(accent, lineAlpha)} 1px, transparent 1px), linear-gradient(90deg, ${hexToRgba(accent, lineAlpha)} 1px, transparent 1px)`;
    case 'pinstripe':
      return `repeating-linear-gradient(135deg, ${hexToRgba(accent, lineAlpha * 0.8)} 0px, ${hexToRgba(accent, lineAlpha * 0.8)} 1px, transparent 1px, transparent 16px)`;
    case 'scanlines':
      return `repeating-linear-gradient(0deg, ${hexToRgba(secondary, lineAlpha * 0.9)} 0px, ${hexToRgba(secondary, lineAlpha * 0.9)} 1px, transparent 1px, transparent 7px)`;
    case 'diamond-felt':
      return `repeating-linear-gradient(45deg, ${hexToRgba(accent, lineAlpha * 0.75)} 0px, ${hexToRgba(accent, lineAlpha * 0.75)} 1px, transparent 1px, transparent 18px), repeating-linear-gradient(-45deg, ${hexToRgba(secondary, lineAlpha * 0.65)} 0px, ${hexToRgba(secondary, lineAlpha * 0.65)} 1px, transparent 1px, transparent 18px)`;
    case 'celestial':
      return `radial-gradient(circle at 22% 24%, ${hexToRgba(secondary, isDark ? 0.18 : 0.1)} 0%, transparent 32%), radial-gradient(circle at 78% 76%, ${hexToRgba(accent, isDark ? 0.22 : 0.12)} 0%, transparent 36%)`;
    case 'crimson-shards':
      return `linear-gradient(125deg, ${hexToRgba(accent, isDark ? 0.16 : 0.09)} 0%, transparent 42%), linear-gradient(305deg, ${hexToRgba(secondary, isDark ? 0.16 : 0.09)} 0%, transparent 44%)`;
    case 'canyon-sun':
      return `radial-gradient(circle at 50% 88%, ${hexToRgba(secondary, isDark ? 0.24 : 0.14)} 0%, transparent 52%), radial-gradient(circle at 50% 18%, ${hexToRgba(accent, isDark ? 0.18 : 0.1)} 0%, transparent 45%)`;
    case 'velvet':
    default:
      return `radial-gradient(ellipse at 50% 0%, ${hexToRgba(accent, isDark ? 0.2 : 0.1)} 0%, transparent 58%), radial-gradient(ellipse at 50% 100%, ${hexToRgba(secondary, isDark ? 0.18 : 0.08)} 0%, transparent 55%)`;
  }
}

export function getThemePatternSize(pattern: ThemePatternStyle): string | undefined {
  if (pattern === 'tactical-grid') return '24px 24px';
  return undefined;
}
