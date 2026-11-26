import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  FolderPlus,
  Lightbulb,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  RoleBankItem,
  RoleDefinition,
  RoleTeam,
  Scenario,
  ScenarioTierKey,
} from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import {
  generateLocalId,
  getReadableRoleColor,
  getRoleTeamLabel,
  hexToRgba,
  inferRoleTeam,
  toPersianDigits,
} from '../../utils/persian';
import { RoleEditModal } from '../modals/RoleEditModal';
import { RoleIcon } from '../RoleIcon';

interface RoleUsageEntry {
  scenarioId: string;
  scenarioName: string;
  tierLabels: string[];
  updatedAt: number;
}

interface AggregatedRoleEntry {
  key: string;
  role: RoleDefinition;
  team: RoleTeam;
  bankItemId?: string;
  usages: RoleUsageEntry[];
  latestUpdatedAt: number;
}

interface RoleBankScreenProps {
  scenarios: Scenario[];
  customBankRoles: RoleBankItem[];
  isDark?: boolean;
  hapticEnabled?: boolean;
  onBack: () => void;
  onSaveRole: (
    originalName: string | null,
    updated: RoleDefinition,
    syncAcrossScenarios: boolean,
    bankItemId?: string
  ) => void;
  onDeleteBankRole: (bankItemId: string) => void;
  onAddRoleToScenario: (
    role: RoleDefinition,
    scenarioId: string,
    tierKey: ScenarioTierKey
  ) => void;
}

const TEAM_FILTERS: Array<{ key: 'all' | RoleTeam; label: string }> = [
  { key: 'all', label: 'همه نقش‌ها' },
  { key: 'citizen', label: 'شهروند' },
  { key: 'mafia', label: 'مافیا' },
  { key: 'independent', label: 'مستقل' },
];

const TIER_OPTIONS: Array<{ key: ScenarioTierKey; label: string }> = [
  { key: 'basic', label: 'پایه' },
  { key: 'advanced', label: 'پیشرفته' },
  { key: 'expert', label: 'حرفه‌ای' },
];

export const RoleBankScreen: React.FC<RoleBankScreenProps> = ({
  scenarios,
  customBankRoles,
  isDark = true,
  hapticEnabled = true,
  onBack,
  onSaveRole,
  onDeleteBankRole,
  onAddRoleToScenario,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<'all' | RoleTeam>('all');
  const [scenarioFilter, setScenarioFilter] = useState<string>('all');
  const [onlyWithTips, setOnlyWithTips] = useState(false);

  const [editingTarget, setEditingTarget] = useState<{
    originalName: string | null;
    role: RoleDefinition;
    scenarioCount: number;
    bankItemId?: string;
    isNew: boolean;
  } | null>(null);

  const [addToScenarioTarget, setAddToScenarioTarget] = useState<RoleDefinition | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => scenarios[0]?.id ?? '');
  const [selectedTierKey, setSelectedTierKey] = useState<ScenarioTierKey>('basic');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const aggregatedRoles = useMemo<AggregatedRoleEntry[]>(() => {
    const map = new Map<string, AggregatedRoleEntry>();

    for (const scenario of scenarios) {
      const tiers: ScenarioTierKey[] = ['basic', 'advanced', 'expert'];
      for (const tierKey of tiers) {
        const tier = scenario.tiers[tierKey];
        for (const role of tier.roles) {
          const normalized = role.name.trim();
          if (!normalized) continue;

          const existing = map.get(normalized);
          if (!existing) {
            map.set(normalized, {
              key: normalized,
              role: { ...role },
              team: inferRoleTeam(role),
              usages: [
                {
                  scenarioId: scenario.id,
                  scenarioName: scenario.name,
                  tierLabels: [tier.label],
                  updatedAt: scenario.updatedAt,
                },
              ],
              latestUpdatedAt: scenario.updatedAt,
            });
          } else {
            const usage = existing.usages.find((u) => u.scenarioId === scenario.id);
            if (usage) {
              if (!usage.tierLabels.includes(tier.label)) {
                usage.tierLabels.push(tier.label);
              }
            } else {
              existing.usages.push({
                scenarioId: scenario.id,
                scenarioName: scenario.name,
                tierLabels: [tier.label],
                updatedAt: scenario.updatedAt,
              });
            }
            if (!existing.role.roleplayTip && role.roleplayTip) {
              existing.role = { ...existing.role, roleplayTip: role.roleplayTip };
            }
            if (scenario.updatedAt > existing.latestUpdatedAt) {
              existing.latestUpdatedAt = scenario.updatedAt;
            }
          }
        }
      }
    }

    for (const item of customBankRoles) {
      const normalized = item.name.trim();
      if (!normalized) continue;
      const bankRole: RoleDefinition = {
        id: item.id,
        name: item.name,
        count: 1,
        description: item.description,
        roleplayTip: item.roleplayTip,
        color: item.color,
        icon: item.icon,
        team: item.team,
        inquiryOverride: item.inquiryOverride,
      };
      const existing = map.get(normalized);
      if (!existing) {
        map.set(normalized, {
          key: normalized,
          role: bankRole,
          team: inferRoleTeam(bankRole),
          bankItemId: item.id,
          usages: [],
          latestUpdatedAt: item.updatedAt,
        });
      } else {
        existing.bankItemId = item.id;
        if (item.updatedAt >= existing.latestUpdatedAt) {
          existing.role = { ...existing.role, ...bankRole, id: existing.role.id };
          existing.team = inferRoleTeam(existing.role);
          existing.latestUpdatedAt = item.updatedAt;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key, 'fa'));
  }, [scenarios, customBankRoles]);

  const filteredRoles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return aggregatedRoles.filter((entry) => {
      if (teamFilter !== 'all' && entry.team !== teamFilter) return false;
      if (onlyWithTips && !entry.role.roleplayTip?.trim()) return false;
      if (scenarioFilter === 'bank-only' && entry.usages.length > 0) return false;
      if (
        scenarioFilter !== 'all' &&
        scenarioFilter !== 'bank-only' &&
        !entry.usages.some((u) => u.scenarioId === scenarioFilter)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        entry.role.name.toLowerCase().includes(q) ||
        entry.role.description.toLowerCase().includes(q) ||
        (entry.role.roleplayTip?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [aggregatedRoles, searchQuery, teamFilter, scenarioFilter, onlyWithTips]);

  const tipsCount = useMemo(
    () => aggregatedRoles.filter((e) => Boolean(e.role.roleplayTip?.trim())).length,
    [aggregatedRoles]
  );

  const showBanner = (message: string) => {
    setFeedbackBanner(message);
    window.setTimeout(() => {
      setFeedbackBanner((prev) => (prev === message ? null : prev));
    }, 3200);
  };

  const handleOpenNewRole = () => {
    triggerHaptic('confirm', hapticEnabled);
    setEditingTarget({
      originalName: null,
      role: {
        id: generateLocalId('bank-role'),
        name: '',
        count: 1,
        description: '',
        roleplayTip: '',
        color: '#3B82F6',
        icon: 'sparkles',
        team: 'citizen',
        inquiryOverride: 'auto',
      },
      scenarioCount: 0,
      isNew: true,
    });
  };

  const handleConfirmAddToScenario = () => {
    if (!addToScenarioTarget || !selectedScenarioId) return;
    const targetScenario = scenarios.find((s) => s.id === selectedScenarioId);
    const tierObj = TIER_OPTIONS.find((t) => t.key === selectedTierKey);
    triggerHaptic('confirm', hapticEnabled);
    onAddRoleToScenario(addToScenarioTarget, selectedScenarioId, selectedTierKey);
    setAddToScenarioTarget(null);
    showBanner(
      `نقش «${addToScenarioTarget.name}» به سطح ${tierObj?.label ?? ''} سناریو «${targetScenario?.name ?? ''}» اضافه شد.`
    );
  };

  return (
    <div className="relative z-10 min-h-dvh flex flex-col bg-transparent text-slate-900 dark:text-slate-100 pb-safe pb-12 transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 pt-safe bg-white/85 dark:bg-[#090B10]/85 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-3 sm:px-6">
        <div className="w-full max-w-6xl mx-auto h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onBack();
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-[#161B28] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="بازگشت به سناریوها"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                بانک نقش‌ها
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenNewRole}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#C4161C] hover:bg-[#AD1217] dark:bg-amber-500 dark:hover:bg-amber-400 active:scale-[0.98] text-white dark:text-slate-950 font-extrabold text-xs sm:text-sm px-3.5 sm:px-4 py-2 min-h-[44px] transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
            <span>نقش جدید</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-4 flex-1">
        {feedbackBanner && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/12 px-4 py-3 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-3.5 sm:p-4 space-y-3 shadow-sm dark:shadow-none">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام نقش، توضیح یا نکته ایفای نقش..."
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] pr-10 pl-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
              aria-label="فیلتر بر اساس سناریو"
              className="min-h-[44px] sm:w-52 rounded-xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] px-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">همه سناریوها ({toPersianDigits(aggregatedRoles.length)})</option>
              <option value="bank-only">نقش‌های اختصاصی بانک</option>
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {TEAM_FILTERS.map((opt) => {
                const active = teamFilter === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', hapticEnabled);
                      setTeamFilter(opt.key);
                    }}
                    className={`min-h-[38px] px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-amber-500 text-slate-950 font-extrabold'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                setOnlyWithTips((prev) => !prev);
              }}
              aria-pressed={onlyWithTips}
              className={`min-h-[38px] px-3 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer tabular-nums ${
                onlyWithTips
                  ? 'border-amber-500 bg-amber-500/18 text-amber-800 dark:text-amber-200'
                  : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>دارای نکته بازی ({toPersianDigits(tipsCount)})</span>
            </button>
          </div>
        </section>

        {/* Role Cards Grid */}
        {filteredRoles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-white/15 bg-white dark:bg-[#121620] p-10 text-center">
            <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-3 opacity-80" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1.5">
              نقشی با این فیلتر پیدا نشد
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              عبارت جستجو یا فیلتر جبهه/سناریو را تغییر دهید یا یک نقش جدید بسازید.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredRoles.map((entry) => {
              const { role, team, usages, bankItemId } = entry;
              const readableColor = getReadableRoleColor(role.color, isDark);
              const teamBadgeClass =
                team === 'mafia'
                  ? 'border-rose-500/35 bg-rose-500/12 text-rose-700 dark:text-rose-200'
                  : team === 'independent'
                    ? 'border-purple-500/35 bg-purple-500/12 text-purple-700 dark:text-purple-200'
                    : 'border-sky-500/35 bg-sky-500/12 text-sky-700 dark:text-sky-200';

              return (
                <article
                  key={entry.key}
                  className="rounded-2xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-4 shadow-sm dark:shadow-none flex flex-col justify-between gap-3"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: hexToRgba(role.color, 0.16),
                            borderColor: hexToRgba(role.color, 0.42),
                          }}
                        >
                          <RoleIcon
                            name={role.icon}
                            className="w-6 h-6"
                            style={{ color: role.color }}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2
                              className="text-base font-extrabold leading-snug"
                              style={{ color: readableColor }}
                            >
                              {role.name}
                            </h2>
                            <span
                              className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold ${teamBadgeClass}`}
                            >
                              {getRoleTeamLabel(team)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                            {usages.length > 0
                              ? `موجود در ${toPersianDigits(usages.length)} سناریو: ${usages
                                  .slice(0, 2)
                                  .map((u) => u.scenarioName)
                                  .join('، ')}${usages.length > 2 ? ` و ${toPersianDigits(usages.length - 2)} مورد دیگر` : ''}`
                              : 'نقش سفارشی ذخیره شده در بانک'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {role.description || 'بدون توضیح ثبت‌شده.'}
                    </p>

                    {role.roleplayTip?.trim() ? (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-slate-800 dark:text-amber-100/95 leading-relaxed">
                          <span className="font-extrabold text-amber-700 dark:text-amber-300">
                            نکته ایفای نقش:{' '}
                          </span>
                          {role.roleplayTip}
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', hapticEnabled);
                          setEditingTarget({
                            originalName: entry.key,
                            role: { ...role },
                            scenarioCount: usages.length,
                            bankItemId,
                            isNew: false,
                          });
                        }}
                        className="w-full rounded-xl border border-dashed border-slate-300 dark:border-white/12 px-3 py-2 text-xs text-slate-500 dark:text-slate-400 hover:border-amber-500/50 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>افزودن نکته و راهنمای ایفای بهتر این نقش...</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/6">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', hapticEnabled);
                        setEditingTarget({
                          originalName: entry.key,
                          role: { ...role },
                          scenarioCount: usages.length,
                          bankItemId,
                          isNew: false,
                        });
                      }}
                      className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-[#171D2B] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>ویرایش / نکته</span>
                    </button>

                    {scenarios.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', hapticEnabled);
                          setSelectedScenarioId(scenarios[0]?.id ?? '');
                          setSelectedTierKey('basic');
                          setAddToScenarioTarget({ ...role });
                        }}
                        className="flex-1 min-h-[44px] rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>افزودن به سناریو</span>
                      </button>
                    )}

                    {usages.length === 0 && bankItemId && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('warning', hapticEnabled);
                          onDeleteBankRole(bankItemId);
                          showBanner(`نقش «${role.name}» از بانک شخصی حذف شد.`);
                        }}
                        aria-label={`حذف نقش ${role.name}`}
                        className="min-h-[44px] min-w-[44px] rounded-xl border border-rose-500/25 bg-rose-500/8 hover:bg-rose-500/18 text-rose-600 dark:text-rose-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {editingTarget && (
        <RoleEditModal
          role={editingTarget.role}
          isNew={editingTarget.isNew}
          allowCountEdit={false}
          showSyncAcrossScenarios={!editingTarget.isNew && editingTarget.scenarioCount > 0}
          syncScenarioCount={editingTarget.scenarioCount}
          onSave={(updated, syncAcrossScenarios = true) => {
            onSaveRole(
              editingTarget.originalName,
              updated,
              syncAcrossScenarios,
              editingTarget.bankItemId
            );
            setEditingTarget(null);
            showBanner(
              editingTarget.isNew
                ? `نقش «${updated.name}» به بانک نقش‌ها اضافه شد.`
                : syncAcrossScenarios && editingTarget.scenarioCount > 0
                  ? `نقش «${updated.name}» در بانک و ${toPersianDigits(editingTarget.scenarioCount)} سناریو به‌روزرسانی شد.`
                  : `تغییرات نقش «${updated.name}» در بانک ذخیره شد.`
            );
          }}
          onClose={() => setEditingTarget(null)}
        />
      )}

      {addToScenarioTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: hexToRgba(addToScenarioTarget.color, 0.16),
                    borderColor: hexToRgba(addToScenarioTarget.color, 0.42),
                  }}
                >
                  <RoleIcon
                    name={addToScenarioTarget.icon}
                    className="w-5 h-5"
                    style={{ color: addToScenarioTarget.color }}
                  />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                  افزودن «{addToScenarioTarget.name}» به سناریو
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAddToScenarioTarget(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label
                htmlFor="bank-target-scenario"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                انتخاب سناریو
              </label>
              <select
                id="bank-target-scenario"
                value={selectedScenarioId}
                onChange={(e) => setSelectedScenarioId(e.target.value)}
                className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] px-3.5 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                انتخاب سطح سناریو
              </span>
              <div className="grid grid-cols-3 gap-2">
                {TIER_OPTIONS.map((t) => {
                  const active = selectedTierKey === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setSelectedTierKey(t.key)}
                      className={`min-h-[44px] rounded-xl border text-xs font-extrabold cursor-pointer transition-colors ${
                        active
                          ? 'border-amber-500 bg-amber-500 text-slate-950'
                          : 'border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-[#090B10] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleConfirmAddToScenario}
                className="flex-1 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm cursor-pointer"
              >
                افزودن به سناریو
              </button>
              <button
                type="button"
                onClick={() => setAddToScenarioTarget(null)}
                className="min-h-[48px] px-4 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-semibold cursor-pointer"
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
