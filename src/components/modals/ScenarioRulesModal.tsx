import React, { useState } from 'react';
import { BookOpen, Moon, Scale, Sun, Trophy, X } from 'lucide-react';
import { Scenario, ScenarioTierKey } from '../../types/game';
import { hexToRgba, getReadableRoleColor, toPersianDigits } from '../../utils/persian';
import { RoleIcon } from '../RoleIcon';

interface ScenarioRulesModalProps {
  scenario: Scenario;
  initialTierKey?: ScenarioTierKey;
  isDark?: boolean;
  onClose: () => void;
}

export const ScenarioRulesModal: React.FC<ScenarioRulesModalProps> = ({
  scenario,
  initialTierKey = 'basic',
  isDark = true,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'roles'>('rules');
  const [selectedTier, setSelectedTier] = useState<ScenarioTierKey>(initialTierKey);

  const tier = scenario.tiers[selectedTier];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-200 dark:border-white/8 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 truncate">
                قوانین و راهنمای {scenario.name}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{scenario.tagline}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer shrink-0"
            aria-label="بستن راهنما"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Switch: Rules vs Roles by Tier */}
        <div className="px-5 pt-3 shrink-0">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#090B10] border border-slate-200 dark:border-white/8">
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`min-h-[40px] rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              قوانین و ترتیب شب
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roles')}
              className={`min-h-[40px] rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              نقشها
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'rules' ? (
            <>
              {scenario.rules.overview && (
                <section className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0C0F17] p-4">
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{scenario.rules.overview}</p>
                </section>
              )}

              {scenario.rules.winConditions.length > 0 && (
                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>شرایط پیروزی</span>
                  </h3>
                  <ul className="space-y-2">
                    {scenario.rules.winConditions.map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-white/6 bg-slate-50 dark:bg-[#0C0F17] px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {scenario.rules.nightOrder.length > 0 && (
                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    <span>ترتیب بیداری شب (راهنمای گرداننده)</span>
                  </h3>
                  <ul className="space-y-2">
                    {scenario.rules.nightOrder.map((step, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-white/6 bg-slate-50 dark:bg-[#0C0F17] px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
                      >
                        {step}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {scenario.rules.keyMechanics.length > 0 && (
                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>قوانین کلیدی و نکات ویژه</span>
                  </h3>
                  <ul className="space-y-2">
                    {scenario.rules.keyMechanics.map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-white/6 bg-slate-50 dark:bg-[#0C0F17] px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {scenario.rules.dayAndVoting.length > 0 && (
                <section className="space-y-2.5">
                  <h3 className="text-sm font-bold text-orange-700 dark:text-orange-300 flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    <span>فاز روز و رأی‌گیری</span>
                  </h3>
                  <ul className="space-y-2">
                    {scenario.rules.dayAndVoting.map((item, idx) => (
                      <li
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-white/6 bg-slate-50 dark:bg-[#0C0F17] px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          ) : (
            <div className="space-y-4">
              {/* Tier Switcher */}
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#090B10] border border-slate-200 dark:border-white/8">
                {(['basic', 'advanced', 'expert'] as ScenarioTierKey[]).map((key) => {
                  const t = scenario.tiers[key];
                  const isActive = selectedTier === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedTier(key)}
                      className={`min-h-[44px] px-2 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer tabular-nums ${
                        isActive
                          ? 'bg-white dark:bg-[#1D2433] text-amber-700 dark:text-amber-300 border border-amber-500/40 dark:border-amber-500/30 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {t.label} ({toPersianDigits(t.recommendedPlayers)} نفر)
                    </button>
                  );
                })}
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 tabular-nums px-1">
                {tier.summaryNote || `چیدمان پیشنهادی برای ${toPersianDigits(tier.recommendedPlayers)} بازیکن`}
              </div>

              <div className="space-y-2.5">
                {tier.roles.map((role) => {
                  const readableColor = getReadableRoleColor(role.color, isDark);
                  return (
                    <div
                      key={role.id}
                      className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0C0F17] p-3.5 flex items-start gap-3"
                    >
                      <div
                        className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                        style={{
                          backgroundColor: hexToRgba(role.color, isDark ? 0.14 : 0.16),
                          border: `1px solid ${hexToRgba(readableColor, 0.35)}`,
                        }}
                      >
                        <RoleIcon name={role.icon} className="w-5 h-5" style={{ color: readableColor }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm" style={{ color: readableColor }}>
                            {role.name}
                          </span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            {toPersianDigits(role.count)} عدد
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                          {role.description || 'بدون توضیح'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-white/8 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm cursor-pointer"
          >
            بستن راهنما
          </button>
        </div>
      </div>
    </div>
  );
};
