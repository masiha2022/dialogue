import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Copy,
  FileText,
  Minus,
  Pencil,
  Plus,
  Save,
  Share2,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { ROLE_COLOR_PALETTE } from '../../data/defaultScenarios';
import { RoleDefinition, Scenario, ScenarioTier, ScenarioTierKey } from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import { generateLocalId, getReadableRoleColor, getTotalRoleCount, hexToRgba, toPersianDigits } from '../../utils/persian';
import {
  downloadScenarioPersianTextFile,
  parsePersianTextScenario,
  serializeScenarioToPersianText,
} from '../../utils/share';
import { RoleEditModal } from '../modals/RoleEditModal';
import { RoleIcon } from '../RoleIcon';

interface ScenarioEditorScreenProps {
  initialScenario: Scenario | null;
  hapticEnabled?: boolean;
  isDark?: boolean;
  onSave: (scenario: Scenario) => void;
  onCancel: () => void;
  onShareScenario: (scenario: Scenario) => void;
  onDuplicateScenario: (scenario: Scenario) => void;
  onDeleteScenario: (scenarioId: string) => void;
}

const TIER_KEYS: ScenarioTierKey[] = ['basic', 'advanced', 'expert'];

function createDefaultTiers(): Record<ScenarioTierKey, ScenarioTier> {
  return {
    basic: {
      key: 'basic',
      label: 'پایه',
      recommendedPlayers: 10,
      summaryNote: '۳ مافیا · ۷ شهروند',
      roles: [
        {
          id: generateLocalId('role'),
          name: 'رئیس مافیا',
          count: 1,
          description: 'رهبر تیم مافیا؛ استعلام کارآگاه رویش منفی است.',
          color: '#EF4444',
          icon: 'crown',
        },
        {
          id: generateLocalId('role'),
          name: 'مافیای ساده',
          count: 2,
          description: 'در شب با رئیس برای شلیک هماهنگ می‌شود.',
          color: '#F43F5E',
          icon: 'skull',
        },
        {
          id: generateLocalId('role'),
          name: 'کارآگاه',
          count: 1,
          description: 'هر شب هویت یک بازیکن را استعلام می‌گیرد.',
          color: '#3B82F6',
          icon: 'search',
        },
        {
          id: generateLocalId('role'),
          name: 'پزشک',
          count: 1,
          description: 'هر شب یک نفر را از شلیک نجات می‌دهد.',
          color: '#10B981',
          icon: 'heart-pulse',
        },
        {
          id: generateLocalId('role'),
          name: 'شهروند ساده',
          count: 5,
          description: 'با تحلیل و رأی‌گیری در روز مافیا را پیدا می‌کند.',
          color: '#94A3B8',
          icon: 'user',
        },
      ],
    },
    advanced: {
      key: 'advanced',
      label: 'پیشرفته',
      recommendedPlayers: 12,
      summaryNote: '۳ مافیا + ۱ دزد · ۸ شهروند',
      roles: [
        {
          id: generateLocalId('role'),
          name: 'رئیس مافیا',
          count: 1,
          description: 'رهبر تیم مافیا با استعلام منفی.',
          color: '#EF4444',
          icon: 'crown',
        },
        {
          id: generateLocalId('role'),
          name: 'مافیای ساده',
          count: 2,
          description: 'هم‌تیمی مافیا در فاز شب.',
          color: '#F43F5E',
          icon: 'skull',
        },
        {
          id: generateLocalId('role'),
          name: 'دزد',
          count: 1,
          description: 'مافیای خاموش؛ قابلیت نفر اول را دزدیده و روی نفر دوم اعمال می‌کند.',
          color: '#8B5CF6',
          icon: 'venetian-mask',
        },
        {
          id: generateLocalId('role'),
          name: 'کارآگاه',
          count: 1,
          description: 'استعلام‌گیر شبانه شهر.',
          color: '#3B82F6',
          icon: 'search',
        },
        {
          id: generateLocalId('role'),
          name: 'پزشک',
          count: 1,
          description: 'درمان یک نفر در شب.',
          color: '#10B981',
          icon: 'heart-pulse',
        },
        {
          id: generateLocalId('role'),
          name: 'حرفه‌ای',
          count: 1,
          description: 'تیرانداز شبانه شهر.',
          color: '#E5A93C',
          icon: 'crosshair',
        },
        {
          id: generateLocalId('role'),
          name: 'شهروند ساده',
          count: 5,
          description: 'تحلیل‌گر و رأی‌دهنده روز.',
          color: '#94A3B8',
          icon: 'user',
        },
      ],
    },
    expert: {
      key: 'expert',
      label: 'فوق پیشرفته',
      recommendedPlayers: 15,
      summaryNote: '۴ مافیا + ۱ دزد · ۱۰ شهروند',
      roles: [
        {
          id: generateLocalId('role'),
          name: 'رئیس مافیا',
          count: 1,
          description: 'فرمانده مافیا با استعلام منفی.',
          color: '#EF4444',
          icon: 'crown',
        },
        {
          id: generateLocalId('role'),
          name: 'دکتر لکتر',
          count: 1,
          description: 'نجات‌دهنده اعضای مافیا در شب.',
          color: '#F97316',
          icon: 'heart-pulse',
        },
        {
          id: generateLocalId('role'),
          name: 'مافیای ساده',
          count: 2,
          description: 'اعضای تیم مافیا.',
          color: '#F43F5E',
          icon: 'skull',
        },
        {
          id: generateLocalId('role'),
          name: 'دزد',
          count: 1,
          description: 'مافیای پنهان با قابلیت سرقت اکت شبانه.',
          color: '#8B5CF6',
          icon: 'venetian-mask',
        },
        {
          id: generateLocalId('role'),
          name: 'کارآگاه',
          count: 1,
          description: 'استعلام وضعیت بازیکنان.',
          color: '#3B82F6',
          icon: 'search',
        },
        {
          id: generateLocalId('role'),
          name: 'پزشک شهر',
          count: 1,
          description: 'درمانگر شهروندان در شب.',
          color: '#10B981',
          icon: 'heart-pulse',
        },
        {
          id: generateLocalId('role'),
          name: 'حرفه‌ای',
          count: 1,
          description: 'شلیک دقیق شبانه به مافیا.',
          color: '#E5A93C',
          icon: 'crosshair',
        },
        {
          id: generateLocalId('role'),
          name: 'زره‌پوش',
          count: 1,
          description: 'مقاوم در برابر اولین شلیک.',
          color: '#06B6D4',
          icon: 'shield',
        },
        {
          id: generateLocalId('role'),
          name: 'شهروند ساده',
          count: 6,
          description: 'شهروندان ساده و تحلیل‌گر.',
          color: '#94A3B8',
          icon: 'user',
        },
      ],
    },
  };
}

export const ScenarioEditorScreen: React.FC<ScenarioEditorScreenProps> = ({
  initialScenario,
  hapticEnabled = true,
  isDark = true,
  onSave,
  onCancel,
  onShareScenario,
  onDuplicateScenario,
  onDeleteScenario,
}) => {
  const isEditing = Boolean(initialScenario);

  const [scenarioName, setScenarioName] = useState(initialScenario?.name ?? '');
  const [tagline, setTagline] = useState(initialScenario?.tagline ?? '');
  const [activeTierKey, setActiveTierKey] = useState<ScenarioTierKey>('basic');

  const [tiers, setTiers] = useState<Record<ScenarioTierKey, ScenarioTier>>(() => {
    if (!initialScenario) return createDefaultTiers();
    return {
      basic: {
        ...initialScenario.tiers.basic,
        roles: initialScenario.tiers.basic.roles.map((r) => ({ ...r })),
      },
      advanced: {
        ...initialScenario.tiers.advanced,
        roles: initialScenario.tiers.advanced.roles.map((r) => ({ ...r })),
      },
      expert: {
        ...initialScenario.tiers.expert,
        roles: initialScenario.tiers.expert.roles.map((r) => ({ ...r })),
      },
    };
  });

  // Rules fields
  const [overview, setOverview] = useState(initialScenario?.rules.overview ?? '');
  const [winConditionsText, setWinConditionsText] = useState(
    initialScenario?.rules.winConditions.join('\n') ??
      'پیروزی شهروندان: تمام اعضای مافیا از بازی خارج شوند.\nپیروزی مافیا: تعداد مافیا و شهروندان برابر شود.'
  );
  const [nightOrderText, setNightOrderText] = useState(
    initialScenario?.rules.nightOrder.join('\n') ??
      '۱. شب معارفه: تیم مافیا بیدار می‌شوند.\n۲. کارآگاه، پزشک و نقش‌های ویژه به ترتیب بیدار می‌شوند.'
  );
  const [keyMechanicsText, setKeyMechanicsText] = useState(
    initialScenario?.rules.keyMechanics.join('\n') ?? ''
  );
  const [dayVotingText, setDayVotingText] = useState(
    initialScenario?.rules.dayAndVoting.join('\n') ?? ''
  );

  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [isNewRole, setIsNewRole] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Full Persian Text Editor Modal
  const [showTextEditorModal, setShowTextEditorModal] = useState(false);
  const [persianSourceText, setPersianSourceText] = useState('');
  const [textEditorError, setTextEditorError] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  const currentTier = tiers[activeTierKey];
  const currentTotalRoles = getTotalRoleCount(currentTier.roles);
  const tierDiff = currentTier.recommendedPlayers - currentTotalRoles;

  const updateCurrentTier = (updater: (tier: ScenarioTier) => ScenarioTier) => {
    setTiers((prev) => ({
      ...prev,
      [activeTierKey]: updater(prev[activeTierKey]),
    }));
  };

  const handleTierPlayerCountChange = (nextCount: number) => {
    triggerHaptic('tap', hapticEnabled);
    const clamped = Math.max(2, Math.min(40, nextCount));
    updateCurrentTier((tier) => ({
      ...tier,
      recommendedPlayers: clamped,
    }));
  };

  const handleAutoBalanceTier = () => {
    if (currentTier.roles.length === 0 || tierDiff === 0) return;
    triggerHaptic('confirm', hapticEnabled);
    const baseRoleIndex = currentTier.roles.findIndex(
      (r) => r.name.includes('شهروند') || r.name.includes('روستایی')
    );
    const targetIdx = baseRoleIndex >= 0 ? baseRoleIndex : currentTier.roles.length - 1;

    updateCurrentTier((tier) => ({
      ...tier,
      roles: tier.roles.map((role, idx) => {
        if (idx !== targetIdx) return role;
        return { ...role, count: Math.max(0, role.count + tierDiff) };
      }),
    }));
  };

  const handleInlineRoleDescriptionChange = (roleId: string, newDescription: string) => {
    updateCurrentTier((tier) => ({
      ...tier,
      roles: tier.roles.map((r) =>
        r.id === roleId ? { ...r, description: newDescription } : r
      ),
    }));
  };

  const openAddRoleModal = () => {
    setIsNewRole(true);
    setEditingRole({
      id: generateLocalId('role'),
      name: '',
      count: 1,
      description: '',
      color: ROLE_COLOR_PALETTE[currentTier.roles.length % ROLE_COLOR_PALETTE.length].hex,
      icon: 'user',
    });
  };

  const openEditRoleModal = (role: RoleDefinition) => {
    setIsNewRole(false);
    setEditingRole({ ...role });
  };

  const handleSaveRoleModal = (cleanedRole: RoleDefinition) => {
    triggerHaptic('confirm', hapticEnabled);
    const finalRole: RoleDefinition = {
      ...cleanedRole,
      count: Math.max(1, cleanedRole.count),
    };
    updateCurrentTier((tier) => {
      const nextRoles = isNewRole
        ? [...tier.roles, finalRole]
        : tier.roles.map((r) => (r.id === finalRole.id ? finalRole : r));
      return {
        ...tier,
        roles: nextRoles,
      };
    });
    setEditingRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
    triggerHaptic('warning', hapticEnabled);
    updateCurrentTier((tier) => ({
      ...tier,
      roles: tier.roles.filter((r) => r.id !== roleId),
    }));
  };

  const handleCopyFromPreviousTier = () => {
    const sourceKey: ScenarioTierKey = activeTierKey === 'expert' ? 'advanced' : 'basic';
    const copiedRoles = tiers[sourceKey].roles.map((r) => ({
      ...r,
      id: generateLocalId('role'),
    }));
    updateCurrentTier((tier) => ({
      ...tier,
      roles: copiedRoles,
    }));
  };

  const splitLines = (text: string) =>
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

  const buildDraftScenario = (): Scenario => ({
    id: initialScenario?.id ?? generateLocalId('scenario'),
    name: scenarioName.trim() || 'سناریوی بدون نام',
    tagline: tagline.trim() || 'سناریوی اختصاصی در سه سطح پایه، پیشرفته و فوق پیشرفته',
    tiers,
    rules: {
      overview: overview.trim(),
      winConditions: splitLines(winConditionsText),
      nightOrder: splitLines(nightOrderText),
      keyMechanics: splitLines(keyMechanicsText),
      dayAndVoting: splitLines(dayVotingText),
    },
    isBuiltIn: initialScenario?.isBuiltIn ?? false,
    updatedAt: Date.now(),
  });

  const handleOpenTextEditor = () => {
    const draft = buildDraftScenario();
    setPersianSourceText(serializeScenarioToPersianText(draft));
    setTextEditorError(null);
    setShowTextEditorModal(true);
  };

  const handleApplyPersianText = () => {
    try {
      const parsed = parsePersianTextScenario(persianSourceText);
      setScenarioName(parsed.name);
      setTagline(parsed.tagline);
      setTiers(parsed.tiers);
      setOverview(parsed.rules.overview);
      setWinConditionsText(parsed.rules.winConditions.join('\n'));
      setNightOrderText(parsed.rules.nightOrder.join('\n'));
      setKeyMechanicsText(parsed.rules.keyMechanics.join('\n'));
      setDayVotingText(parsed.rules.dayAndVoting.join('\n'));
      setShowTextEditorModal(false);
      setFormError(null);
    } catch (err) {
      setTextEditorError(err instanceof Error ? err.message : 'خطا در تحلیل متن فارسی');
    }
  };

  const handleSaveScenario = () => {
    const trimmed = scenarioName.trim();
    if (!trimmed) {
      triggerHaptic('warning', hapticEnabled);
      setFormError('لطفاً نام سناریو را وارد کنید.');
      return;
    }

    for (const key of TIER_KEYS) {
      const total = getTotalRoleCount(tiers[key].roles);
      if (tiers[key].roles.length === 0 || total < 2) {
        triggerHaptic('warning', hapticEnabled);
        setActiveTierKey(key);
        setFormError(`سطح «${tiers[key].label}» باید حداقل دارای ۲ نقش باشد.`);
        return;
      }
    }

    triggerHaptic('confirm', hapticEnabled);
    onSave(buildDraftScenario());
  };

  return (
    <div className="relative z-10 min-h-dvh flex flex-col bg-transparent pb-28 sm:pb-12 transition-colors">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-30 h-14 bg-white/85 dark:bg-[#090B10]/85 backdrop-blur-md border-b border-slate-200 dark:border-white/8 px-4 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            aria-label="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
            {isEditing ? 'ویرایش سناریو' : 'ساخت سناریو جدید'}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenTextEditor}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#121620] hover:bg-slate-200 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm px-3 py-2 min-h-[44px] transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">ویرایش متنی فارسی</span>
            <span className="sm:hidden">متن فارسی</span>
          </button>

          <button
            type="button"
            onClick={handleSaveScenario}
            className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm px-4 py-2 min-h-[44px] transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره سناریو</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6 flex-1">
        {isEditing && initialScenario && (
          <section className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#121620] p-3.5 sm:p-4 space-y-3 shadow-xs dark:shadow-none">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', hapticEnabled);
                  onShareScenario(buildDraftScenario());
                }}
                className="min-h-[48px] px-3 py-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/14 bg-slate-100 dark:bg-[#171D2B] text-slate-800 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-200 dark:hover:bg-white/10 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                aria-label={`اشتراک‌گذاری سناریو ${initialScenario.name}`}
              >
                <Share2 className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>اشتراک</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('confirm', hapticEnabled);
                  const draft = buildDraftScenario();
                  onDuplicateScenario(draft);
                  const msg = `یک نسخه کپی از «${draft.name}» ساخته شد.`;
                  setDuplicateNotice(msg);
                  window.setTimeout(() => {
                    setDuplicateNotice((prev) => (prev === msg ? null : prev));
                  }, 3000);
                }}
                className="min-h-[48px] px-3 py-2 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/14 bg-slate-100 dark:bg-[#171D2B] text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-200 dark:hover:bg-white/10 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                aria-label={`ساخت کپی از سناریو ${initialScenario.name}`}
              >
                <Copy className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>کپی</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', hapticEnabled);
                  setConfirmDeleteOpen(true);
                }}
                className="min-h-[48px] px-3 py-2 flex items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 hover:bg-red-500/18 text-red-700 dark:text-red-300 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                aria-label={`حذف سناریو ${initialScenario.name}`}
              >
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>حذف</span>
              </button>
            </div>

            {duplicateNotice && (
              <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200">
                {duplicateNotice}
              </div>
            )}
          </section>
        )}

        {formError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200"
          >
            {formError}
          </div>
        )}

        {/* Basic Info */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-xs dark:shadow-none">
          <div>
            <label htmlFor="scenario-name-input" className="block text-sm font-semibold text-slate-900 dark:text-slate-200 mb-2">
              نام سناریو
            </label>
            <input
              id="scenario-name-input"
              type="text"
              value={scenarioName}
              onChange={(e) => {
                setScenarioName(e.target.value);
                if (formError) setFormError(null);
              }}
              placeholder="مثلاً: مافیای دزد و تکاور"
              className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] px-4 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label htmlFor="scenario-tagline-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              معرفی کوتاه سناریو
            </label>
            <input
              id="scenario-tagline-input"
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="توضیح یک‌خطی درباره سبک و جذابیت سناریو..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] px-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </section>

        {/* Three Tiers Roles & Player Count Editor */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#121620] p-5 space-y-5 shadow-xs dark:shadow-none">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              تنظیمات سطوح سه‌گانه و تعداد بازیکنان
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              برای هر سطح تعداد بازیکنان، ترکیب نقش‌ها، آیکون و توضیح کوتاه را ویرایش کنید
            </p>
          </div>

          {/* 3-Tier Tab Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#090B10] border border-slate-200 dark:border-white/8">
            {TIER_KEYS.map((key) => {
              const t = tiers[key];
              const isActive = activeTierKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTierKey(key)}
                  className={`min-h-[48px] rounded-lg px-2 py-1.5 flex flex-col items-center justify-center transition-all cursor-pointer tabular-nums ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/5 font-semibold'
                  }`}
                >
                  <span className="text-xs sm:text-sm">{t.label}</span>
                  <span className={`text-[11px] ${isActive ? 'text-slate-900' : 'text-slate-500 dark:text-slate-400'}`}>
                    {toPersianDigits(t.recommendedPlayers)} بازیکن
                  </span>
                </button>
              );
            })}
          </div>

          {/* Editable Player Count for Selected Tier */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0C0F17] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  تعداد بازیکنان سطح «{currentTier.label}»
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 tabular-nums mt-0.5">
                  مجموع نقش‌های فعلی این سطح: {toPersianDigits(currentTotalRoles)} نفر
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 bg-white dark:bg-[#090B10] rounded-xl p-1.5 border border-slate-200 dark:border-white/8">
              <button
                type="button"
                onClick={() => handleTierPlayerCountChange(currentTier.recommendedPlayers - 1)}
                disabled={currentTier.recommendedPlayers <= 2}
                className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-[#1E2536] disabled:opacity-40 flex items-center justify-center text-slate-900 dark:text-slate-100 cursor-pointer"
                aria-label="کاهش تعداد بازیکنان سطح"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={2}
                max={40}
                value={currentTier.recommendedPlayers}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val)) handleTierPlayerCountChange(val);
                }}
                aria-label="تعداد بازیکنان این سطح"
                className="w-16 text-center bg-transparent text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleTierPlayerCountChange(currentTier.recommendedPlayers + 1)}
                disabled={currentTier.recommendedPlayers >= 40}
                className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-[#1E2536] disabled:opacity-40 flex items-center justify-center text-slate-900 dark:text-slate-100 cursor-pointer"
                aria-label="افزایش تعداد بازیکنان سطح"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {tierDiff !== 0 && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/12 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 tabular-nums font-medium">
                {tierDiff > 0
                  ? `${toPersianDigits(tierDiff)} جای خالی برای رسیدن به ${toPersianDigits(currentTier.recommendedPlayers)} بازیکن باقی مانده است.`
                  : `مجموع نقش‌ها ${toPersianDigits(Math.abs(tierDiff))} نفر بیشتر از تعداد بازیکنان این سطح است.`}
              </p>
              <button
                type="button"
                onClick={handleAutoBalanceTier}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>هماهنگ‌سازی خودکار</span>
              </button>
            </div>
          )}

          {/* Tier Summary Note & Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <input
              type="text"
              value={currentTier.summaryNote}
              onChange={(e) =>
                updateCurrentTier((t) => ({ ...t, summaryNote: e.target.value }))
              }
              placeholder="یادداشت خلاصه این سطح (مثلاً: ۳ مافیا + ۱ دزد)"
              className="flex-1 min-h-[44px] rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] px-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />

            <div className="flex items-center gap-2 shrink-0">
              {activeTierKey !== 'basic' && (
                <button
                  type="button"
                  onClick={handleCopyFromPreviousTier}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-2 min-h-[44px] text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>کپی از سطح قبلی</span>
                </button>
              )}
              <button
                type="button"
                onClick={openAddRoleModal}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/12 hover:bg-amber-500/20 px-4 py-2 min-h-[44px] text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن نقش</span>
              </button>
            </div>
          </div>

          {/* Roles List with Direct Inline Description Editing */}
          <div className="space-y-3">
            {currentTier.roles.map((role) => {
              const readableColor = getReadableRoleColor(role.color, isDark);
              return (
                <div
                  key={role.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0C0F17] p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => openEditRoleModal(role)}
                        className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: hexToRgba(role.color, isDark ? 0.16 : 0.18),
                          border: `1px solid ${hexToRgba(readableColor, 0.35)}`,
                        }}
                        title="تغییر آیکون و رنگ نقش"
                      >
                        <RoleIcon name={role.icon} className="w-5 h-5" style={{ color: readableColor }} />
                      </button>
                      <div className="min-w-0 flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                          {role.name}
                        </h3>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 tabular-nums shrink-0">
                          × {toPersianDigits(role.count)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditRoleModal(role)}
                        className="min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-slate-200 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        aria-label={`ویرایش کامل ${role.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>ویرایش</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role.id)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        aria-label={`حذف ${role.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline editable short description */}
                  <div>
                    <input
                      type="text"
                      value={role.description}
                      onChange={(e) => handleInlineRoleDescriptionChange(role.id, e.target.value)}
                      placeholder="توضیح کوتاه نقش (هنگام افشای نقش به بازیکن نمایش داده می‌شود)..."
                      aria-label={`توضیح کوتاه نقش ${role.name}`}
                      className="w-full min-h-[40px] rounded-xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#090B10] px-3 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Rules & Guide Editor */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-xs dark:shadow-none">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">قوانین و راهنمای سناریو</h2>
          </div>

          <div>
            <label htmlFor="rules-overview" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              توضیح کلی سناریو
            </label>
            <textarea
              id="rules-overview"
              rows={2}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              placeholder="معرفی کلی سناریو و فضای بازی..."
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rules-win" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                شرایط پیروزی (هر شرط در یک خط)
              </label>
              <textarea
                id="rules-win"
                rows={4}
                value={winConditionsText}
                onChange={(e) => setWinConditionsText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] p-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="rules-night" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ترتیب بیداری شب (هر مرحله در یک خط)
              </label>
              <textarea
                id="rules-night"
                rows={4}
                value={nightOrderText}
                onChange={(e) => setNightOrderText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] p-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="rules-mech" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                قوانین کلیدی نقش‌ها (هر نکته در یک خط)
              </label>
              <textarea
                id="rules-mech"
                rows={3}
                value={keyMechanicsText}
                onChange={(e) => setKeyMechanicsText(e.target.value)}
                placeholder="مثلاً: دزد در شب اول کارآگاه را انتخاب کند حذف می‌شود..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] p-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>

            <div>
              <label htmlFor="rules-day" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                فاز روز و رأی‌گیری (هر بند در یک خط)
              </label>
              <textarea
                id="rules-day"
                rows={3}
                value={dayVotingText}
                onChange={(e) => setDayVotingText(e.target.value)}
                placeholder="زمان صحبت، دفاعیه و حدنصاب رأی..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] p-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Sticky Save CTA */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pt-4 pb-safe bg-gradient-to-t from-[#F4F5F7] via-[#F4F5F7]/95 dark:from-[#090B10] dark:via-[#090B10]/95 to-transparent">
        <button
          type="button"
          onClick={handleSaveScenario}
          className="w-full min-h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
        >
          <Save className="w-5 h-5" />
          <span>ذخیره سناریو</span>
        </button>
      </div>

      {editingRole && (
        <RoleEditModal
          role={editingRole}
          isNew={isNewRole}
          allowCountEdit
          onSave={handleSaveRoleModal}
          onClose={() => setEditingRole(null)}
        />
      )}

      {/* Full Persian Text Editor Modal */}
      {showTextEditorModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:p-4">
          <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-5 sm:p-6 shadow-2xl max-h-[92dvh] flex flex-col">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  ویرایش یکجای سناریو به زبان فارسی
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTextEditorModal(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3 shrink-0">
              تمام اطلاعات سناریو، تعداد بازیکنان هر سطح، نقش‌ها، توضیحات و قوانین را می‌توانید مستقیم در متن زیر ویرایش یا به‌صورت فایل `.txt` ذخیره کنید.
            </p>

            {textEditorError && (
              <div className="mb-3 rounded-xl border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-200 shrink-0">
                {textEditorError}
              </div>
            )}

            <textarea
              rows={12}
              value={persianSourceText}
              onChange={(e) => {
                setPersianSourceText(e.target.value);
                if (textEditorError) setTextEditorError(null);
              }}
              dir="rtl"
              className="w-full rounded-2xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] p-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:border-amber-500 resize-y flex-1 min-h-[220px]"
            />

            <div className="mt-4 flex flex-col sm:flex-row gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleApplyPersianText}
                className="flex-1 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm cursor-pointer"
              >
                اعمال تغییرات متنی روی سناریو
              </button>
              <button
                type="button"
                onClick={() => downloadScenarioPersianTextFile(buildDraftScenario())}
                className="min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer"
              >
                دانلود فایل .txt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteOpen && initialScenario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">حذف سناریو</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              آیا از حذف سناریو «{initialScenario.name}» مطمئن هستید؟ این کار قابل بازگشت نیست.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('warning', hapticEnabled);
                  setConfirmDeleteOpen(false);
                  onDeleteScenario(initialScenario.id);
                }}
                className="flex-1 min-h-[48px] rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm cursor-pointer"
              >
                بله، حذف شود
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="flex-1 min-h-[48px] rounded-xl border border-slate-300 dark:border-white/12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold text-sm cursor-pointer"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
