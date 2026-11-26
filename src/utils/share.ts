import { ROLE_COLOR_PALETTE } from '../data/defaultScenarios';
import { ROLE_ICON_OPTIONS } from '../components/RoleIcon';
import { RoleDefinition, RoleIconName, Scenario, ScenarioTier, ScenarioTierKey } from '../types/game';
import { generateLocalId, getTotalRoleCount, toPersianDigits } from './persian';

const SHARE_PREFIX = 'RN2:';

const PERSIAN_TO_LATIN_DIGITS: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

function toLatinDigits(str: string): string {
  return str.replace(/[۰-۹٠-٩]/g, (ch) => PERSIAN_TO_LATIN_DIGITS[ch] ?? ch);
}

function parseInteger(str: string, fallback: number): number {
  const num = parseInt(toLatinDigits(str).replace(/[^\d-]/g, ''), 10);
  return Number.isNaN(num) ? fallback : num;
}

function colorHexToPersianLabel(hex: string): string {
  const found = ROLE_COLOR_PALETTE.find(
    (c) => c.hex.toLowerCase() === hex.trim().toLowerCase()
  );
  return found ? found.label : hex;
}

function resolveColorInput(raw: string): string {
  const cleaned = raw.trim();
  if (!cleaned) return '#94A3B8';
  if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned;
  const byLabel = ROLE_COLOR_PALETTE.find((c) => c.label === cleaned);
  if (byLabel) return byLabel.hex;
  return '#94A3B8';
}

function iconNameToPersianLabel(icon: RoleIconName): string {
  if (icon.startsWith('emoji:') || icon.startsWith('img:')) return icon;
  const found = ROLE_ICON_OPTIONS.find((opt) => opt.name === icon);
  return found ? found.label : icon;
}

function resolveIconInput(raw: string): RoleIconName {
  const cleaned = raw.trim();
  if (!cleaned) return 'user';
  if (cleaned.startsWith('emoji:')) return cleaned as RoleIconName;
  if (cleaned.startsWith('img:')) return cleaned as RoleIconName;
  const byName = ROLE_ICON_OPTIONS.find((opt) => opt.name === cleaned);
  if (byName) return byName.name;
  const byLabel = ROLE_ICON_OPTIONS.find((opt) => opt.label === cleaned);
  if (byLabel) return byLabel.name;
  return 'user';
}

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToUtf8(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Serializes EVERY setting, tier, role (name, count, color, icon, description),
 * and full rules of a scenario into a clean, human-editable Persian text format.
 */
export function serializeScenarioToPersianText(scenario: Scenario): string {
  const lines: string[] = [
    '=== سناریو دیالوگ ===',
    `نام سناریو: ${scenario.name}`,
    `معرفی کوتاه: ${scenario.tagline}`,
    '',
  ];

  const tierOrder: ScenarioTierKey[] = ['basic', 'advanced', 'expert'];
  for (const key of tierOrder) {
    const tier = scenario.tiers[key];
    lines.push(`--- سطح: ${tier.label} ---`);
    lines.push(`تعداد بازیکنان: ${toPersianDigits(tier.recommendedPlayers)}`);
    if (tier.summaryNote.trim()) {
      lines.push(`یادداشت سطح: ${tier.summaryNote.trim()}`);
    }
    for (const role of tier.roles) {
      const colorLabel = colorHexToPersianLabel(role.color);
      const iconLabel = iconNameToPersianLabel(role.icon);
      const cleanDesc = role.description.replace(/\s*\n\s*/g, ' ').trim();
      lines.push(
        `نقش: ${role.name} | تعداد: ${toPersianDigits(role.count)} | رنگ: ${colorLabel} | آیکون: ${iconLabel} | توضیح: ${cleanDesc}`
      );
    }
    lines.push('');
  }

  lines.push('--- قوانین و راهنما ---');
  if (scenario.rules.overview.trim()) {
    lines.push(`معرفی کلی: ${scenario.rules.overview.replace(/\s*\n\s*/g, ' ').trim()}`);
  }

  const writeListSection = (title: string, items: string[]) => {
    if (items.length === 0) return;
    lines.push(`${title}:`);
    for (const item of items) {
      lines.push(`- ${item.trim()}`);
    }
  };

  writeListSection('شرایط پیروزی', scenario.rules.winConditions);
  writeListSection('ترتیب بیداری شب', scenario.rules.nightOrder);
  writeListSection('قوانین کلیدی', scenario.rules.keyMechanics);
  writeListSection('فاز روز و رأی‌گیری', scenario.rules.dayAndVoting);

  return lines.join('\n').trim();
}

/**
 * Parses an editable Persian scenario text back into a complete Scenario object.
 */
export function parsePersianTextScenario(text: string): Scenario {
  const lines = text.split(/\r?\n/);

  let name = '';
  let tagline = '';
  let currentSection: 'header' | ScenarioTierKey | 'rules' = 'header';
  let currentRuleList: 'winConditions' | 'nightOrder' | 'keyMechanics' | 'dayAndVoting' | null = null;

  const emptyTier = (key: ScenarioTierKey, label: string, recommendedPlayers: number): ScenarioTier => ({
    key,
    label,
    recommendedPlayers,
    summaryNote: '',
    roles: [],
  });

  const tiers: Record<ScenarioTierKey, ScenarioTier> = {
    basic: emptyTier('basic', 'پایه', 10),
    advanced: emptyTier('advanced', 'پیشرفته', 12),
    expert: emptyTier('expert', 'فوق پیشرفته', 15),
  };

  const tierExplicitPlayers: Partial<Record<ScenarioTierKey, number>> = {};

  const rules: Scenario['rules'] = {
    overview: '',
    winConditions: [],
    nightOrder: [],
    keyMechanics: [],
    dayAndVoting: [],
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('===')) continue;

    // Detect section headers
    if (line.startsWith('---') && line.endsWith('---')) {
      const inner = line.replace(/^-+|-+$/g, '').trim();
      currentRuleList = null;
      if (inner.includes('فوق پیشرفته')) {
        currentSection = 'expert';
      } else if (inner.includes('پیشرفته')) {
        currentSection = 'advanced';
      } else if (inner.includes('پایه')) {
        currentSection = 'basic';
      } else if (inner.includes('قوانین')) {
        currentSection = 'rules';
      }
      continue;
    }

    if (line.startsWith('نام سناریو:')) {
      name = line.slice('نام سناریو:'.length).trim();
      continue;
    }
    if (line.startsWith('معرفی کوتاه:')) {
      tagline = line.slice('معرفی کوتاه:'.length).trim();
      continue;
    }

    if (currentSection === 'basic' || currentSection === 'advanced' || currentSection === 'expert') {
      const tier = tiers[currentSection];

      if (line.startsWith('تعداد بازیکنان:')) {
        const val = Math.max(2, parseInteger(line.slice('تعداد بازیکنان:'.length), tier.recommendedPlayers));
        tier.recommendedPlayers = val;
        tierExplicitPlayers[currentSection] = val;
        continue;
      }

      if (line.startsWith('یادداشت سطح:')) {
        tier.summaryNote = line.slice('یادداشت سطح:'.length).trim();
        continue;
      }

      if (line.startsWith('نقش:')) {
        const parts = line.split('|').map((p) => p.trim());
        let roleName = '';
        let count = 1;
        let color = '#94A3B8';
        let icon: RoleIconName = 'user';
        let description = '';

        for (const part of parts) {
          if (part.startsWith('نقش:')) {
            roleName = part.slice('نقش:'.length).trim();
          } else if (part.startsWith('تعداد:')) {
            count = Math.max(0, parseInteger(part.slice('تعداد:'.length), 1));
          } else if (part.startsWith('رنگ:')) {
            color = resolveColorInput(part.slice('رنگ:'.length));
          } else if (part.startsWith('آیکون:')) {
            icon = resolveIconInput(part.slice('آیکون:'.length));
          } else if (part.startsWith('توضیح:')) {
            description = part.slice('توضیح:'.length).trim();
          }
        }

        if (roleName) {
          tier.roles.push({
            id: generateLocalId('role'),
            name: roleName,
            count,
            color,
            icon,
            description,
          });
        }
        continue;
      }
    }

    if (currentSection === 'rules') {
      if (line.startsWith('معرفی کلی:')) {
        rules.overview = line.slice('معرفی کلی:'.length).trim();
        currentRuleList = null;
        continue;
      }
      if (line.startsWith('شرایط پیروزی:')) {
        currentRuleList = 'winConditions';
        const rest = line.slice('شرایط پیروزی:'.length).trim();
        if (rest) rules.winConditions.push(rest);
        continue;
      }
      if (line.startsWith('ترتیب بیداری شب:')) {
        currentRuleList = 'nightOrder';
        const rest = line.slice('ترتیب بیداری شب:'.length).trim();
        if (rest) rules.nightOrder.push(rest);
        continue;
      }
      if (line.startsWith('قوانین کلیدی:')) {
        currentRuleList = 'keyMechanics';
        const rest = line.slice('قوانین کلیدی:'.length).trim();
        if (rest) rules.keyMechanics.push(rest);
        continue;
      }
      if (line.startsWith('فاز روز و رأی‌گیری:') || line.startsWith('فاز روز و رای‌گیری:')) {
        currentRuleList = 'dayAndVoting';
        const rest = line.replace(/^فاز روز و ر[اآ]ی‌گیری:/, '').trim();
        if (rest) rules.dayAndVoting.push(rest);
        continue;
      }

      if (currentRuleList) {
        const cleanedItem = line.replace(/^[-•*]\s*/, '').trim();
        if (cleanedItem) {
          rules[currentRuleList].push(cleanedItem);
        }
      }
    }
  }

  if (!name) {
    throw new Error('نام سناریو در متن فارسی پیدا نشد. خط «نام سناریو: ...» را بررسی کنید.');
  }

  // Ensure every tier has valid player counts and fallback roles if one tier was omitted
  const hasAnyRoles =
    tiers.basic.roles.length > 0 || tiers.advanced.roles.length > 0 || tiers.expert.roles.length > 0;
  if (!hasAnyRoles) {
    throw new Error('هیچ نقشی در متن سناریو تعریف نشده است.');
  }

  const fallbackRoles =
    tiers.basic.roles.length > 0
      ? tiers.basic.roles
      : tiers.advanced.roles.length > 0
      ? tiers.advanced.roles
      : tiers.expert.roles;

  (['basic', 'advanced', 'expert'] as ScenarioTierKey[]).forEach((key) => {
    if (tiers[key].roles.length === 0) {
      tiers[key].roles = fallbackRoles.map((r) => ({ ...r, id: generateLocalId('role') }));
    }
    if (tierExplicitPlayers[key] === undefined) {
      tiers[key].recommendedPlayers = Math.max(2, getTotalRoleCount(tiers[key].roles));
    }
  });

  return {
    id: generateLocalId('text'),
    name,
    tagline: tagline || 'سناریوی متنی قابل ویرایش',
    tiers,
    rules,
    isBuiltIn: false,
    updatedAt: Date.now(),
  };
}

/**
 * Encodes a scenario into a compact offline-shareable code (RN2:...).
 */
export function encodeScenarioShareCode(scenario: Scenario): string {
  const payload = {
    v: 2,
    name: scenario.name,
    tagline: scenario.tagline,
    tiers: scenario.tiers,
    rules: scenario.rules,
  };
  return `${SHARE_PREFIX}${utf8ToBase64(JSON.stringify(payload))}`;
}

function sanitizeRole(raw: Partial<RoleDefinition>): RoleDefinition {
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : generateLocalId('role'),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'نقش بدون نام',
    count: typeof raw.count === 'number' && raw.count >= 0 ? Math.floor(raw.count) : 1,
    description: typeof raw.description === 'string' ? raw.description : '',
    color: typeof raw.color === 'string' && raw.color.startsWith('#') ? raw.color : '#94A3B8',
    icon: raw.icon ?? 'user',
  };
}

/**
 * Parses editable Persian text, RN2: share code, or JSON string into a valid Scenario object.
 */
export function decodeScenarioInput(input: string): Scenario {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('متن یا فایل سناریو خالی است.');
  }

  // 1. Check editable Persian text format first (support both Dialogue & legacy header)
  if (
    trimmed.includes('نام سناریو:') ||
    trimmed.includes('=== سناریو دیالوگ ===') ||
    trimmed.includes('=== سناریو راوی نقش ===')
  ) {
    return parsePersianTextScenario(trimmed);
  }

  // 2. Check RN2 compact code or JSON
  let jsonText = trimmed;
  if (trimmed.startsWith(SHARE_PREFIX)) {
    try {
      jsonText = base64ToUtf8(trimmed.slice(SHARE_PREFIX.length).trim());
    } catch {
      throw new Error('کد اشتراک‌گذاری معتبر نیست یا ناقص کپی شده است.');
    }
  } else {
    const codeLine = trimmed
      .split(/\s+/)
      .find((token) => token.startsWith(SHARE_PREFIX));
    if (codeLine) {
      try {
        jsonText = base64ToUtf8(codeLine.slice(SHARE_PREFIX.length).trim());
      } catch {
        throw new Error('کد اشتراک‌گذاری داخل متن معتبر نیست.');
      }
    }
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('فرمت فایل یا متن سناریو قابل خواندن نیست. از فایل متنی فارسی یا کد RN2 استفاده کنید.');
  }

  if (!parsed || typeof parsed !== 'object' || typeof parsed.name !== 'string' || !parsed.tiers) {
    throw new Error('ساختار سناریو ناقص است.');
  }

  const rawTiers = parsed.tiers as Record<string, any>;
  const tierKeys: ScenarioTierKey[] = ['basic', 'advanced', 'expert'];
  const tierDefaults: Record<ScenarioTierKey, string> = {
    basic: 'پایه',
    advanced: 'پیشرفته',
    expert: 'فوق پیشرفته',
  };

  const tiers = {} as Scenario['tiers'];
  for (const key of tierKeys) {
    const t = rawTiers[key] ?? rawTiers.basic ?? {};
    const roles: RoleDefinition[] = Array.isArray(t.roles)
      ? t.roles.map((r: Partial<RoleDefinition>) => sanitizeRole(r))
      : [];
    const total = getTotalRoleCount(roles);
    tiers[key] = {
      key,
      label: typeof t.label === 'string' && t.label ? t.label : tierDefaults[key],
      recommendedPlayers:
        typeof t.recommendedPlayers === 'number' && t.recommendedPlayers >= 2
          ? t.recommendedPlayers
          : Math.max(4, total),
      summaryNote: typeof t.summaryNote === 'string' ? t.summaryNote : '',
      roles,
    };
  }

  const rawRules = (parsed.rules ?? {}) as Record<string, unknown>;
  const asStringArray = (val: unknown): string[] =>
    Array.isArray(val) ? val.filter((x): x is string => typeof x === 'string' && x.trim().length > 0) : [];

  return {
    id: generateLocalId('imported'),
    name: `${parsed.name.trim()}`,
    tagline: typeof parsed.tagline === 'string' ? parsed.tagline : 'سناریوی واردشده',
    tiers,
    rules: {
      overview: typeof rawRules.overview === 'string' ? rawRules.overview : '',
      winConditions: asStringArray(rawRules.winConditions),
      nightOrder: asStringArray(rawRules.nightOrder),
      keyMechanics: asStringArray(rawRules.keyMechanics),
      dayAndVoting: asStringArray(rawRules.dayAndVoting),
    },
    isBuiltIn: false,
    updatedAt: Date.now(),
  };
}

/**
 * Triggers a client-side editable Persian .txt download for offline sharing & editing.
 */
export function downloadScenarioPersianTextFile(scenario: Scenario): void {
  const textContent = serializeScenarioToPersianText(scenario);
  const blob = new Blob(['\uFEFF' + textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scenario.name.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a client-side .json download as secondary backup.
 */
export function downloadScenarioJsonFile(scenario: Scenario): void {
  const payload = {
    v: 2,
    name: scenario.name,
    tagline: scenario.tagline,
    tiers: scenario.tiers,
    rules: scenario.rules,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${scenario.name.replace(/\s+/g, '_')}.ravi.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
