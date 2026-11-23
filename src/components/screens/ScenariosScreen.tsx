import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Copy,
  Download,
  Home,
  Layers,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Share2,
  SlidersHorizontal,
  Timer,
  Trash2,
} from 'lucide-react';
import { Scenario } from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';

interface ScenariosScreenProps {
  scenarios: Scenario[];
  hapticEnabled?: boolean;
  onBackHome: () => void;
  onCreateScenario: () => void;
  onEditScenario: (scenario: Scenario) => void;
  onDuplicateScenario: (scenario: Scenario) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onStartGame: (scenario: Scenario) => void;
  onOpenRules: (scenario: Scenario) => void;
  onShareScenario: (scenario: Scenario) => void;
  onOpenImport: () => void;
  onRestoreLibrary: () => void;
  onOpenTools: () => void;
  onOpenCustomization: () => void;
}

export const ScenariosScreen: React.FC<ScenariosScreenProps> = ({
  scenarios,
  hapticEnabled = true,
  onBackHome,
  onCreateScenario,
  onEditScenario,
  onDuplicateScenario,
  onDeleteScenario,
  onStartGame,
  onOpenRules,
  onShareScenario,
  onOpenImport,
  onRestoreLibrary,
  onOpenTools,
  onOpenCustomization,
}) => {
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<Scenario | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);

  const handleConfirmDelete = () => {
    if (!confirmDeleteTarget) return;
    triggerHaptic('warning', hapticEnabled);
    onDeleteScenario(confirmDeleteTarget.id);
    setConfirmDeleteTarget(null);
  };

  const handleDuplicate = (scenario: Scenario) => {
    triggerHaptic('confirm', hapticEnabled);
    onDuplicateScenario(scenario);
    setDuplicateNotice(`یک نسخه کپی از «${scenario.name}» ساخته شد.`);
    window.setTimeout(() => {
      setDuplicateNotice((prev) =>
        prev === `یک نسخه کپی از «${scenario.name}» ساخته شد.` ? null : prev
      );
    }, 2600);
  };

  return (
    <div className="relative z-10 min-h-dvh flex flex-col bg-transparent text-slate-900 dark:text-slate-100 pb-24 sm:pb-12 transition-colors">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 h-14 bg-white/85 dark:bg-[#090B10]/85 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-3 sm:px-6">
        <div className="w-full max-w-6xl mx-auto h-full flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onBackHome();
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-[#161B28] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="بازگشت به خانه"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
              سناریوها
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenImport();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-2 min-h-[44px] text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">درون‌ریزی</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('confirm', hapticEnabled);
                onCreateScenario();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#C4161C] hover:bg-[#AD1217] dark:bg-amber-500 dark:hover:bg-amber-400 active:scale-[0.98] text-white dark:text-slate-950 font-extrabold text-xs sm:text-sm px-3.5 sm:px-4 py-2 min-h-[44px] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
              <span>افزودن سناریو</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 flex-1">
        <section className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white text-balance">
            انتخاب سناریو برای شروع بازی
          </h2>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap', hapticEnabled);
              onRestoreLibrary();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#C4161C] dark:hover:text-amber-300 transition-colors min-h-[40px] cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازیابی کتابخانه استاندارد</span>
          </button>
        </section>

        {duplicateNotice && (
          <div className="mb-4 rounded-2xl border border-emerald-500/35 bg-emerald-500/12 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200">
            {duplicateNotice}
          </div>
        )}

        {scenarios.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/15 bg-white dark:bg-[#121620] p-10 text-center max-w-lg mx-auto my-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
              سناریویی ثبت نشده است
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              یک سناریو جدید اضافه کنید یا سناریوهای استاندارد کتابخانه را بازیابی نمایید.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('confirm', hapticEnabled);
                  onCreateScenario();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C4161C] hover:bg-[#AD1217] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-extrabold text-sm px-6 py-3.5 min-h-[48px] cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>افزودن سناریو</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', hapticEnabled);
                  onRestoreLibrary();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 font-semibold text-sm px-5 py-3.5 min-h-[48px] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>بازیابی کتابخانه</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => {
              return (
                <article
                  key={scenario.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/14 bg-white dark:bg-[#121620] p-4 flex flex-col justify-between gap-3 shadow-sm dark:shadow-none"
                >
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('confirm', hapticEnabled);
                      onStartGame(scenario);
                    }}
                    className="w-full min-h-[56px] px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Play className="w-5 h-5 fill-slate-950 shrink-0" />
                    <span className="leading-snug text-center">{scenario.name}</span>
                  </button>

                  <div className="grid grid-cols-5 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', hapticEnabled);
                        onShareScenario(scenario);
                      }}
                      className="min-h-[48px] px-1 py-2 flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/14 bg-slate-100 dark:bg-[#171D2B] text-slate-700 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label={`اشتراک‌گذاری سناریو ${scenario.name}`}
                    >
                      <Share2 className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] font-bold leading-none">اشتراک</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDuplicate(scenario)}
                      className="min-h-[48px] px-1 py-2 flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/14 bg-slate-100 dark:bg-[#171D2B] text-slate-700 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label={`ساخت کپی از سناریو ${scenario.name}`}
                    >
                      <Copy className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] font-bold leading-none">کپی</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', hapticEnabled);
                        onEditScenario(scenario);
                      }}
                      className="min-h-[48px] px-1 py-2 flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/14 bg-slate-100 dark:bg-[#171D2B] text-slate-700 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      aria-label={`ویرایش سناریو ${scenario.name}`}
                    >
                      <Pencil className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] font-bold leading-none">ویرایش</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', hapticEnabled);
                        onOpenRules(scenario);
                      }}
                      className="min-h-[48px] px-1 py-2 flex flex-col items-center justify-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-200 transition-colors cursor-pointer"
                      aria-label={`قوانین و راهنمای ${scenario.name}`}
                    >
                      <BookOpen className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-300" />
                      <span className="text-[11px] font-bold leading-none">قوانین</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', hapticEnabled);
                        setConfirmDeleteTarget(scenario);
                      }}
                      className="min-h-[48px] px-1 py-2 flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/14 bg-slate-100 dark:bg-[#171D2B] text-slate-700 dark:text-slate-100 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/15 transition-colors cursor-pointer"
                      aria-label={`حذف سناریو ${scenario.name}`}
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] font-bold leading-none">حذف</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="منوی اصلی موبایل"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 dark:border-white/16 bg-white/95 dark:bg-[#0E121B]/96 backdrop-blur-md px-2 pt-1.5 pb-safe"
      >
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap', hapticEnabled);
              onBackHome();
            }}
            className="min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-[#151A26] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 font-bold cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">خانه</span>
          </button>

          <button
            type="button"
            onClick={() => triggerHaptic('tap', hapticEnabled)}
            className="min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-[#C4161C] dark:text-amber-300 bg-red-500/10 dark:bg-amber-500/18 border border-red-500/30 dark:border-amber-400/35 font-extrabold cursor-pointer"
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs">سناریوها</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap', hapticEnabled);
              onOpenTools();
            }}
            className="min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-[#151A26] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 font-bold cursor-pointer"
          >
            <Timer className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            <span className="text-xs">ابزار</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap', hapticEnabled);
              onOpenCustomization();
            }}
            className="min-h-[54px] rounded-xl flex flex-col items-center justify-center gap-1 text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-[#151A26] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 font-bold cursor-pointer"
          >
            <SlidersHorizontal className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
            <span className="text-xs">شخصی‌سازی</span>
          </button>
        </div>
      </nav>

      {/* Delete Confirmation Modal */}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">حذف سناریو</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              آیا از حذف سناریو «{confirmDeleteTarget.name}» مطمئن هستید؟ این کار قابل بازگشت نیست.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 min-h-[48px] rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm cursor-pointer"
              >
                بله، حذف شود
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteTarget(null)}
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
