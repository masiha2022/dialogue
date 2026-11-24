import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Minus,
  Pencil,
  Plus,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  AppPreferences,
  RevealMode,
  RoleDefinition,
  Scenario,
  ScenarioTierKey,
} from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import { getReadableRoleColor, getTotalRoleCount, hexToRgba, toPersianDigits } from '../../utils/persian';
import { RoleEditModal } from '../modals/RoleEditModal';
import { RoleIcon } from '../RoleIcon';

interface GameSetupScreenProps {
  scenario: Scenario;
  preferences: AppPreferences;
  onOpenCustomization: () => void;
  onBack: () => void;
  onOpenRules: (scenario: Scenario, tierKey: ScenarioTierKey) => void;
  onStartDistribution: (
    scenario: Scenario,
    tierKey: ScenarioTierKey,
    tierLabel: string,
    playerCount: number,
    rolesToDeal: RoleDefinition[],
    playerNames: string[],
    revealMode: RevealMode
  ) => void;
}

const TIER_KEYS: ScenarioTierKey[] = ['basic', 'advanced', 'expert'];

export const GameSetupScreen: React.FC<GameSetupScreenProps> = ({
  scenario,
  preferences,
  onOpenCustomization,
  onBack,
  onOpenRules,
  onStartDistribution,
}) => {
  const [selectedTierKey, setSelectedTierKey] = useState<ScenarioTierKey>('basic');
  const [workingRoles, setWorkingRoles] = useState<RoleDefinition[]>(() =>
    scenario.tiers.basic.roles.map((r) => ({ ...r }))
  );
  const [playerCount, setPlayerCount] = useState<number>(() =>
    Math.max(2, getTotalRoleCount(scenario.tiers.basic.roles) || scenario.tiers.basic.recommendedPlayers)
  );
  const [customizingRole, setCustomizingRole] = useState<RoleDefinition | null>(null);

  const applyTier = (tierKey: ScenarioTierKey) => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    const tier = scenario.tiers[tierKey];
    const clonedRoles = tier.roles.map((r) => ({ ...r }));
    const nextCount = Math.max(2, getTotalRoleCount(clonedRoles) || tier.recommendedPlayers);
    setSelectedTierKey(tierKey);
    setWorkingRoles(clonedRoles);
    setPlayerCount(nextCount);
  };

  const activeTier = scenario.tiers[selectedTierKey];
  const totalAssignedRoles = getTotalRoleCount(workingRoles);
  const diff = playerCount - totalAssignedRoles;
  const isValidSetup = playerCount >= 2 && diff === 0 && totalAssignedRoles > 0;

  const suggestedTierKey = TIER_KEYS.find(
    (k) => k !== selectedTierKey && scenario.tiers[k].recommendedPlayers === playerCount
  );

  const updateRoleCount = (roleId: string, delta: number) => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    setWorkingRoles((prev) =>
      prev.map((role) =>
        role.id === roleId ? { ...role, count: Math.max(0, role.count + delta) } : role
      )
    );
  };

  const handleSaveCustomRole = (updated: RoleDefinition) => {
    triggerHaptic('confirm', preferences.hapticFeedbackEnabled);
    setWorkingRoles((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setCustomizingRole(null);
  };

  const handleAutoBalance = () => {
    if (workingRoles.length === 0) return;
    triggerHaptic('confirm', preferences.hapticFeedbackEnabled);
    const baseRoleIndex = workingRoles.findIndex(
      (r) => r.name.includes('شهروند') || r.name.includes('روستایی')
    );
    const targetIdx = baseRoleIndex >= 0 ? baseRoleIndex : workingRoles.length - 1;

    setWorkingRoles((prev) =>
      prev.map((role, idx) => {
        if (idx !== targetIdx) return role;
        return { ...role, count: Math.max(0, role.count + diff) };
      })
    );
  };

  const handlePlayerCountStep = (delta: number) => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    const nextCount = Math.max(2, Math.min(40, playerCount + delta));
    setPlayerCount(nextCount);
  };

  const handleSubmit = () => {
    if (!isValidSetup) return;
    triggerHaptic('confirm', preferences.hapticFeedbackEnabled);
    const activeRoles = workingRoles.filter((r) => r.count > 0);
    const finalNames = Array.from(
      { length: playerCount },
      (_, idx) => `بازیکن ${toPersianDigits(idx + 1)}`
    );
    onStartDistribution(
      scenario,
      selectedTierKey,
      activeTier.label,
      playerCount,
      activeRoles,
      finalNames,
      preferences.revealMode
    );
  };

  const isDark = preferences.themeMode !== 'light';

  return (
    <div className="relative z-10 min-h-dvh flex flex-col bg-transparent pb-28 sm:pb-10 transition-colors">
      {/* Compact Sticky Top Bar */}
      <header className="sticky top-0 z-30 h-15 bg-white/85 dark:bg-[#090B10]/85 backdrop-blur-md border-b border-slate-200 dark:border-white/12 px-3 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-[#161B28] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
            {scenario.name}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenCustomization}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-2 min-h-[44px] min-w-[44px] justify-center text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer whitespace-nowrap"
            aria-label="شخصی‌سازی صدا، آلارم و نمایش"
            title="شخصی‌سازی صدا، آلارم و نمایش"
          >
            <SlidersHorizontal className="w-[18px] h-[18px] text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">شخصی‌سازی</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenRules(scenario, selectedTierKey)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/35 dark:border-blue-400/35 bg-blue-500/12 dark:bg-blue-500/15 hover:bg-blue-500/20 dark:hover:bg-blue-500/25 px-3 py-2 min-h-[44px] text-xs font-bold text-blue-800 dark:text-blue-100 transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-[18px] h-[18px] text-blue-600 dark:text-blue-300" />
            <span>قوانین</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Tier Picker + Player Count + Rosters & Reveal Security */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. Tier Picker */}
          <section
            aria-labelledby="tier-select-heading"
            className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#121620] p-5 space-y-3.5 shadow-xs dark:shadow-none"
          >
            <h2 id="tier-select-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              ۱. انتخاب سطح سناریو
            </h2>

            <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#090B10] border border-slate-200 dark:border-white/8">
              {TIER_KEYS.map((key) => {
                const tier = scenario.tiers[key];
                const isActive = selectedTierKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTier(key)}
                    className={`min-h-[54px] rounded-lg px-2 py-2 flex flex-col items-center justify-center transition-all cursor-pointer tabular-nums ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-white/5 font-semibold'
                    }`}
                  >
                    <span className="text-xs sm:text-sm">{tier.label}</span>
                    <span
                      className={`text-[11px] mt-0.5 ${
                        isActive ? 'text-slate-900 font-bold' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {toPersianDigits(tier.recommendedPlayers)} نفر
                    </span>
                  </button>
                );
              })}
            </div>

            {activeTier.summaryNote && (
              <p className="text-xs text-amber-700 dark:text-amber-300/90 tabular-nums px-1 font-medium">
                {activeTier.summaryNote}
              </p>
            )}
          </section>

          {/* 2. Player Count */}
          <section
            aria-labelledby="player-count-heading"
            className="rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#121620] p-5 space-y-3.5 shadow-xs dark:shadow-none"
          >
            <h2 id="player-count-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              ۲. تعداد بازیکنان
            </h2>

            <div className="flex items-center justify-between gap-4 bg-slate-100 dark:bg-[#0B0E15] rounded-2xl p-2 border border-slate-200 dark:border-white/6">
              <button
                type="button"
                onClick={() => handlePlayerCountStep(-1)}
                disabled={playerCount <= 2}
                className="w-14 h-14 rounded-xl bg-white dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-[#1E2536] border border-slate-200 dark:border-transparent disabled:opacity-40 text-slate-900 dark:text-slate-100 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                aria-label="کاهش تعداد بازیکن"
              >
                <Minus className="w-6 h-6" />
              </button>

              <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums leading-none">
                {toPersianDigits(playerCount)} نفر
              </div>

              <button
                type="button"
                onClick={() => handlePlayerCountStep(1)}
                disabled={playerCount >= 40}
                className="w-14 h-14 rounded-xl bg-white dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-[#1E2536] border border-slate-200 dark:border-transparent disabled:opacity-40 text-slate-900 dark:text-slate-100 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                aria-label="افزایش تعداد بازیکن"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            {suggestedTierKey && (
              <button
                type="button"
                onClick={() => applyTier(suggestedTierKey)}
                className="w-full min-h-[44px] rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/15 px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2 cursor-pointer tabular-nums"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  پیشنهاد خودکار: اعمال چیدمان سطح «{scenario.tiers[suggestedTierKey].label}» ({toPersianDigits(playerCount)} نفر)
                </span>
              </button>
            )}
          </section>
        </div>

        {/* Column 2: Role Distribution Summary */}
        <section
          aria-labelledby="role-summary-heading"
          className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-xs dark:shadow-none"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 id="role-summary-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              ۳. نقش‌ها
            </h2>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">
              {toPersianDigits(totalAssignedRoles)} از {toPersianDigits(playerCount)}
            </span>
          </div>

          {diff !== 0 && (
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/12 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed tabular-nums font-medium">
                {diff > 0
                  ? `${toPersianDigits(diff)} بازیکن هنوز نقشی ندارد.`
                  : `${toPersianDigits(Math.abs(diff))} نقش بیشتر از تعداد بازیکنان است.`}
              </p>
              <button
                type="button"
                onClick={handleAutoBalance}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3.5 py-2 min-h-[40px] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تنظیم خودکار</span>
              </button>
            </div>
          )}

          <div className="divide-y divide-slate-200 dark:divide-white/6">
            {workingRoles.map((role) => {
              const readableColor = getReadableRoleColor(role.color, isDark);
              return (
                <div
                  key={role.id}
                  className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setCustomizingRole(role)}
                      className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                      style={{
                        backgroundColor: hexToRgba(role.color, isDark ? 0.14 : 0.16),
                        border: `1px solid ${hexToRgba(readableColor, 0.35)}`,
                      }}
                      title="سفارشی‌سازی آیکون، رنگ و توضیح نقش"
                    >
                      <RoleIcon name={role.icon} className="w-4 h-4" style={{ color: readableColor }} />
                    </button>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                        <span className="truncate">{role.name}</span>
                        <button
                          type="button"
                          onClick={() => setCustomizingRole(role)}
                          className="text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-300 cursor-pointer shrink-0 p-0.5"
                          title="ویرایش سریع نقش"
                          aria-label={`ویرایش سریع ${role.name}`}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateRoleCount(role.id, -1)}
                      disabled={role.count <= 0}
                      className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0B0E15] hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-35 flex items-center justify-center text-slate-800 dark:text-slate-200 cursor-pointer"
                      aria-label={`کاهش تعداد ${role.name}`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {toPersianDigits(role.count)}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateRoleCount(role.id, 1)}
                      className="w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0B0E15] hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-800 dark:text-slate-200 cursor-pointer"
                      aria-label={`افزایش تعداد ${role.name}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block pt-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValidSetup}
              className="w-full min-h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 active:scale-[0.98] text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Shuffle className="w-5 h-5" />
              <span>توزیع نقش‌ها و شروع</span>
            </button>
          </div>
        </section>
      </main>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 px-4 pt-4 pb-safe bg-gradient-to-t from-[#F4F5F7] via-[#F4F5F7]/95 dark:from-[#090B10] dark:via-[#090B10]/95 to-transparent">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isValidSetup}
          className="w-full min-h-[56px] rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 active:scale-[0.98] text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          <Shuffle className="w-5 h-5" />
          <span>توزیع نقش‌ها و شروع</span>
        </button>
      </div>


      {customizingRole && (
        <RoleEditModal
          role={customizingRole}
          isNew={false}
          allowCountEdit={false}
          onSave={handleSaveCustomRole}
          onClose={() => setCustomizingRole(null)}
        />
      )}
    </div>
  );
};
