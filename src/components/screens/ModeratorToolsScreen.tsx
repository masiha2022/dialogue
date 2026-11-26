import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  SlidersHorizontal,
} from 'lucide-react';
import { useWakeLock } from '../../hooks/useWakeLock';
import {
  ActiveGameSession,
  AppPreferences,
  NightTrackId,
} from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import {
  nightAmbient,
  playTimerEndAlarm,
  unlockAudioContext,
} from '../../utils/soundEngine';
import { TimerAndAudioTab } from '../moderator/TimerAndAudioTab';

interface ModeratorToolsScreenProps {
  session: ActiveGameSession | null;
  preferences: AppPreferences;
  onUpdatePreferences: (next: AppPreferences) => void;
  onOpenCustomization: () => void;
  onBack: () => void;
  onOpenRules?: () => void;
  onOpenGuide?: () => void;
}

export const ModeratorToolsScreen: React.FC<ModeratorToolsScreenProps> = ({
  session,
  preferences,
  onUpdatePreferences,
  onOpenCustomization,
  onBack,
  onOpenRules,
  onOpenGuide,
}) => {
  // Timer & Ambient Sound State
  const [durationSeconds, setDurationSeconds] = useState(preferences.defaultSpeechSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(preferences.defaultSpeechSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(() => nightAmbient.isRunning());
  const [ambientVolume, setAmbientVolume] = useState(preferences.nightVolume);

  // Wall-clock refs to eliminate mobile browser timer drift
  const targetEndMsRef = useRef<number>(0);
  const lastTickedSecRef = useRef<number>(-1);
  const hasPlayedLastWordsBellRef = useRef<boolean>(false);

  // Keep phone screen awake while using timer and night audio
  useWakeLock(true);

  useEffect(() => {
    setAmbientVolume(preferences.nightVolume);
    nightAmbient.setVolume(preferences.nightVolume);
  }, [preferences.nightVolume]);

  useEffect(() => {
    return () => {
      nightAmbient.stop();
    };
  }, []);

  // Zero-drift wall-clock Countdown Effect with escalating last-10s ticks
  useEffect(() => {
    if (!isRunning) return;

    targetEndMsRef.current = Date.now() + remainingSeconds * 1000;
    lastTickedSecRef.current = remainingSeconds;

    const syncTimer = () => {
      const nextSec = Math.max(0, Math.ceil((targetEndMsRef.current - Date.now()) / 1000));
      setRemainingSeconds(nextSec);

      if (nextSec === 0) {
        setIsRunning(false);
        if (lastTickedSecRef.current !== 0) {
          lastTickedSecRef.current = 0;
          if (!isMuted) {
            void playTimerEndAlarm(preferences.alarmSoundId, 2);
          }
          triggerHaptic('timerEnd', preferences.vibrateOnTimerEnd);
        }
        return;
      }

      if (nextSec !== lastTickedSecRef.current) {
        lastTickedSecRef.current = nextSec;
        if (
          preferences.warningCountdownSeconds > 0 &&
          nextSec <= preferences.warningCountdownSeconds &&
          !hasPlayedLastWordsBellRef.current
        ) {
          hasPlayedLastWordsBellRef.current = true;
          if (!isMuted) {
            void playTimerEndAlarm(preferences.alarmSoundId, 1);
          }
          triggerHaptic('countdownTick', preferences.vibrateOnTimerEnd);
        }
      }
    };

    const id = window.setInterval(syncTimer, 200);
    document.addEventListener('visibilitychange', syncTimer);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', syncTimer);
    };
    // Intentionally sync only when running state or sound prefs change; remainingSeconds is captured on start/resume
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isRunning,
    isMuted,
    preferences.alarmSoundId,
    preferences.vibrateOnTimerEnd,
    preferences.warningCountdownSeconds,
  ]);

  // Timer & Audio handlers
  const selectPreset = (secs: number) => {
    unlockAudioContext();
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    hasPlayedLastWordsBellRef.current = false;
    setIsRunning(false);
    setDurationSeconds(secs);
    setRemainingSeconds(secs);
  };

  const togglePlayPause = () => {
    unlockAudioContext();
    if (remainingSeconds === 0) {
      triggerHaptic('timerStart', preferences.hapticFeedbackEnabled);
      const startsInLastWords =
        preferences.warningCountdownSeconds > 0 &&
        durationSeconds <= preferences.warningCountdownSeconds;
      hasPlayedLastWordsBellRef.current = startsInLastWords;
      if (startsInLastWords && !isMuted) {
        void playTimerEndAlarm(preferences.alarmSoundId, 1);
      }
      setRemainingSeconds(durationSeconds);
      setIsRunning(true);
      return;
    }

    const nextRunning = !isRunning;
    if (
      nextRunning &&
      preferences.warningCountdownSeconds > 0 &&
      remainingSeconds <= preferences.warningCountdownSeconds &&
      !hasPlayedLastWordsBellRef.current
    ) {
      hasPlayedLastWordsBellRef.current = true;
      if (!isMuted) {
        void playTimerEndAlarm(preferences.alarmSoundId, 1);
      }
    }
    triggerHaptic(nextRunning ? 'timerStart' : 'timerPause', preferences.hapticFeedbackEnabled);
    setIsRunning(nextRunning);
  };

  const resetTimer = () => {
    triggerHaptic('timerPause', preferences.hapticFeedbackEnabled);
    hasPlayedLastWordsBellRef.current = false;
    setIsRunning(false);
    setRemainingSeconds(durationSeconds);
  };

  const handleToggleAmbient = async () => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    if (nightAmbient.isRunning()) {
      nightAmbient.stop();
      setIsAmbientPlaying(false);
    } else {
      const started = await nightAmbient.start(ambientVolume, preferences.nightTrackId);
      setIsAmbientPlaying(started);
    }
  };

  useEffect(() => {
    if (isAmbientPlaying && nightAmbient.getTrackId() !== preferences.nightTrackId) {
      void nightAmbient.start(ambientVolume, preferences.nightTrackId).then((started) => {
        setIsAmbientPlaying(started);
      });
    }
  }, [preferences.nightTrackId, isAmbientPlaying, ambientVolume]);

  const handleSelectNightTrack = (trackId: NightTrackId) => {
    onUpdatePreferences({ ...preferences, nightTrackId: trackId });
  };

  const handleChangeAmbientVolume = (vol: number) => {
    setAmbientVolume(vol);
    nightAmbient.setVolume(vol);
    onUpdatePreferences({ ...preferences, nightVolume: vol });
  };

  return (
    <div className="relative z-10 min-h-dvh flex flex-col bg-transparent pb-10 pb-safe transition-colors">
      {/* Compact High-Contrast Top Bar */}
      <header className="sticky top-0 z-30 pt-safe min-h-[calc(3.75rem+env(safe-area-inset-top))] py-1.5 bg-white/85 dark:bg-[#090B10]/85 backdrop-blur-md border-b border-slate-200 dark:border-white/12 px-3 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-white/15 bg-slate-100 dark:bg-[#161B28] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="بازگشت"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
              تایمر و صدا {session ? `· ${session.scenarioName}` : ''}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenGuide && (
            <button
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-2 min-h-[44px] min-w-[44px] justify-center text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer whitespace-nowrap"
              aria-label="راهنمای گام‌به‌گام"
              title="راهنمای گام‌به‌گام"
            >
              <GraduationCap className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">راهنما</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCustomization}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 px-3 py-2 min-h-[44px] min-w-[44px] justify-center text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer whitespace-nowrap"
            aria-label="شخصی‌سازی"
            title="شخصی‌سازی آهنگ، آلارم و قوانین"
          >
            <SlidersHorizontal className="w-[18px] h-[18px] text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">شخصی‌سازی</span>
          </button>

          {session && onOpenRules && (
            <button
              type="button"
              onClick={onOpenRules}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/35 dark:border-blue-400/35 bg-blue-500/12 dark:bg-blue-500/15 hover:bg-blue-500/20 dark:hover:bg-blue-500/25 px-3 py-2 min-h-[44px] text-xs font-bold text-blue-800 dark:text-blue-100 cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-[18px] h-[18px] text-blue-600 dark:text-blue-300" />
              <span className="hidden sm:inline">قوانین</span>
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5">
        <TimerAndAudioTab
          durationSeconds={durationSeconds}
          remainingSeconds={remainingSeconds}
          isRunning={isRunning}
          isMuted={isMuted}
          preferences={preferences}
          onUpdatePreferences={onUpdatePreferences}
          onToggleMute={() => setIsMuted((m) => !m)}
          onSelectPreset={selectPreset}
          onTogglePlayPause={togglePlayPause}
          onResetTimer={resetTimer}
          isAmbientPlaying={isAmbientPlaying}
          ambientVolume={ambientVolume}
          onToggleAmbient={() => void handleToggleAmbient()}
          onChangeAmbientVolume={handleChangeAmbientVolume}
          onSelectNightTrack={(t) => void handleSelectNightTrack(t)}
        />
      </main>
    </div>
  );
};
