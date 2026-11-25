import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  GripVertical,
  Home,
  Layers,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Timer,
} from 'lucide-react';
import { Scenario } from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import { toPersianDigits } from '../../utils/persian';

interface ScenariosScreenProps {
  scenarios: Scenario[];
  hapticEnabled?: boolean;
  onBackHome: () => void;
  onCreateScenario: () => void;
  onEditScenario: (scenario: Scenario) => void;
  onStartGame: (scenario: Scenario) => void;
  onOpenRules: (scenario: Scenario) => void;
  onOpenImport: () => void;
  onRestoreLibrary: () => void;
  onReorderScenarios: (nextScenarios: Scenario[]) => void;
  onOpenTools: () => void;
  onOpenCustomization: () => void;
}

export const ScenariosScreen: React.FC<ScenariosScreenProps> = ({
  scenarios,
  hapticEnabled = true,
  onBackHome,
  onCreateScenario,
  onEditScenario,
  onStartGame,
  onOpenRules,
  onOpenImport,
  onRestoreLibrary,
  onReorderScenarios,
  onOpenTools,
  onOpenCustomization,
}) => {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleMoveByOffset = (index: number, delta: -1 | 1) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= scenarios.length) return;
    const next = [...scenarios];
    const [moved] = next.splice(index, 1);
    next.splice(nextIndex, 0, moved);
    triggerHaptic('tap', hapticEnabled);
    onReorderScenarios(next);
  };

  const handleDropOnScenario = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const fromIndex = scenarios.findIndex((s) => s.id === draggedId);
    const toIndex = scenarios.findIndex((s) => s.id === targetId);
    if (fromIndex !== -1 && toIndex !== -1) {
      const next = [...scenarios];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      triggerHaptic('confirm', hapticEnabled);
      onReorderScenarios(next);
    }
    setDraggedId(null);
    setDragOverId(null);
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

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {scenarios.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tap', hapticEnabled);
                  setIsReorderMode((prev) => !prev);
                  setDraggedId(null);
                  setDragOverId(null);
                }}
                aria-pressed={isReorderMode}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 min-h-[44px] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isReorderMode
                    ? 'border-amber-500 bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'border-slate-300 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100'
                }`}
              >
                {isReorderMode ? (
                  <>
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                    <span>اتمام</span>
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>چیدمان</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onOpenImport();
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-2 min-h-[44px] min-w-[44px] text-xs font-bold text-slate-800 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="درون‌ریزی سناریو"
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#C4161C] hover:bg-[#AD1217] dark:bg-amber-500 dark:hover:bg-amber-400 active:scale-[0.98] text-white dark:text-slate-950 font-extrabold text-xs sm:text-sm px-3 sm:px-4 py-2 min-h-[44px] transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-[18px] h-[18px]" strokeWidth={2.5} />
              <span>
                افزودن<span className="hidden sm:inline"> سناریو</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 flex-1">
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
            {scenarios.map((scenario, index) => {
              const isDragged = draggedId === scenario.id;
              const isDropTarget = dragOverId === scenario.id && draggedId !== scenario.id;
              return (
                <article
                  key={scenario.id}
                  draggable={isReorderMode}
                  onDragStart={(e) => {
                    if (!isReorderMode) return;
                    setDraggedId(scenario.id);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', scenario.id);
                  }}
                  onDragOver={(e) => {
                    if (!isReorderMode || !draggedId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverId !== scenario.id) {
                      setDragOverId(scenario.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverId === scenario.id) {
                      setDragOverId(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (!isReorderMode) return;
                    e.preventDefault();
                    handleDropOnScenario(scenario.id);
                  }}
                  onDragEnd={() => {
                    setDraggedId(null);
                    setDragOverId(null);
                  }}
                  className={`rounded-2xl border bg-white dark:bg-[#121620] p-3 sm:p-3.5 shadow-sm dark:shadow-none transition-all ${
                    isDropTarget
                      ? 'border-amber-500 ring-2 ring-amber-500/35 scale-[1.01]'
                      : isReorderMode
                        ? 'border-amber-500/40 dark:border-amber-400/30 cursor-grab active:cursor-grabbing'
                        : 'border-slate-200 dark:border-white/14'
                  } ${isDragged ? 'opacity-50' : 'opacity-100'}`}
                >
                  {isReorderMode ? (
                    <div className="flex items-center gap-2 min-h-[56px]">
                      <div className="flex items-center gap-1.5 shrink-0 text-slate-400 dark:text-slate-500">
                        <GripVertical className="w-5 h-5" />
                        <span className="w-5 text-center text-xs font-extrabold tabular-nums text-amber-600 dark:text-amber-400">
                          {toPersianDigits(index + 1)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0 text-right">
                        <span className="block font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug truncate">
                          {scenario.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveByOffset(index, -1)}
                          aria-label={`انتقال ${scenario.name} به جایگاه بالاتر`}
                          className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-white/14 bg-slate-100 dark:bg-[#171D2B] text-slate-800 dark:text-slate-100 hover:bg-amber-500/15 hover:border-amber-500/40 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === scenarios.length - 1}
                          onClick={() => handleMoveByOffset(index, 1)}
                          aria-label={`انتقال ${scenario.name} به جایگاه پایین‌تر`}
                          className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-white/14 bg-slate-100 dark:bg-[#171D2B] text-slate-800 dark:text-slate-100 hover:bg-amber-500/15 hover:border-amber-500/40 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-stretch gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('confirm', hapticEnabled);
                          onStartGame(scenario);
                        }}
                        className="flex-1 min-w-0 min-h-[56px] px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-start gap-2.5 transition-all cursor-pointer shadow-sm text-right"
                      >
                        <Play className="w-5 h-5 fill-slate-950 shrink-0" />
                        <span className="leading-snug">{scenario.name}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', hapticEnabled);
                          onOpenRules(scenario);
                        }}
                        className="min-w-[56px] min-h-[56px] px-2.5 py-2 flex flex-col items-center justify-center gap-1 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-200 transition-colors cursor-pointer shrink-0"
                        aria-label={`قوانین و راهنمای ${scenario.name}`}
                      >
                        <BookOpen className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-300" />
                        <span className="text-[11px] font-bold leading-none">قوانین</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', hapticEnabled);
                          onEditScenario(scenario);
                        }}
                        className="min-w-[56px] min-h-[56px] px-2.5 py-2 flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-white/14 bg-slate-100 dark:bg-[#171D2B] text-slate-700 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                        aria-label={`ویرایش سناریو ${scenario.name}`}
                      >
                        <Pencil className="w-4 h-4 shrink-0" />
                        <span className="text-[11px] font-bold leading-none">ویرایش</span>
                      </button>
                    </div>
                  )}
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
    </div>
  );
};
