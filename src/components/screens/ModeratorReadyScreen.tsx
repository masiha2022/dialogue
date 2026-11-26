import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Play, Shuffle, Users } from 'lucide-react';
import { ScenarioVisualThemeId } from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import { hexToRgba, toPersianDigits } from '../../utils/persian';
import {
  getScenarioStageBackground,
  getThemePatternBackground,
  getThemePatternSize,
  resolveScenarioVisualTheme,
} from '../../utils/scenarioTheme';

interface ModeratorReadyScreenProps {
  scenarioName: string;
  tierLabel: string;
  playerCount: number;
  visualTheme?: ScenarioVisualThemeId;
  isDark?: boolean;
  hapticEnabled?: boolean;
  onStartReveal: () => void;
  onReshuffle: () => void;
  onOpenRules: () => void;
  onBackToSetup: () => void;
}

export const ModeratorReadyScreen: React.FC<ModeratorReadyScreenProps> = ({
  scenarioName,
  tierLabel,
  playerCount,
  visualTheme,
  isDark = true,
  hapticEnabled = true,
  onStartReveal,
  onReshuffle,
  onOpenRules,
  onBackToSetup,
}) => {
  const [shuffleCount, setShuffleCount] = useState(0);
  const themeConfig = resolveScenarioVisualTheme(visualTheme, scenarioName);
  const themeAccent = isDark ? themeConfig.accentHex : themeConfig.lightAccentHex;
  const stageBackground = getScenarioStageBackground(themeConfig, isDark);
  const cardBackground = isDark ? themeConfig.darkCardBg : themeConfig.lightCardBg;
  const patternBackground = getThemePatternBackground(themeConfig, isDark);
  const patternSize = getThemePatternSize(themeConfig.pattern);

  const handleReshuffle = () => {
    triggerHaptic('tap', hapticEnabled);
    onReshuffle();
    setShuffleCount((c) => c + 1);
  };

  return (
    <div
      className="relative z-10 min-h-dvh flex flex-col px-4 pt-safe-page py-5 pb-safe sm:px-6 sm:py-8 transition-colors"
      style={{ background: stageBackground }}
    >
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToSetup}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/18 bg-white/90 dark:bg-[#161B28]/90 hover:bg-slate-100 dark:hover:bg-white/10 px-4 py-2 min-h-[46px] text-sm font-bold text-slate-800 dark:text-white transition-colors cursor-pointer shadow-xs dark:shadow-none"
        >
          <ArrowRight className="w-5 h-5" />
          <span>بازگشت</span>
        </button>

        <span
          className="text-xs font-extrabold tabular-nums"
          style={{ color: themeAccent }}
        >
          {tierLabel}
        </span>
      </header>

      <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center gap-3.5 sm:gap-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-center shadow-sm dark:shadow-none"
          style={{
            background: cardBackground,
            border: `2px solid ${hexToRgba(themeAccent, isDark ? 0.44 : 0.34)}`,
            boxShadow: isDark
              ? `0 24px 60px -22px ${hexToRgba(themeConfig.accentHex, 0.34)}`
              : `0 18px 46px -20px ${hexToRgba(themeConfig.lightAccentHex, 0.22)}`,
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: patternBackground,
              backgroundSize: patternSize,
            }}
          />

          <div
            className="relative z-10 w-15 h-15 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              backgroundColor: hexToRgba(themeConfig.accentHex, 0.16),
              border: `1.5px solid ${hexToRgba(themeAccent, 0.45)}`,
            }}
          >
            <Users className="w-7 h-7" style={{ color: themeAccent }} strokeWidth={1.9} />
          </div>

          <p className="relative z-10 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mb-2 tabular-nums">
            {scenarioName} <span aria-hidden="true">·</span> {toPersianDigits(playerCount)} بازیکن
          </p>

          <h1 className="relative z-10 text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white text-balance mb-6">
            آماده توزیع نقش‌ها؟
          </h1>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReshuffle}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/18 bg-white/80 dark:bg-[#161B28]/85 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-[0.98] px-5 py-3 min-h-[48px] text-sm font-bold text-slate-900 dark:text-white transition-all cursor-pointer"
            >
              <Shuffle className="w-4 h-4" style={{ color: themeAccent }} />
              <span>
                {shuffleCount > 0
                  ? `بُر زدن مجدد (${toPersianDigits(shuffleCount)})`
                  : 'بُر زدن مجدد'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenRules}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/35 bg-blue-500/12 dark:bg-blue-500/15 hover:bg-blue-500/20 dark:hover:bg-blue-500/25 px-5 py-3 min-h-[48px] text-sm font-bold text-blue-800 dark:text-blue-100 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              <span>قوانین شب</span>
            </button>
          </div>
        </motion.div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('confirm', hapticEnabled);
            onStartReveal();
          }}
          className="w-full min-h-[60px] rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
          style={{
            backgroundColor: isDark ? themeConfig.accentHex : undefined,
            boxShadow: `0 12px 30px -10px ${hexToRgba(themeConfig.accentHex, 0.4)}`,
          }}
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>توزیع نقش</span>
        </button>
      </main>
    </div>
  );
};
