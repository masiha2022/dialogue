import React from 'react';
import {
  GraduationCap,
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
  onOpenCafeAbout: () => void;
}

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
  onOpenCafeAbout,
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
    <div className="relative z-10 min-h-dvh w-full overflow-x-hidden flex flex-col bg-transparent text-slate-900 dark:text-slate-100 pb-safe transition-colors">
      <OfflineBanner />

      {/* Clean Top Bar */}
      <header className="sticky top-0 z-30 pt-safe bg-white/75 dark:bg-[#090B10]/75 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 px-3 sm:px-6">
        <div className="w-full max-w-6xl mx-auto h-14 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-2.5 min-h-[44px] shrink-0">
            <BrandLogo size="sm" className="p-0" />
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
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex-1 flex flex-col gap-4">
        {/* Active Session Resume Banner */}
        {activeSession && (
          <section className="rounded-2xl border border-amber-500/45 bg-amber-500/12 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-amber-900 dark:text-amber-200 leading-snug">
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

        {/* Centered Start Circle Above Left-to-Right Row: Timer, Guide, Settings, Dialogue */}
        <div className="flex-1 flex flex-col items-center justify-center gap-9 sm:gap-11 py-4">
          <button
            type="button"
            onClick={handleOpenScenarios}
            aria-label="شروع"
            title="شروع"
            className="group flex flex-col items-center gap-2.5 cursor-pointer select-none focus-visible:outline-none"
          >
            <span className="w-[104px] h-[104px] sm:w-[118px] sm:h-[118px] rounded-full bg-amber-500 hover:bg-amber-400 group-active:scale-[0.95] text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 ring-4 ring-amber-500/25 transition-all">
              <Play className="w-10 h-10 sm:w-11 sm:h-11 fill-current transition-transform group-hover:scale-105" />
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
              شروع
            </span>
          </button>

          <div
            dir="ltr"
            className="w-full max-w-[360px] sm:max-w-[440px] grid grid-cols-4 place-items-center gap-2.5 sm:gap-5"
          >
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenTools();
              }}
              aria-label="تایمر"
              title="تایمر"
              className="group flex flex-col items-center gap-2 cursor-pointer select-none focus-visible:outline-none"
            >
              <span className="w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 group-active:scale-[0.95] text-white flex items-center justify-center shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/20 transition-all">
                <Timer className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-105" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                تایمر
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenGuide();
              }}
              aria-label="راهنما"
              title="راهنما"
              className="group flex flex-col items-center gap-2 cursor-pointer select-none focus-visible:outline-none"
            >
              <span className="w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 group-active:scale-[0.95] text-white flex items-center justify-center shadow-xl shadow-emerald-500/25 ring-4 ring-emerald-500/20 transition-all">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-105" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                راهنما
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenCustomization();
              }}
              aria-label="تنظیمات"
              title="تنظیمات"
              className="group flex flex-col items-center gap-2 cursor-pointer select-none focus-visible:outline-none"
            >
              <span className="w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full bg-violet-600 hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400 group-active:scale-[0.95] text-white flex items-center justify-center shadow-xl shadow-violet-500/25 ring-4 ring-violet-500/20 transition-all">
                <SlidersHorizontal className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-105" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                تنظیمات
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenCafeAbout();
              }}
              aria-label="دیالوگ"
              title="معرفی کافه دیالوگ"
              className="group flex flex-col items-center gap-2 cursor-pointer select-none focus-visible:outline-none"
            >
              <span className="w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full bg-white border-2 border-[#C4161C]/65 group-active:scale-[0.95] flex items-center justify-center shadow-xl shadow-[#C4161C]/25 ring-4 ring-[#C4161C]/20 overflow-hidden transition-all p-1.5">
                <BrandLogo
                  size="md"
                  className="w-full h-full rounded-full border-0 shadow-none p-0 bg-transparent transition-transform group-hover:scale-105"
                />
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#C4161C] dark:text-red-400 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                دیالوگ
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
