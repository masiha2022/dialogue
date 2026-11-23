import React from 'react';
import {
  GraduationCap,
  Home,
  Instagram,
  Layers,
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

  return (
    <div className="relative z-10 min-h-dvh flex flex-col bg-transparent text-slate-900 dark:text-slate-100 pb-24 sm:pb-8 transition-colors">
      <OfflineBanner />

      {/* Clean 3-Zone Top Bar */}
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

          <nav
            aria-label="مسیرهای اصلی"
            className="hidden sm:flex items-center gap-6 text-sm font-bold text-slate-600 dark:text-slate-300"
          >
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenScenarios();
              }}
              className="hover:text-red-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              سناریوها
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenTools();
              }}
              className="hover:text-red-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              ابزار
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenGuide();
              }}
              className="hover:text-red-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              راهنما
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenCustomization();
              }}
              className="hover:text-red-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              شخصی‌سازی
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onToggleTheme();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 px-2.5 sm:px-3 py-2 min-h-[44px] text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label={isDark ? 'تغییر به تم روز' : 'تغییر به تم شب'}
              title={isDark ? 'تغییر به تم روز' : 'تغییر به تم شب'}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>تم روز</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-slate-700" />
                  <span>تم شب</span>
                </>
              )}
            </button>

            <PWAInstallButton />
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-3 flex-1 flex flex-col gap-4">
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

        {/* Open Space Showcasing the Pervasive Background */}
        <div className="flex-1 min-h-[150px]" aria-hidden="true" />

        {/* Circular Start Button above the Instagram Link */}
        <div className="shrink-0 flex justify-center py-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('confirm', hapticEnabled);
              onStartSelectScenario();
            }}
            className="group relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-[#C4161C] hover:bg-[#AD1217] dark:bg-amber-500 dark:hover:bg-amber-400 active:scale-[0.96] text-white dark:text-slate-950 font-extrabold text-2xl sm:text-3xl flex flex-col items-center justify-center gap-2 shadow-2xl shadow-red-600/25 dark:shadow-amber-500/25 ring-8 ring-red-600/12 dark:ring-amber-500/15 transition-all cursor-pointer select-none"
          >
            <Play className="w-10 h-10 sm:w-11 sm:h-11 fill-current transition-transform group-hover:scale-105" />
            <span>شروع</span>
          </button>
        </div>

        {/* Short Simple Instagram Hyperlink at Page Bottom */}
        <div className="shrink-0 flex justify-center pt-1 pb-1">
          <a
            href={DIALOGUE_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => triggerHaptic('tap', hapticEnabled)}
            aria-label="صفحه اینستاگرام دیالوگ (@dialogue_gameclub)"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#C4161C] dark:text-amber-400 underline underline-offset-4 hover:opacity-80 transition-opacity py-1 drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
          >
            <Instagram className="w-4 h-4 shrink-0" />
            <span>اینستاگرام دیالوگ</span>
          </a>
        </div>
      </main>

      {/* Mobile Thumb-Zone Bottom Navigation Bar */}
      <nav
        aria-label="منوی اصلی موبایل"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 dark:border-white/16 bg-white/85 dark:bg-[#0E121B]/85 backdrop-blur-md px-1.5 pt-1.5 pb-safe"
      >
        <div className="grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={() => triggerHaptic('tap', hapticEnabled)}
            className="min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-[#C4161C] dark:text-amber-300 bg-red-500/10 dark:bg-amber-500/18 border border-red-500/30 dark:border-amber-400/35 font-extrabold cursor-pointer"
          >
            <Home className="w-[18px] h-[18px]" />
            <span className="text-[11px]">خانه</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap', hapticEnabled);
              onOpenScenarios();
            }}
            className="min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-[#151A26] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 font-bold cursor-pointer"
          >
            <Layers className="w-[18px] h-[18px] text-[#C4161C] dark:text-red-400" />
            <span className="text-[11px]">سناریوها</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap', hapticEnabled);
              onOpenTools();
            }}
            className="min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-[#151A26] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 font-bold cursor-pointer"
          >
            <Timer className="w-[18px] h-[18px] text-amber-600 dark:text-amber-300" />
            <span className="text-[11px]">ابزار</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap', hapticEnabled);
              onOpenGuide();
            }}
            className="min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-[#151A26] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 font-bold cursor-pointer"
          >
            <GraduationCap className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-300" />
            <span className="text-[11px]">راهنما</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap', hapticEnabled);
              onOpenCustomization();
            }}
            className="min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-[#151A26] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 font-bold cursor-pointer"
          >
            <SlidersHorizontal className="w-[18px] h-[18px] text-blue-600 dark:text-blue-300" />
            <span className="text-[11px]">شخصی‌سازی</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
