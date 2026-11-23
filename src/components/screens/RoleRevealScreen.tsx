import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, EyeOff, Fingerprint, ShieldCheck, Timer, X } from 'lucide-react';
import { useWakeLock } from '../../hooks/useWakeLock';
import { AppPreferences, AssignedPlayerRole, RevealMode } from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import { getReadableRoleColor, getRoleTeamLabel, hexToRgba, inferRoleTeam, toPersianDigits } from '../../utils/persian';
import { playRevealCue, unlockAudioContext } from '../../utils/soundEngine';
import { RoleIcon } from '../RoleIcon';

interface RoleRevealScreenProps {
  deck: AssignedPlayerRole[];
  scenarioName: string;
  tierLabel: string;
  revealMode: RevealMode;
  preferences: AppPreferences;
  onComplete: () => void;
  onAbortGame: () => void;
}

const HOLD_EXIT_DURATION_MS = 1200;

export const RoleRevealScreen: React.FC<RoleRevealScreenProps> = ({
  deck,
  scenarioName,
  tierLabel,
  revealMode,
  preferences,
  onComplete,
  onAbortGame,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLockedTransition, setIsLockedTransition] = useState(false);
  const [autoHideRemaining, setAutoHideRemaining] = useState<number>(0);

  const [holdAbortProgress, setHoldAbortProgress] = useState(0);
  const holdAbortTimerRef = useRef<number | null>(null);
  const holdAbortStartRef = useRef<number>(0);

  const [holdRevealProgress, setHoldRevealProgress] = useState(0);
  const holdRevealTimerRef = useRef<number | null>(null);
  const holdRevealStartRef = useRef<number>(0);

  const totalPlayers = deck.length;
  const currentAssignment = deck[currentIndex];
  const isLastPlayer = currentIndex >= totalPlayers - 1;
  const holdDurationMs = Math.max(300, preferences.holdRevealMs || 650);

  // Prevent screen from sleeping while passing phone around the table
  useWakeLock(true);

  useEffect(() => {
    return () => {
      if (holdAbortTimerRef.current !== null) {
        window.cancelAnimationFrame(holdAbortTimerRef.current);
      }
      if (holdRevealTimerRef.current !== null) {
        window.cancelAnimationFrame(holdRevealTimerRef.current);
      }
    };
  }, []);

  const handleConfirmNext = () => {
    if (!isRevealed || isLockedTransition) return;
    triggerHaptic('confirm', preferences.hapticFeedbackEnabled);
    setIsLockedTransition(true);
    setIsRevealed(false);

    window.setTimeout(() => {
      if (isLastPlayer) {
        onComplete();
      } else {
        setCurrentIndex((prev) => prev + 1);
        setIsLockedTransition(false);
      }
    }, 260);
  };

  // Deterministic Auto-Hide Role Countdown when player leaves screen open
  useEffect(() => {
    const limit = preferences.autoHideAfterSeconds;
    if (!isRevealed || limit <= 0) {
      setAutoHideRemaining(0);
      return;
    }

    setAutoHideRemaining(limit);
    let left = limit;
    const interval = window.setInterval(() => {
      left -= 1;
      setAutoHideRemaining(Math.max(0, left));
      if (left <= 0) {
        window.clearInterval(interval);
        setIsLockedTransition(true);
        setIsRevealed(false);
        window.setTimeout(() => {
          if (currentIndex >= totalPlayers - 1) {
            onComplete();
          } else {
            setCurrentIndex((prev) => prev + 1);
            setIsLockedTransition(false);
          }
        }, 260);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRevealed, currentIndex, totalPlayers, preferences.autoHideAfterSeconds, onComplete]);

  const startHoldAbort = () => {
    holdAbortStartRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - holdAbortStartRef.current;
      const ratio = Math.min(1, elapsed / HOLD_EXIT_DURATION_MS);
      setHoldAbortProgress(ratio);
      if (ratio >= 1) {
        holdAbortTimerRef.current = null;
        triggerHaptic('warning', preferences.hapticFeedbackEnabled);
        onAbortGame();
        return;
      }
      holdAbortTimerRef.current = window.requestAnimationFrame(tick);
    };
    holdAbortTimerRef.current = window.requestAnimationFrame(tick);
  };

  const cancelHoldAbort = () => {
    if (holdAbortTimerRef.current !== null) {
      window.cancelAnimationFrame(holdAbortTimerRef.current);
      holdAbortTimerRef.current = null;
    }
    setHoldAbortProgress(0);
  };

  const triggerReveal = () => {
    if (isRevealed || isLockedTransition) return;
    unlockAudioContext();
    playRevealCue(preferences.revealSoundId);
    triggerHaptic('roleReveal', preferences.hapticFeedbackEnabled);
    setHoldRevealProgress(0);
    setIsRevealed(true);
  };

  const handleTapToReveal = () => {
    if (revealMode === 'hold') return;
    triggerReveal();
  };

  const startHoldReveal = () => {
    unlockAudioContext();
    if (revealMode !== 'hold' || isRevealed || isLockedTransition) return;
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    holdRevealStartRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - holdRevealStartRef.current;
      const ratio = Math.min(1, elapsed / holdDurationMs);
      setHoldRevealProgress(ratio);
      if (ratio >= 1) {
        holdRevealTimerRef.current = null;
        triggerReveal();
        return;
      }
      holdRevealTimerRef.current = window.requestAnimationFrame(tick);
    };
    holdRevealTimerRef.current = window.requestAnimationFrame(tick);
  };

  const cancelHoldReveal = () => {
    if (holdRevealTimerRef.current !== null) {
      window.cancelAnimationFrame(holdRevealTimerRef.current);
      holdRevealTimerRef.current = null;
    }
    setHoldRevealProgress(0);
  };

  if (!currentAssignment) {
    return null;
  }

  const { role, playerName, playerNumber } = currentAssignment;
  const isDark = preferences.themeMode !== 'light';
  const readableColor = getReadableRoleColor(role.color, isDark);
  const displayName = playerName || `بازیکن ${toPersianDigits(playerNumber)}`;
  const glowStrong = hexToRgba(role.color, isDark ? 0.34 : 0.2);
  const glowSoft = hexToRgba(role.color, isDark ? 0.15 : 0.14);
  const borderTint = hexToRgba(readableColor, 0.45);
  const teamLabel = getRoleTeamLabel(inferRoleTeam(role));

  return (
    <div className="min-h-dvh flex flex-col justify-between bg-[#F4F5F7] dark:bg-[#090B10] px-4 py-5 sm:px-6 sm:py-8 select-none transition-colors">
      {/* Top quiet header */}
      <header className="w-full max-w-xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 tabular-nums min-w-0">
          <span className="font-semibold text-slate-900 dark:text-slate-200 whitespace-nowrap">
            نفر {toPersianDigits(currentIndex + 1)} از {toPersianDigits(totalPlayers)}
          </span>
          <span aria-hidden="true" className="text-slate-400 dark:text-slate-600">·</span>
          <span className="truncate text-slate-600 dark:text-slate-400">
            {scenarioName} ({tierLabel})
          </span>
        </div>

        <button
          type="button"
          onPointerDown={startHoldAbort}
          onPointerUp={cancelHoldAbort}
          onPointerLeave={cancelHoldAbort}
          onPointerCancel={cancelHoldAbort}
          className="relative overflow-hidden inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] px-3 py-2 min-h-[44px] text-xs font-medium text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="برای لغو توزیع، ۱.۲ ثانیه نگه دارید"
        >
          <span
            className="absolute inset-y-0 right-0 bg-red-500/25 pointer-events-none transition-none"
            style={{ width: `${Math.round(holdAbortProgress * 100)}%` }}
          />
          <X className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">
            {holdAbortProgress > 0 ? 'در حال لغو...' : 'نگه‌دارید برای خروج'}
          </span>
        </button>
      </header>

      {/* Main Focal Stage */}
      <main className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center py-6">
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.button
              key={`hidden-${currentIndex}`}
              type="button"
              onClick={handleTapToReveal}
              onPointerDown={startHoldReveal}
              onPointerUp={cancelHoldReveal}
              onPointerLeave={cancelHoldReveal}
              onPointerCancel={cancelHoldReveal}
              disabled={isLockedTransition}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden group w-full min-h-[380px] sm:min-h-[430px] rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111520] p-8 flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.98] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 shadow-sm dark:shadow-none"
            >
              {revealMode === 'hold' && holdRevealProgress > 0 && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-amber-500/12 pointer-events-none origin-bottom transition-none"
                  style={{ transform: `scaleY(${holdRevealProgress})` }}
                />
              )}

              <div className="relative mb-6 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border border-amber-500/30 bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/15 transition-colors">
                  {revealMode === 'hold' ? (
                    <ShieldCheck className="w-11 h-11 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                  ) : (
                    <Fingerprint className="w-11 h-11 text-amber-600 dark:text-amber-400" strokeWidth={1.75} />
                  )}
                </div>
              </div>

              <div className="relative z-10 text-sm font-bold text-amber-700 dark:text-amber-300 mb-2 tabular-nums">
                نوبت «{displayName}»
              </div>

              <h1
                className={`relative z-10 font-extrabold text-slate-900 dark:text-slate-100 leading-snug text-balance mb-4 ${
                  preferences.largeRevealFont ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                }`}
              >
                {revealMode === 'hold'
                  ? 'انگشتت را نگه دار تا نقشت دیده شود'
                  : 'صفحه را لمس کن'}
              </h1>

              <p className="relative z-10 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xs leading-relaxed">
                {revealMode === 'hold'
                  ? `مطمئن شو کسی صفحه را نمی‌بیند؛ حدود ${toPersianDigits((holdDurationMs / 1000).toFixed(1))} ثانیه نگه دار.`
                  : 'مطمئن شو کسی به صفحه نگاه نمی‌کند، سپس برای دیدن نقشت یک بار لمس کن.'}
              </p>

              <div className="relative z-10 mt-8 inline-flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400/90">
                <EyeOff className="w-4 h-4" />
                <span>
                  {revealMode === 'hold' ? 'حالت امن: نگه‌داشتن انگشت' : 'نمایش محرمانه تک‌نفره'}
                </span>
              </div>
            </motion.button>
          ) : (
            <motion.div
              key={`revealed-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.86 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full min-h-[380px] sm:min-h-[430px] rounded-3xl bg-white dark:bg-[#121620] p-7 sm:p-10 flex flex-col items-center justify-center text-center overflow-hidden"
              style={{
                border: `1.5px solid ${borderTint}`,
                boxShadow: isDark
                  ? `0 0 64px -12px ${glowStrong}, inset 0 1px 0 0 rgba(255,255,255,0.06)`
                  : `0 18px 48px -18px ${glowStrong}`,
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 50% 38%, ${glowSoft} 0%, transparent 68%)`,
                }}
              />

              {preferences.autoHideAfterSeconds > 0 && autoHideRemaining > 0 && (
                <div className="relative z-10 mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                  <Timer className="w-3.5 h-3.5" />
                  <span>قفل خودکار تا {toPersianDigits(autoHideRemaining)} ثانیه</span>
                </div>
              )}

              <motion.div
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.06, duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-22 h-22 rounded-2xl flex items-center justify-center mb-6"
                style={{
                  backgroundColor: glowSoft,
                  border: `1px solid ${borderTint}`,
                  boxShadow: `0 0 32px ${glowSoft}`,
                }}
              >
                <RoleIcon
                  name={role.icon}
                  className="w-11 h-11"
                  style={{ color: readableColor }}
                  strokeWidth={1.9}
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.2 }}
                className="relative z-10 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2 tabular-nums"
              >
                {displayName === `بازیکن ${toPersianDigits(playerNumber)}`
                  ? `نقش صندلی ${toPersianDigits(playerNumber)}`
                  : `نقش «${displayName}» (صندلی ${toPersianDigits(playerNumber)})`}
                {preferences.showRoleTeamBadgeOnReveal && ` · جبهه ${teamLabel}`}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                className={`relative z-10 font-extrabold tracking-tight text-balance mb-5 ${
                  preferences.largeRevealFont
                    ? 'text-4xl sm:text-5xl'
                    : 'text-3xl sm:text-4xl'
                }`}
                style={{
                  color: readableColor,
                  textShadow: isDark ? `0 0 28px ${glowStrong}` : 'none',
                }}
              >
                {role.name}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.26 }}
                className={`relative z-10 text-slate-700 dark:text-slate-200 leading-relaxed max-w-md ${
                  preferences.largeRevealFont ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                }`}
              >
                {role.description || 'توضیحی برای این نقش ثبت نشده است.'}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Thumb-Zone Bottom Confirmation CTA */}
      <footer className="w-full max-w-xl mx-auto pt-2 pb-safe">
        {isRevealed ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleConfirmNext}
            disabled={isLockedTransition}
            className="w-full min-h-[60px] rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-amber-500/15 transition-all cursor-pointer"
          >
            <Check className="w-6 h-6" strokeWidth={2.5} />
            <span>متوجه شدم / نفر بعدی</span>
          </motion.button>
        ) : (
          <div className="min-h-[60px] flex items-center justify-center text-xs text-slate-500">
            پس از تایید هر نفر، امکان بازگشت به نقش قبلی وجود ندارد
          </div>
        )}
      </footer>
    </div>
  );
};
