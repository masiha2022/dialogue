import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, EyeOff, Fingerprint, ShieldCheck, Timer, X } from 'lucide-react';
import { useWakeLock } from '../../hooks/useWakeLock';
import {
  AppPreferences,
  AssignedPlayerRole,
  RevealMode,
  ScenarioVisualThemeId,
} from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import {
  getReadableRoleColor,
  getRoleTeamLabel,
  hexToRgba,
  inferRoleTeam,
  toPersianDigits,
} from '../../utils/persian';
import {
  getScenarioStageBackground,
  getThemePatternBackground,
  getThemePatternSize,
  resolveScenarioVisualTheme,
} from '../../utils/scenarioTheme';
import { unlockAudioContext } from '../../utils/soundEngine';
import { RoleIcon } from '../RoleIcon';

interface RoleRevealScreenProps {
  deck: AssignedPlayerRole[];
  scenarioName: string;
  tierLabel: string;
  visualTheme?: ScenarioVisualThemeId;
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
  visualTheme,
  revealMode,
  preferences,
  onComplete,
  onAbortGame,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
  const [autoHideRemaining, setAutoHideRemaining] = useState<number>(0);

  const [holdAbortProgress, setHoldAbortProgress] = useState(0);
  const holdAbortTimerRef = useRef<number | null>(null);
  const holdAbortStartRef = useRef<number>(0);

  const [holdRevealProgress, setHoldRevealProgress] = useState(0);
  const holdRevealTimerRef = useRef<number | null>(null);
  const holdRevealStartRef = useRef<number>(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const totalPlayers = deck.length;
  const currentAssignment = deck[currentIndex];
  const isRevealed = revealedIndex === currentIndex;
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

  const advanceToNextPlayer = () => {
    if (currentIndex >= totalPlayers - 1) {
      onCompleteRef.current();
    } else {
      setRevealedIndex(null);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleConfirmNext = () => {
    if (!isRevealed) return;
    triggerHaptic('confirm', preferences.hapticFeedbackEnabled);
    advanceToNextPlayer();
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
        if (currentIndex >= totalPlayers - 1) {
          onCompleteRef.current();
        } else {
          setRevealedIndex(null);
          setCurrentIndex((prev) => prev + 1);
        }
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRevealed, currentIndex, totalPlayers, preferences.autoHideAfterSeconds]);

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
    if (isRevealed) return;
    unlockAudioContext();
    triggerHaptic('roleReveal', preferences.hapticFeedbackEnabled);
    setHoldRevealProgress(0);
    setRevealedIndex(currentIndex);
  };

  const handleTapToReveal = () => {
    if (revealMode === 'hold') return;
    triggerReveal();
  };

  const startHoldReveal = () => {
    unlockAudioContext();
    if (revealMode !== 'hold' || isRevealed) return;
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
  const themeConfig = resolveScenarioVisualTheme(visualTheme, scenarioName);
  const themeAccent = isDark ? themeConfig.accentHex : themeConfig.lightAccentHex;
  const themeBorderTint = hexToRgba(themeAccent, isDark ? 0.45 : 0.38);
  const themeGlowStrong = hexToRgba(themeConfig.accentHex, isDark ? 0.36 : 0.24);
  const themeGlowSoft = hexToRgba(themeConfig.accentHex, isDark ? 0.2 : 0.14);
  const stageBackground = getScenarioStageBackground(themeConfig, isDark);
  const cardBackground = isDark ? themeConfig.darkCardBg : themeConfig.lightCardBg;
  const patternBackground = getThemePatternBackground(themeConfig, isDark);
  const patternSize = getThemePatternSize(themeConfig.pattern);

  const readableColor = getReadableRoleColor(role.color, isDark);
  const displayName = playerName || `بازیکن ${toPersianDigits(playerNumber)}`;
  const glowStrong = hexToRgba(role.color, isDark ? 0.36 : 0.22);
  const glowSoft = hexToRgba(role.color, isDark ? 0.18 : 0.14);
  const borderTint = hexToRgba(readableColor, 0.52);
  const teamLabel = getRoleTeamLabel(inferRoleTeam(role));

  return (
    <div
      className="min-h-dvh flex flex-col px-4 pt-safe-page py-5 pb-safe sm:px-6 sm:py-8 select-none transition-colors"
      style={{ background: stageBackground }}
    >
      {/* Top quiet header */}
      <header className="w-full max-w-xl mx-auto flex items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 tabular-nums min-w-0">
          <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
            نفر {toPersianDigits(currentIndex + 1)} از {toPersianDigits(totalPlayers)}
          </span>
          <span aria-hidden="true" className="text-slate-400 dark:text-slate-500">·</span>
          <span className="font-medium leading-snug" style={{ color: themeAccent }}>
            {scenarioName} ({tierLabel})
          </span>
        </div>

        <button
          type="button"
          onPointerDown={startHoldAbort}
          onPointerUp={cancelHoldAbort}
          onPointerLeave={cancelHoldAbort}
          onPointerCancel={cancelHoldAbort}
          className="relative overflow-hidden inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white/85 dark:bg-black/35 backdrop-blur-sm px-3 py-2 min-h-[44px] text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title="برای لغو توزیع، ۱.۲ ثانیه نگه دارید"
        >
          <span
            className="absolute inset-y-0 right-0 bg-red-500/25 pointer-events-none transition-none"
            style={{ width: `${Math.round(holdAbortProgress * 100)}%` }}
          />
          <X className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">
            {holdAbortProgress > 0 ? 'در حال لغو...' : 'لغو (نگه‌دارید)'}
          </span>
        </button>
      </header>

      {/* Main Focal Stage: 3D Flip on Reveal + Fade Out/In on Next Player */}
      <main className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center gap-3.5 sm:gap-4 py-4">
        <div style={{ perspective: '1200px' }} className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={`card-slot-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <motion.div
                initial={false}
                animate={{ rotateY: isRevealed ? 180 : 0 }}
                transition={{
                  duration: 0.56,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformStyle: 'preserve-3d' }}
                className="grid w-full"
              >
                {/* Card Front (Face-down Cover) */}
                <button
                  type="button"
                  onClick={handleTapToReveal}
                  onPointerDown={startHoldReveal}
                  onPointerUp={cancelHoldReveal}
                  onPointerLeave={cancelHoldReveal}
                  onPointerCancel={cancelHoldReveal}
                  disabled={isRevealed}
                  tabIndex={isRevealed ? -1 : 0}
                  aria-hidden={isRevealed}
                  className="col-start-1 row-start-1 relative overflow-hidden group w-full min-h-[370px] sm:min-h-[420px] rounded-3xl p-7 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.985] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                    pointerEvents: isRevealed ? 'none' : 'auto',
                    background: cardBackground,
                    border: `2px solid ${themeBorderTint}`,
                    boxShadow: isDark
                      ? `0 24px 64px -18px ${themeGlowStrong}, inset 0 1px 0 0 rgba(255,255,255,0.1)`
                      : `0 20px 50px -18px ${themeGlowStrong}`,
                  }}
                >
                  {/* Theme texture overlay */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: patternBackground,
                      backgroundSize: patternSize,
                    }}
                  />

                  {/* Ornamental double border & corner accents */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-3 rounded-2xl border"
                    style={{ borderColor: hexToRgba(themeAccent, isDark ? 0.34 : 0.28) }}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-4.5 rounded-xl border border-dashed"
                    style={{ borderColor: hexToRgba(themeConfig.secondaryHex, isDark ? 0.3 : 0.22) }}
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 50% 44%, ${themeGlowSoft} 0%, transparent 66%)`,
                    }}
                  />

                  {revealMode === 'hold' && holdRevealProgress > 0 && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none origin-bottom transition-none"
                      style={{
                        backgroundColor: hexToRgba(themeConfig.accentHex, 0.18),
                        transform: `scaleY(${holdRevealProgress})`,
                      }}
                    />
                  )}

                  <div
                    className="relative z-10 text-sm font-extrabold mb-2 tabular-nums"
                    style={{ color: themeAccent }}
                  >
                    نوبت «{displayName}»
                  </div>

                  <h1
                    className={`relative z-10 font-extrabold text-slate-900 dark:text-white leading-snug text-balance mb-5 ${
                      preferences.largeRevealFont ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
                    }`}
                  >
                    {revealMode === 'hold'
                      ? 'انگشتت را نگه دار تا نقشت دیده شود'
                      : 'صفحه را لمس کن'}
                  </h1>

                  <div className="relative z-10 mb-5 flex items-center justify-center">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        background: `radial-gradient(circle, ${themeGlowSoft} 0%, ${hexToRgba(themeConfig.secondaryHex, 0.14)} 100%)`,
                        border: `2px solid ${themeBorderTint}`,
                        boxShadow: `0 0 36px ${themeGlowSoft}`,
                      }}
                    >
                      {revealMode === 'hold' ? (
                        <ShieldCheck
                          className="w-11 h-11"
                          style={{ color: themeAccent }}
                          strokeWidth={1.75}
                        />
                      ) : (
                        <Fingerprint
                          className="w-11 h-11"
                          style={{ color: themeAccent }}
                          strokeWidth={1.75}
                        />
                      )}
                    </div>
                  </div>

                  <p className="relative z-10 text-sm sm:text-base text-slate-700 dark:text-slate-300 max-w-xs leading-relaxed">
                    {revealMode === 'hold'
                      ? `مطمئن شو کسی صفحه را نمی‌بیند؛ حدود ${toPersianDigits((holdDurationMs / 1000).toFixed(1))} ثانیه نگه دار.`
                      : 'مطمئن شو کسی به صفحه نگاه نمی‌کند، سپس برای دیدن نقشت یک بار لمس کن.'}
                  </p>

                  <div
                    className="relative z-10 mt-6 inline-flex items-center gap-2 text-xs font-bold"
                    style={{ color: themeAccent }}
                  >
                    <EyeOff className="w-4 h-4" />
                    <span>
                      {revealMode === 'hold' ? 'حالت امن: نگه‌داشتن انگشت' : 'نمایش محرمانه تک‌نفره'}
                    </span>
                  </div>
                </button>

                {/* Card Back (Revealed Role Card at 180deg) */}
                <div
                  aria-hidden={!isRevealed}
                  className="col-start-1 row-start-1 relative w-full min-h-[370px] sm:min-h-[420px] rounded-3xl p-7 sm:p-9 flex flex-col items-center justify-center text-center overflow-hidden"
                  style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    pointerEvents: isRevealed ? 'auto' : 'none',
                    background: cardBackground,
                    border: `2px solid ${borderTint}`,
                    boxShadow: isDark
                      ? `0 0 68px -12px ${glowStrong}, inset 0 1px 0 0 rgba(255,255,255,0.08)`
                      : `0 18px 48px -16px ${glowStrong}`,
                  }}
                >
                  {isRevealed && (
                    <>
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                          backgroundImage: patternBackground,
                          backgroundSize: patternSize,
                          opacity: 0.7,
                        }}
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-3 rounded-2xl border"
                        style={{ borderColor: hexToRgba(readableColor, 0.24) }}
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: `radial-gradient(circle at 50% 42%, ${glowSoft} 0%, transparent 68%)`,
                        }}
                      />

                      {preferences.autoHideAfterSeconds > 0 && autoHideRemaining > 0 && (
                        <div className="relative z-10 mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
                          <Timer className="w-3.5 h-3.5" />
                          <span>قفل خودکار تا {toPersianDigits(autoHideRemaining)} ثانیه</span>
                        </div>
                      )}

                      {/* 1. شماره صندلی: ساید */}
                      <p className="relative z-10 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-300 mb-2 tabular-nums">
                        صندلی {toPersianDigits(playerNumber)}: {teamLabel}
                      </p>

                      {/* 2. عنوان نقش */}
                      <h1
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
                      </h1>

                      {/* 3. آیکون */}
                      <div
                        className="relative z-10 w-22 h-22 rounded-2xl flex items-center justify-center mb-5"
                        style={{
                          backgroundColor: glowSoft,
                          border: `1.5px solid ${borderTint}`,
                          boxShadow: `0 0 32px ${glowSoft}`,
                        }}
                      >
                        <RoleIcon
                          name={role.icon}
                          className="w-11 h-11"
                          style={{ color: readableColor }}
                          strokeWidth={1.9}
                        />
                      </div>

                      {/* 4. توضیحات نقش */}
                      <p
                        className={`relative z-10 text-slate-700 dark:text-slate-200 leading-relaxed max-w-md ${
                          preferences.largeRevealFont ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                        }`}
                      >
                        {role.description || 'توضیحی برای این نقش ثبت نشده است.'}
                      </p>

                      {role.roleplayTip && (
                        <div className="relative z-10 mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 max-w-md text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                          <span className="font-extrabold">نکته بازی: </span>
                          {role.roleplayTip}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Thumb-Zone Confirmation CTA closely paired with card */}
        <div className="w-full min-h-[60px] flex items-center">
          <AnimatePresence mode="wait">
            {isRevealed ? (
              <motion.button
                key={`confirm-btn-${currentIndex}`}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                onClick={handleConfirmNext}
                className="w-full min-h-[60px] rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
                style={{
                  backgroundColor: isDark ? themeConfig.accentHex : undefined,
                  boxShadow: `0 12px 30px -10px ${themeGlowStrong}`,
                }}
              >
                <Check className="w-6 h-6" strokeWidth={2.5} />
                <span>متوجه شدم / نفر بعدی</span>
              </motion.button>
            ) : (
              <motion.div
                key={`hint-text-${currentIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-full min-h-[44px] flex items-center justify-center text-xs text-slate-600 dark:text-slate-400"
              >
                پس از تایید هر نفر، امکان بازگشت به نقش قبلی وجود ندارد
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
