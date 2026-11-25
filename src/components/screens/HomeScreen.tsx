import React from 'react';
import {
  GraduationCap,
  Instagram,
  Moon,
  Play,
  SlidersHorizontal,
  Sun,
  Timer,
} from 'lucide-react';
import { ActiveGameSession } from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import { toPersianDigits } from '../../utils/persian';
import { BrandLogo } from '../BrandLogo';
import { OfflineBanner } from '../OfflineBanner';
import { PWAInstallButton } from '../PWAInstallButton';

interface HomeScreenProps {
  activeSession: ActiveGameSession | null;
  themeMode: 'dark' | 'light';
  hapticEnabled?: boolean;
  onToggleTheme: () => void;
  onStartSelectScenario: () => void;
  onOpenScenarios: () => void;
  onOpenTools: () => void;
  onResumeActiveTools: () => void;
  onDiscardActiveSession: () => void;
  onOpenGuide: () => void;
  onOpenCustomization: () => void;
}

const DIALOGUE_INSTAGRAM_URL = 'https://www.instagram.com/dialogue_gameclub/';

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeSession,
  themeMode,
  hapticEnabled = true,
  onToggleTheme,
  onStartSelectScenario,
  onOpenScenarios,
  onOpenTools,
  onResumeActiveTools,
  onDiscardActiveSession,
  onOpenGuide,
  onOpenCustomization,
}) => {
  const isDark = themeMode === 'dark';

  const handleOpenScenarios = () => {
    triggerHaptic('confirm', hapticEnabled);
    onOpenScenarios();
    if (onOpenScenarios !== onStartSelectScenario) {
      // Keep prop parity if caller overrides either handler
    }
  };

  return (
    <div className="relative z-10 min-h-dvh w-full overflow-x-hidden flex flex-col bg-transparent text-slate-900 dark:text-slate-100 pb-14 sm:pb-14 transition-colors">
      <OfflineBanner />

      {/* Clean Top Bar */}
      <header className="sticky top-0 z-30 h-14 bg-white/75 dark:bg-[#090B10]/75 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-3 sm:px-6">
        <div className="w-full max-w-6xl mx-auto h-full flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <BrandLogo size="sm" />
            <span
              className="text-[19px] font-extrabold tracking-wide text-[#C4161C] dark:text-red-500 whitespace-nowrap"
              dir="ltr"
            >
              Dialogue
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onToggleTheme();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 px-2.5 sm:px-3 py-2 min-h-[44px] text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={isDark ? 'تغییر به روز' : 'تغییر به شب'}
              title={isDark ? 'تغییر به روز' : 'تغییر به شب'}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>روز</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span>شب</span>
                </>
              )}
            </button>

            <PWAInstallButton />
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col gap-4">
        {/* Active Session Resume Banner */}
        {activeSession && (
          <section className="rounded-2xl border border-amber-500/45 bg-amber-500/12 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-amber-900 dark:text-amber-200 truncate">
                بازی فعال: {activeSession.scenarioName} ({activeSession.tierLabel})
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-100/85 mt-0.5 tabular-nums">
                {toPersianDigits(activeSession.playerCount)} بازیکن · نقش‌ها توزیع شده و جدول گرداننده ذخیره است
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('confirm', hapticEnabled);
                  onResumeActiveTools();
                }}
                className="flex-1 sm:flex-initial min-h-[44px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
              >
                ادامه مدیریت بازی
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', hapticEnabled);
                  onDiscardActiveSession();
                }}
                className="min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#161B28] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                بستن دور
              </button>
            </div>
          </section>
        )}

        {/* Centered Balanced 2-Column Grid of 4 Equal Circular Buttons with Doubled Spacing & Centered Instagram Link */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="grid grid-cols-2 place-items-center gap-14 sm:gap-20 w-[350px] h-[350px] mx-auto">
              <button
                type="button"
                onClick={handleOpenScenarios}
                aria-label="سناریوها"
                title="سناریوها"
                className="group w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] rounded-full bg-amber-500 hover:bg-amber-400 active:scale-[0.95] text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/25 ring-4 ring-amber-500/20 transition-all cursor-pointer select-none shrink-0"
              >
                <Play className="w-9 h-9 sm:w-10 sm:h-10 fill-current transition-transform group-hover:scale-105" />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', hapticEnabled);
                  onOpenTools();
                }}
                aria-label="ابزار"
                title="ابزار"
                className="group w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] rounded-full bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 active:scale-[0.95] text-white flex items-center justify-center shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/20 transition-all cursor-pointer select-none shrink-0"
              >
                <Timer className="w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105" />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', hapticEnabled);
                  onOpenGuide();
                }}
                aria-label="راهنما"
                title="راهنما"
                className="group w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] rounded-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.95] text-white flex items-center justify-center shadow-xl shadow-emerald-500/25 ring-4 ring-emerald-500/20 transition-all cursor-pointer select-none shrink-0"
              >
                <GraduationCap className="w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105" />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', hapticEnabled);
                  onOpenCustomization();
                }}
                aria-label="شخصی‌سازی"
                title="شخصی‌سازی"
                className="group w-[96px] h-[96px] sm:w-[112px] sm:h-[112px] rounded-full bg-violet-600 hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400 active:scale-[0.95] text-white flex items-center justify-center shadow-xl shadow-violet-500/25 ring-4 ring-violet-500/20 transition-all cursor-pointer select-none shrink-0"
              >
                <SlidersHorizontal className="w-9 h-9 sm:w-10 sm:h-10 transition-transform group-hover:scale-105" />
              </button>
            </div>

            {/* Instagram Hyperlink centered horizontally and vertically */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <a
                href={DIALOGUE_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic('tap', hapticEnabled)}
                aria-label="صفحه اینستاگرام کافه دیالوگ (@dialogue_gameclub)"
                className="pointer-events-auto inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 text-xs sm:text-sm font-semibold text-[#C4161C] dark:text-amber-400 underline underline-offset-4 hover:opacity-80 transition-opacity whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
              >
                <Instagram className="w-4 h-4 shrink-0" />
                <span>کافه دیالوگ</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
