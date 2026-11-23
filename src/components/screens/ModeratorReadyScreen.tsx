import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, Play, Shuffle, Users } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { toPersianDigits } from '../../utils/persian';

interface ModeratorReadyScreenProps {
  scenarioName: string;
  tierLabel: string;
  playerCount: number;
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
  hapticEnabled = true,
  onStartReveal,
  onReshuffle,
  onOpenRules,
  onBackToSetup,
}) => {
  const [shuffleCount, setShuffleCount] = useState(0);

  const handleReshuffle = () => {
    triggerHaptic('tap', hapticEnabled);
    onReshuffle();
    setShuffleCount((c) => c + 1);
  };

  return (
    <div className="relative z-10 min-h-dvh flex flex-col justify-between bg-transparent px-4 py-5 sm:px-6 sm:py-8 transition-colors">
      <header className="w-full max-w-2xl mx-auto flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToSetup}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/18 bg-white dark:bg-[#161B28] hover:bg-slate-100 dark:hover:bg-white/10 px-4 py-2 min-h-[46px] text-sm font-bold text-slate-800 dark:text-white transition-colors cursor-pointer shadow-xs dark:shadow-none"
        >
          <ArrowRight className="w-5 h-5" />
          <span>بازگشت به تنظیمات</span>
        </button>

        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">مرحله آماده‌سازی گرداننده</span>
      </header>

      <main className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-center py-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl border border-slate-200 dark:border-white/14 bg-white dark:bg-[#121620] p-7 sm:p-10 text-center shadow-sm dark:shadow-none"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-amber-600 dark:text-amber-400" strokeWidth={1.9} />
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 tabular-nums">
            فقط گرداننده <span aria-hidden="true">·</span> {scenarioName} (سطح {tierLabel}) <span aria-hidden="true">·</span> {toPersianDigits(playerCount)} بازیکن
          </p>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white text-balance mb-4">
            آماده توزیع نقش‌ها هستی؟
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto mb-7">
            نقش‌ها به‌صورت کاملاً تصادفی چیده شدند. پس از فشردن دکمه شروع، گوشی را به نوبت به هر بازیکن بدهید تا نقش خود را ببیند و صفحه قفل شود.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleReshuffle}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 active:scale-[0.98] px-5 py-3 min-h-[50px] text-sm font-bold text-slate-900 dark:text-white transition-all cursor-pointer"
            >
              <Shuffle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>
                {shuffleCount > 0
                  ? `بُر زدن مجدد انجام شد (${toPersianDigits(shuffleCount)})`
                  : 'بُر زدن مجدد نقش‌ها'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenRules}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/35 bg-blue-500/12 dark:bg-blue-500/15 hover:bg-blue-500/20 dark:hover:bg-blue-500/25 px-5 py-3 min-h-[50px] text-sm font-bold text-blue-800 dark:text-blue-100 transition-all cursor-pointer"
            >
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-300" />
              <span>قوانین و ترتیب بیداری شب</span>
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="w-full max-w-2xl mx-auto pt-2 pb-safe">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('confirm', hapticEnabled);
            onStartReveal();
          }}
          className="w-full min-h-[62px] rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/15 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>شروع نمایش نقش‌ها به بازیکنان</span>
        </button>
      </footer>
    </div>
  );
};
