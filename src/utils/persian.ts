import { AssignedPlayerRole, RoleDefinition, RoleTeam } from '../types/game';

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Converts Latin digits in a string or number to Persian digits for native RTL display.
 */
export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

/**
 * Generates a unique ID offline without external packages.
 */
export function generateLocalId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Unbiased Fisher-Yates shuffle using crypto.getRandomValues when available.
 */
export function fairShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    let j: number;
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const randomBuffer = new Uint32Array(1);
      crypto.getRandomValues(randomBuffer);
      j = randomBuffer[0] % (i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Expands role counts into an array of individual roles, shuffles fairly, and assigns player numbers + names.
 */
export function buildShuffledDeck(
  roles: RoleDefinition[],
  playerNames?: string[]
): AssignedPlayerRole[] {
  const expanded: RoleDefinition[] = [];
  for (const role of roles) {
    for (let i = 0; i < role.count; i++) {
      expanded.push(role);
    }
  }
  const shuffled = fairShuffle(expanded);
  return shuffled.map((role, index) => {
    const customName = playerNames?.[index]?.trim();
    return {
      playerNumber: index + 1,
      playerName: customName || `بازیکن ${toPersianDigits(index + 1)}`,
      role,
    };
  });
}

/**
 * Computes total number of players defined by a list of roles.
 */
export function getTotalRoleCount(roles: RoleDefinition[]): number {
  return roles.reduce((sum, role) => sum + Math.max(0, role.count), 0);
}

/**
 * Infers team alignment from explicit customization or Persian/English role name & color.
 */
export function inferRoleTeam(role: RoleDefinition): RoleTeam {
  if (role.team) {
    return role.team;
  }

  const name = role.name.trim();
  const independentKeywords = [
    'زودیاک',
    'قاتل زنجیره‌ای',
    'نوستراداموس',
    'گرگینه',
    'سندیکا',
    'جک',
    'جوکر',
    'مستقل',
    'گرگ تنها',
  ];
  if (independentKeywords.some((k) => name.includes(k))) {
    return 'independent';
  }

  const mafiaKeywords = [
    'مافیا',
    'پدرخوانده',
    'رئیس',
    'لکتر',
    'ناتو',
    'ماتادور',
    'سائول',
    'ساول',
    'گروگان',
    'تروریست',
    'بمب‌گذار',
    'جاسوس',
    'جادوگر',
    'مذاکره‌کننده',
    'دزد',
    'شب‌خسب',
    'سرباز مافیا',
    'شعبده‌باز',
    'یاکوزا',
    'بازپرس تاریک',
  ];
  if (mafiaKeywords.some((k) => name.includes(k))) {
    return 'mafia';
  }

  const colorUpper = role.color.toUpperCase();
  if (colorUpper === '#F43F5E' || colorUpper === '#EF4444' || colorUpper === '#DC2626') {
    return 'mafia';
  }

  return 'citizen';
}

export function getRoleTeamLabel(team: RoleTeam): string {
  if (team === 'mafia') return 'مافیا';
  if (team === 'independent') return 'مستقل';
  return 'شهروند';
}

/**
 * Computes Detective Inquiry result (استعلام کارآگاه), honoring custom per-role overrides first.
 */
export function computeDetectiveInquiry(role: RoleDefinition): {
  isPositive: boolean;
  label: string;
  note: string;
} {
  if (role.inquiryOverride === 'positive') {
    return {
      isPositive: true,
      label: 'استعلام مثبت (👍)',
      note: `طبق تنظیم سفارشی نقش «${role.name}»، استعلام کارآگاه مثبت است.`,
    };
  }
  if (role.inquiryOverride === 'negative') {
    return {
      isPositive: false,
      label: 'استعلام منفی (👎)',
      note: `طبق تنظیم سفارشی نقش «${role.name}»، استعلام کارآگاه منفی است.`,
    };
  }

  const name = role.name.trim();
  const team = inferRoleTeam(role);

  const alwaysNegativeMafia = ['پدرخوانده', 'رئیس مافیا', 'ساول', 'سائول', 'رییس'];
  if (alwaysNegativeMafia.some((k) => name.includes(k))) {
    return {
      isPositive: false,
      label: 'استعلام منفی (👎)',
      note: `${role.name} معمولاً استعلام منفی دارد (مگر در قوانین خاص میز بدون جلیقه).`,
    };
  }

  if (team === 'mafia') {
    return {
      isPositive: true,
      label: 'استعلام مثبت (👍)',
      note: `${role.name} عضو تیم مافیاست و استعلام کارآگاه برای او مثبت است.`,
    };
  }

  if (team === 'independent') {
    return {
      isPositive: false,
      label: 'استعلام منفی (👎)',
      note: `${role.name} نقش مستقل است و در اغلب سناریوها استعلام منفی می‌گیرد.`,
    };
  }

  return {
    isPositive: false,
    label: 'استعلام منفی (👎)',
    note: `${role.name} عضو جبهه شهروند است.`,
  };
}

/**
 * Converts a 6-digit hex color to an rgba() CSS string for glows and soft surfaces.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) {
    return `rgba(229, 169, 60, ${alpha})`;
  }
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(229, 169, 60, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Adjusts light/pastel hex colors in Day (light) mode so role titles remain high-contrast on light surfaces.
 */
export function getReadableRoleColor(hex: string, isDark: boolean): string {
  if (isDark) return hex;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex;
  // Relative luminance check; darken bright tones for light background contrast
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance <= 0.46) return hex;
  const factor = 0.58;
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}
