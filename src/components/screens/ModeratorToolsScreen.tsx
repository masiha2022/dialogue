import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Gavel,
  GraduationCap,
  Moon,
  SlidersHorizontal,
  Sun,
  Timer,
  Undo2,
  Users,
} from 'lucide-react';
import { useWakeLock } from '../../hooks/useWakeLock';
import {
  ActiveGameSession,
  AppPreferences,
  GameLogEntry,
  LastMoveCard,
  ModeratorMatchState,
  NightTrackId,
  PlayerTrackerState,
} from '../../types/game';
import { generateLocalId, toPersianDigits } from '../../utils/persian';
import { triggerHaptic } from '../../utils/haptics';
import {
  nightAmbient,
  playCountdownTick,
  playOfflineBeep,
  playTimerEndAlarm,
  unlockAudioContext,
} from '../../utils/soundEngine';
import {
  loadLastMoveCards,
  loadModeratorMatchState,
  saveLastMoveCards,
  saveModeratorMatchState,
} from '../../utils/storage';
import { DayCourtTab } from '../moderator/DayCourtTab';
import { NightManagerTab, NightResolutionPayload } from '../moderator/NightManagerTab';
import { PlayersAndLogTab } from '../moderator/PlayersAndLogTab';
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

type ConsoleTabKey = 'timer' | 'night' | 'court' | 'players';

function buildInitialPlayers(session: ActiveGameSession | null, count = 10): PlayerTrackerState[] {
  if (session) {
    return session.deck.map((item) => ({
      playerNumber: item.playerNumber,
      playerName: item.playerName || `بازیکن ${toPersianDigits(item.playerNumber)}`,
      isAlive: true,
      warnings: 0,
      isSilenced: false,
      isShielded: false,
      votes: 0,
    }));
  }
  return Array.from({ length: count }, (_, idx) => ({
    playerNumber: idx + 1,
    playerName: `بازیکن ${toPersianDigits(idx + 1)}`,
    isAlive: true,
    warnings: 0,
    isSilenced: false,
    isShielded: false,
    votes: 0,
  }));
}

function createInitialMatchState(session: ActiveGameSession | null): ModeratorMatchState {
  const saved = loadModeratorMatchState();
  if (saved && saved.sessionId === (session?.id ?? null) && saved.players.length > 0) {
    return saved;
  }
  return {
    sessionId: session?.id ?? null,
    phase: 'night',
    roundNumber: 1,
    players: buildInitialPlayers(session),
    logs: [],
    usedCardIds: [],
    pickedStarter: null,
  };
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
  const [activeTab, setActiveTab] = useState<ConsoleTabKey>('timer');

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

  // Keep phone screen awake while moderating active table
  useWakeLock(true);

  // Persistent Match Board + Undo History
  const [matchState, setMatchState] = useState<ModeratorMatchState>(() =>
    createInitialMatchState(session)
  );
  const [undoStack, setUndoStack] = useState<ModeratorMatchState[]>([]);
  const [lastMoveCards, setLastMoveCards] = useState<LastMoveCard[]>(() => loadLastMoveCards());

  useEffect(() => {
    saveModeratorMatchState(matchState);
  }, [matchState]);

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
            void playTimerEndAlarm(preferences.alarmSoundId);
          }
          triggerHaptic('timerEnd', preferences.vibrateOnTimerEnd);
        }
        return;
      }

      if (nextSec !== lastTickedSecRef.current) {
        lastTickedSecRef.current = nextSec;
        if (
          preferences.warningCountdownSeconds > 0 &&
          nextSec <= preferences.warningCountdownSeconds
        ) {
          if (!isMuted) {
            playCountdownTick(nextSec);
          }
          if (nextSec <= 3) {
            triggerHaptic('countdownTick', preferences.vibrateOnTimerEnd);
          }
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

  const commitState = (updater: (prev: ModeratorMatchState) => ModeratorMatchState) => {
    setMatchState((prev) => {
      setUndoStack((stack) => [...stack.slice(-14), prev]);
      return updater(prev);
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setMatchState(previous);
  };

  const makeLog = (
    round: number,
    phase: 'day' | 'night',
    text: string
  ): GameLogEntry => ({
    id: generateLocalId('log'),
    round,
    phase,
    text,
    timestamp: Date.now(),
  });

  // Timer & Audio handlers
  const selectPreset = (secs: number) => {
    unlockAudioContext();
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    setIsRunning(false);
    setDurationSeconds(secs);
    setRemainingSeconds(secs);
  };

  const adjustTimer = (delta: number) => {
    unlockAudioContext();
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    if (isRunning) {
      const currentLeft = Math.max(0, Math.ceil((targetEndMsRef.current - Date.now()) / 1000));
      const next = Math.max(5, Math.min(600, currentLeft + delta));
      targetEndMsRef.current = Date.now() + next * 1000;
      lastTickedSecRef.current = next;
      setRemainingSeconds(next);
      return;
    }
    setRemainingSeconds((prev) => {
      const next = Math.max(5, Math.min(600, prev + delta));
      setDurationSeconds(next);
      return next;
    });
  };

  const togglePlayPause = () => {
    unlockAudioContext();
    if (remainingSeconds === 0) {
      triggerHaptic('timerStart', preferences.hapticFeedbackEnabled);
      setRemainingSeconds(durationSeconds);
      setIsRunning(true);
      return;
    }
    setIsRunning((r) => {
      const nextRunning = !r;
      triggerHaptic(nextRunning ? 'timerStart' : 'timerPause', preferences.hapticFeedbackEnabled);
      return nextRunning;
    });
  };

  const resetTimer = () => {
    triggerHaptic('timerPause', preferences.hapticFeedbackEnabled);
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

  const handleSelectNightTrack = async (trackId: NightTrackId) => {
    onUpdatePreferences({ ...preferences, nightTrackId: trackId });
    if (isAmbientPlaying) {
      const started = await nightAmbient.start(ambientVolume, trackId);
      setIsAmbientPlaying(started);
    }
  };

  const handleChangeAmbientVolume = (vol: number) => {
    setAmbientVolume(vol);
    nightAmbient.setVolume(vol);
    onUpdatePreferences({ ...preferences, nightVolume: vol });
  };

  // Phase & Random Picker
  const alivePlayers = matchState.players.filter((p) => p.isAlive);
  const aliveCount = alivePlayers.length;
  const majorityThreshold = Math.floor(aliveCount / 2) + 1;

  const handleNextPhase = () => {
    triggerHaptic('confirm', preferences.hapticFeedbackEnabled);
    commitState((prev) => {
      if (prev.phase === 'day') {
        if (!isMuted) playOfflineBeep('night');
        return {
          ...prev,
          phase: 'night',
          players: prev.players.map((p) => ({ ...p, votes: 0 })),
          logs: [...prev.logs, makeLog(prev.roundNumber, 'day', 'پایان روز و ورود شهر به فاز شب.')],
        };
      }
      if (!isMuted) playOfflineBeep('day');
      const nextRound = prev.roundNumber + 1;
      return {
        ...prev,
        phase: 'day',
        roundNumber: nextRound,
        players: prev.players.map((p) => ({ ...p, votes: 0 })),
        logs: [...prev.logs, makeLog(nextRound, 'day', `آغاز روز ${toPersianDigits(nextRound)}.`)],
      };
    });
  };

  const handlePickRandomAlive = () => {
    if (alivePlayers.length === 0) return;
    triggerHaptic('confirm', preferences.hapticFeedbackEnabled);
    const idx = Math.floor(Math.random() * alivePlayers.length);
    const chosen = alivePlayers[idx].playerNumber;
    setMatchState((prev) => ({ ...prev, pickedStarter: chosen }));
  };

  // Night Manager Handler
  const handleApplyNightOutcome = (payload: NightResolutionPayload) => {
    triggerHaptic(
      payload.eliminatedNumbers.length > 0 ? 'warning' : 'confirm',
      preferences.hapticFeedbackEnabled
    );
    if (!isMuted) {
      playOfflineBeep(payload.eliminatedNumbers.length > 0 ? 'eliminate' : 'day');
    }
    commitState((prev) => {
      const nextRound =
        prev.phase === 'night'
          ? prev.roundNumber + (prev.logs.length > 0 ? 1 : 0)
          : prev.roundNumber + 1;
      const newLogs = [
        ...prev.logs,
        ...payload.summaryLines.map((line) => makeLog(prev.roundNumber, 'night', line)),
      ];
      return {
        ...prev,
        phase: 'day',
        roundNumber: prev.roundNumber === 1 && prev.logs.length === 0 ? 1 : nextRound,
        players: prev.players.map((p) => ({
          ...p,
          isAlive: payload.eliminatedNumbers.includes(p.playerNumber) ? false : p.isAlive,
          isSilenced: p.playerNumber === payload.silencedNumber,
          votes: 0,
        })),
        logs: newLogs,
      };
    });
  };

  // Day Court & Last Move Handlers
  const handleAdjustVote = (playerNumber: number, delta: number) => {
    const defenseReq =
      preferences.defenseVoteFormula === 'half_plus_one'
        ? Math.floor(aliveCount / 2) + 1
        : Math.max(1, Math.floor(aliveCount / 2));
    const currentPlayer = matchState.players.find((p) => p.playerNumber === playerNumber);
    const nextVotes = currentPlayer ? Math.max(0, currentPlayer.votes + delta) : 0;
    const hitThreshold =
      delta > 0 && currentPlayer && (nextVotes === defenseReq || nextVotes === majorityThreshold);
    triggerHaptic(hitThreshold ? 'warning' : 'tap', preferences.hapticFeedbackEnabled);

    setMatchState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.playerNumber === playerNumber ? { ...p, votes: Math.max(0, p.votes + delta) } : p
      ),
    }));
  };

  const handleResetVotes = () => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    setMatchState((prev) => ({
      ...prev,
      players: prev.players.map((p) => ({ ...p, votes: 0 })),
    }));
  };

  const handleEliminateWithCard = (playerNumber: number, card: LastMoveCard | null) => {
    triggerHaptic('warning', preferences.hapticFeedbackEnabled);
    if (!isMuted) playOfflineBeep('eliminate');
    commitState((prev) => {
      const target = prev.players.find((p) => p.playerNumber === playerNumber);
      const name = target?.playerName || `بازیکن ${toPersianDigits(playerNumber)}`;
      const logMsg = card
        ? `«${name}» با رأی دادگاه خارج شد و کارت حرکت آخر «${card.title}» را کشید.`
        : `«${name}» با رأی دادگاه از بازی خارج شد.`;
      return {
        ...prev,
        players: prev.players.map((p) =>
          p.playerNumber === playerNumber ? { ...p, isAlive: false, votes: 0 } : { ...p, votes: 0 }
        ),
        logs: [...prev.logs, makeLog(prev.roundNumber, prev.phase, logMsg)],
      };
    });
  };

  const handleSaveLastMoveCards = (cards: LastMoveCard[]) => {
    setLastMoveCards(cards);
    saveLastMoveCards(cards);
  };

  const handleMarkCardUsed = (cardId: string) => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    setMatchState((prev) => ({
      ...prev,
      usedCardIds: prev.usedCardIds.includes(cardId)
        ? prev.usedCardIds
        : [...prev.usedCardIds, cardId],
    }));
  };

  const handleResetUsedCards = () => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    setMatchState((prev) => ({ ...prev, usedCardIds: [] }));
  };

  // Players & Notebook Handlers
  const handleToggleAlive = (playerNumber: number) => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    commitState((prev) => {
      const target = prev.players.find((p) => p.playerNumber === playerNumber);
      const nextAlive = target ? !target.isAlive : false;
      const name = target?.playerName || `بازیکن ${toPersianDigits(playerNumber)}`;
      return {
        ...prev,
        players: prev.players.map((p) =>
          p.playerNumber === playerNumber ? { ...p, isAlive: nextAlive } : p
        ),
        logs: [
          ...prev.logs,
          makeLog(
            prev.roundNumber,
            prev.phase,
            nextAlive ? `«${name}» به بازی بازگردانده شد.` : `«${name}» خارج‌شده ثبت شد.`
          ),
        ],
      };
    });
  };

  const handleCycleWarning = (playerNumber: number) => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    commitState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.playerNumber === playerNumber ? { ...p, warnings: (p.warnings + 1) % 3 } : p
      ),
    }));
  };

  const handleToggleSilenced = (playerNumber: number) => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    commitState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.playerNumber === playerNumber ? { ...p, isSilenced: !p.isSilenced } : p
      ),
    }));
  };

  const handleToggleShield = (playerNumber: number) => {
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    commitState((prev) => ({
      ...prev,
      players: prev.players.map((p) =>
        p.playerNumber === playerNumber ? { ...p, isShielded: !p.isShielded } : p
      ),
    }));
  };

  const handleAdjustPlayerTotal = (delta: number) => {
    if (session) return;
    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
    setMatchState((prev) => {
      const nextLen = Math.max(4, Math.min(30, prev.players.length + delta));
      if (nextLen > prev.players.length) {
        return {
          ...prev,
          players: [
            ...prev.players,
            {
              playerNumber: nextLen,
              playerName: `بازیکن ${toPersianDigits(nextLen)}`,
              isAlive: true,
              warnings: 0,
              isSilenced: false,
              isShielded: false,
              votes: 0,
            },
          ],
        };
      }
      return { ...prev, players: prev.players.slice(0, nextLen) };
    });
  };

  const handleAddManualNote = (text: string) => {
    triggerHaptic('confirm', preferences.hapticFeedbackEnabled);
    commitState((prev) => ({
      ...prev,
      logs: [...prev.logs, makeLog(prev.roundNumber, prev.phase, text)],
    }));
  };

  const TABS: { key: ConsoleTabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'timer', label: 'تایمر و صدا', icon: <Timer className="w-[18px] h-[18px]" /> },
    { key: 'night', label: 'مدیریت شب', icon: <Moon className="w-[18px] h-[18px]" /> },
    { key: 'court', label: 'دادگاه و کارت', icon: <Gavel className="w-[18px] h-[18px]" /> },
    { key: 'players', label: 'بازیکنان و دفترچه', icon: <Users className="w-[18px] h-[18px]" /> },
  ];

  const isDark = preferences.themeMode !== 'light';

  return (
    <div className="relative z-10 min-h-dvh flex flex-col bg-transparent pb-14 pb-safe transition-colors">
      {/* Compact High-Contrast Top Bar */}
      <header className="sticky top-0 z-30 h-15 bg-white/85 dark:bg-[#090B10]/85 backdrop-blur-md border-b border-slate-200 dark:border-white/12 px-3 sm:px-6 flex items-center justify-between gap-2">
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
            <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
              کنسول گرداننده {session ? `· ${session.scenarioName}` : ''}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-35 px-3 py-2 min-h-[44px] min-w-[44px] justify-center text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer whitespace-nowrap"
            aria-label="بازگشت مرحله قبل"
            title="بازگشت به مرحله قبل"
          >
            <Undo2 className="w-[18px] h-[18px] text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">بازگشت مرحله</span>
          </button>

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

      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Compact Phase & Alive Status Bar */}
        <section className="rounded-2xl border border-slate-200 dark:border-white/14 bg-white dark:bg-[#121620] px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs dark:shadow-none">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                matchState.phase === 'day'
                  ? 'bg-amber-500/18 border-amber-500/45 text-amber-700 dark:text-amber-300'
                  : 'bg-blue-500/18 border-blue-500/45 text-blue-700 dark:text-blue-300'
              }`}
            >
              {matchState.phase === 'day' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                {matchState.phase === 'day'
                  ? `روز ${toPersianDigits(matchState.roundNumber)}`
                  : `شب ${toPersianDigits(matchState.roundNumber)}`}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                {toPersianDigits(aliveCount)} بازیکن زنده · حدنصاب خروج: {toPersianDigits(majorityThreshold)} رأی
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextPhase}
            className="min-h-[46px] px-4 rounded-xl border border-slate-300 dark:border-white/22 bg-slate-100 dark:bg-[#171C28] hover:bg-slate-200 dark:hover:bg-white/10 text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white cursor-pointer whitespace-nowrap"
          >
            {matchState.phase === 'day' ? 'ورود به شب' : 'ورود به روز بعد'}
          </button>
        </section>

        {/* 4-Tab Navigation */}
        <nav
          aria-label="بخش‌های کنسول گرداننده"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/14 shadow-xs dark:shadow-none"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  triggerHaptic('tap', preferences.hapticFeedbackEnabled);
                  setActiveTab(tab.key);
                }}
                className={`min-h-[48px] rounded-xl px-2.5 py-2 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-700 dark:text-slate-100 bg-slate-100 dark:bg-[#0B0E15] border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Active Tab Content */}
        {activeTab === 'timer' && (
          <TimerAndAudioTab
            durationSeconds={durationSeconds}
            remainingSeconds={remainingSeconds}
            isRunning={isRunning}
            isMuted={isMuted}
            preferences={preferences}
            onUpdatePreferences={onUpdatePreferences}
            onOpenCustomization={onOpenCustomization}
            onToggleMute={() => setIsMuted((m) => !m)}
            onSelectPreset={selectPreset}
            onAdjustTimer={adjustTimer}
            onTogglePlayPause={togglePlayPause}
            onResetTimer={resetTimer}
            isAmbientPlaying={isAmbientPlaying}
            ambientVolume={ambientVolume}
            onToggleAmbient={() => void handleToggleAmbient()}
            onChangeAmbientVolume={handleChangeAmbientVolume}
            onSelectNightTrack={(t) => void handleSelectNightTrack(t)}
            alivePlayers={alivePlayers}
            pickedStarter={matchState.pickedStarter}
            onPickRandomAlive={handlePickRandomAlive}
          />
        )}

        {activeTab === 'night' && (
          <NightManagerTab
            session={session}
            roundNumber={matchState.roundNumber}
            players={matchState.players}
            defaultSniperPenalty={preferences.sniperPenaltyOnCitizen}
            onApplyNightOutcome={handleApplyNightOutcome}
          />
        )}

        {activeTab === 'court' && (
          <DayCourtTab
            players={matchState.players}
            lastMoveCards={lastMoveCards}
            usedCardIds={matchState.usedCardIds}
            defenseVoteFormula={preferences.defenseVoteFormula}
            onAdjustVote={handleAdjustVote}
            onResetVotes={handleResetVotes}
            onEliminateWithCard={handleEliminateWithCard}
            onSaveLastMoveCards={handleSaveLastMoveCards}
            onMarkCardUsed={handleMarkCardUsed}
            onResetUsedCards={handleResetUsedCards}
          />
        )}

        {activeTab === 'players' && (
          <PlayersAndLogTab
            session={session}
            players={matchState.players}
            logs={matchState.logs}
            roundNumber={matchState.roundNumber}
            phase={matchState.phase}
            hapticEnabled={preferences.hapticFeedbackEnabled}
            isDark={isDark}
            onToggleAlive={handleToggleAlive}
            onCycleWarning={handleCycleWarning}
            onToggleSilenced={handleToggleSilenced}
            onToggleShield={handleToggleShield}
            onAdjustPlayerTotal={handleAdjustPlayerTotal}
            onAddManualNote={handleAddManualNote}
          />
        )}
      </main>
    </div>
  );
};
