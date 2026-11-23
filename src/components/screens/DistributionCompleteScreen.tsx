import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, CheckCircle2, Eye, EyeOff, Home, RotateCcw, Timer } from 'lucide-react';
import { ActiveGameSession } from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import { getReadableRoleColor, hexToRgba, toPersianDigits } from '../../utils/persian';
import { RoleIcon } from '../RoleIcon';

interface DistributionCompleteScreenProps {
  session: ActiveGameSession;
  hapticEnabled?: boolean;
  isDark?: boolean;
  onGoHome: () => void;
  onReplaySameSetup: () => void;
  onOpenRules: () => void;
  onOpenTools: () => void;
}

const HOLD_REVEAL_MS = 1200;

export const DistributionCompleteScreen: React.FC<DistributionCompleteScreenProps> = ({
  session,
  hapticEnabled = true,
  isDark = true,
  onGoHome,
  onReplaySameSetup,
  onOpenRules,
  onOpenTools,
}) => {
  const [showModeratorList, setShowModeratorList] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const handleHoldStart = () => {
    if (showModeratorList) {
      triggerHaptic('tap', hapticEnabled);
      setShowModeratorList(false);
      return;
    }
    triggerHaptic('tap', hapticEnabled);
    startRef.current = performance.now();
    const step = (now: number) => {
      const ratio = Math.min(1, (now - startRef.current) / HOLD_REVEAL_MS);
      setHoldProgress(ratio);
      if (ratio >= 1) {
        rafRef.current = null;
        setHoldProgress(0);
        triggerHaptic('roleReveal', hapticEnabled);
        setShowModeratorList(true);
        return;
      }
      rafRef.current = window.requestAnimationFrame(step);
    };
    rafRef.current = window.requestAnimationFrame(step);
  };

  const handleHoldCancel = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setHoldProgress(0);
  };

  return (
    <div className="relative z-10 min-h-dvh flex flex-col justify-between bg-transparent px-4 py-6 sm:px-6 sm:py-10 transition-colors">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] p-7 sm:p-10 text-center shadow-sm dark:shadow-none"
        >
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/12 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 text-balance mb-3">
            همه نقش‌ها با موفقیت توزیع شد
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto mb-6 tabular-nums">
            سناریو {session.scenarioName} (سطح {session.tierLabel}) · {toPersianDigits(session.playerCount)} بازیکن آماده شروع شب اول هستند.
          </p>

          <div className="pt-4 border-t border-slate-200 dark:border-white/8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onPointerDown={handleHoldStart}
              onPointerUp={handleHoldCancel}
              onPointerLeave={handleHoldCancel}
              onPointerCancel={handleHoldCancel}
              className="relative overflow-hidden w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-5 py-3 min-h-[48px] text-sm font-medium text-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <span
                className="absolute inset-y-0 right-0 bg-amber-500/20 pointer-events-none"
                style={{ width: `${Math.round(holdProgress * 100)}%` }}
              />
              {showModeratorList ? (
                <>
                  <EyeOff className="w-4 h-4 relative z-10 text-amber-600 dark:text-amber-400" />
                  <span className="relative z-10">مخفی کردن لیست گرداننده</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 relative z-10 text-amber-600 dark:text-amber-400" />
                  <span className="relative z-10">
                    {holdProgress > 0
                      ? 'در حال باز کردن لیست...'
                      : 'نگه‌دارید: لیست نقش‌ها (فقط گرداننده)'}
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenRules}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-5 py-3 min-h-[48px] text-sm font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>راهنمای ترتیب بیداری شب</span>
            </button>
          </div>

          {showModeratorList && (
            <div className="mt-5 text-right rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0C0F17] p-4 max-h-[280px] overflow-y-auto space-y-2">
              {session.deck.map((item) => {
                const readableColor = getReadableRoleColor(item.role.color, isDark);
                return (
                  <div
                    key={item.playerNumber}
                    className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5"
                  >
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-300 tabular-nums truncate">
                      {toPersianDigits(item.playerNumber)}. {item.playerName || `بازیکن ${toPersianDigits(item.playerNumber)}`}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-lg shrink-0"
                      style={{
                        color: readableColor,
                        backgroundColor: hexToRgba(item.role.color, isDark ? 0.12 : 0.15),
                      }}
                    >
                      <RoleIcon name={item.role.icon} className="w-3.5 h-3.5" style={{ color: readableColor }} />
                      <span>{item.role.name}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <footer className="w-full max-w-2xl mx-auto pt-4 pb-safe flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('confirm', hapticEnabled);
            onOpenTools();
          }}
          className="w-full min-h-[58px] rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/15"
        >
          <Timer className="w-5 h-5" />
          <span>ورود به کنسول گرداننده (مدیریت شب، دادگاه و تایمر)</span>
        </button>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap', hapticEnabled);
              onGoHome();
            }}
            className="flex-1 min-h-[52px] rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#121620] hover:bg-slate-100 dark:hover:bg-[#181D2B] active:scale-[0.98] text-slate-900 dark:text-slate-100 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs dark:shadow-none"
          >
            <Home className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>بازگشت به صفحه اصلی</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('confirm', hapticEnabled);
              onReplaySameSetup();
            }}
            className="flex-1 min-h-[52px] px-6 rounded-2xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#121620] hover:bg-slate-100 dark:hover:bg-[#181D2B] active:scale-[0.98] text-slate-900 dark:text-slate-100 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs dark:shadow-none"
          >
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>توزیع مجدد همین سناریو</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
