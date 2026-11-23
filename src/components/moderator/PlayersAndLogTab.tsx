import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  MicOff,
  Minus,
  Plus,
  Send,
  Shield,
  Skull,
  Trophy,
  Users,
} from 'lucide-react';
import { ActiveGameSession, GameLogEntry, PlayerTrackerState } from '../../types/game';
import { triggerHaptic } from '../../utils/haptics';
import { getReadableRoleColor, inferRoleTeam, toPersianDigits } from '../../utils/persian';
import { RoleIcon } from '../RoleIcon';

interface PlayersAndLogTabProps {
  session: ActiveGameSession | null;
  players: PlayerTrackerState[];
  logs: GameLogEntry[];
  roundNumber: number;
  phase: 'day' | 'night';
  hapticEnabled?: boolean;
  isDark?: boolean;
  onToggleAlive: (playerNumber: number) => void;
  onCycleWarning: (playerNumber: number) => void;
  onToggleSilenced: (playerNumber: number) => void;
  onToggleShield: (playerNumber: number) => void;
  onAdjustPlayerTotal: (delta: number) => void;
  onAddManualNote: (text: string) => void;
}

export const PlayersAndLogTab: React.FC<PlayersAndLogTabProps> = ({
  session,
  players,
  logs,
  roundNumber,
  phase,
  hapticEnabled = true,
  isDark = true,
  onToggleAlive,
  onCycleWarning,
  onToggleSilenced,
  onToggleShield,
  onAdjustPlayerTotal,
  onAddManualNote,
}) => {
  const [showRoles, setShowRoles] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);

  const [manualNote, setManualNote] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const handleHoldRolesStart = () => {
    if (showRoles) {
      triggerHaptic('tap', hapticEnabled);
      setShowRoles(false);
      return;
    }
    triggerHaptic('tap', hapticEnabled);
    holdStartRef.current = performance.now();
    const tick = (now: number) => {
      const ratio = Math.min(1, (now - holdStartRef.current) / 900);
      setHoldProgress(ratio);
      if (ratio >= 1) {
        rafRef.current = null;
        setHoldProgress(0);
        triggerHaptic('roleReveal', hapticEnabled);
        setShowRoles(true);
        return;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    rafRef.current = window.requestAnimationFrame(tick);
  };

  const handleHoldRolesCancel = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setHoldProgress(0);
  };

  // Compute live team counts & win condition when session exists
  const teamStats = (() => {
    if (!session) return null;
    let mafiaAlive = 0;
    let citizenAlive = 0;
    let independentAlive = 0;
    for (const p of players) {
      if (!p.isAlive) continue;
      const dealt = session.deck.find((d) => d.playerNumber === p.playerNumber);
      if (!dealt) continue;
      const team = inferRoleTeam(dealt.role);
      if (team === 'mafia') mafiaAlive += 1;
      else if (team === 'independent') independentAlive += 1;
      else citizenAlive += 1;
    }

    let winnerMessage: string | null = null;
    if (mafiaAlive === 0 && independentAlive === 0 && citizenAlive > 0) {
      winnerMessage = 'تمام اعضای مافیا و مستقل خارج شدند — پیروزی شهروندان!';
    } else if (mafiaAlive > 0 && mafiaAlive >= citizenAlive && independentAlive === 0) {
      winnerMessage = 'تعداد مافیا برابر یا بیشتر از شهروندان شد — پیروزی مافیا!';
    } else if (independentAlive > 0 && mafiaAlive + citizenAlive <= 1) {
      winnerMessage = 'تعداد بازیکنان باقی‌مانده به ۳ یا کمتر رسید — شانس پیروزی نقش مستقل!';
    }

    return { mafiaAlive, citizenAlive, independentAlive, winnerMessage };
  })();

  const handleCopyMatchSummary = async () => {
    const lines: string[] = [];
    lines.push(`گزارش بازی مافیا — ${session ? session.scenarioName : 'دیالوگ'}`);
    if (session) {
      lines.push(`سطح: ${session.tierLabel} · ${toPersianDigits(session.playerCount)} بازیکن`);
    }
    lines.push(
      `وضعیت فعلی: ${phase === 'day' ? 'روز' : 'شب'} ${toPersianDigits(roundNumber)}`
    );
    if (teamStats?.winnerMessage) {
      lines.push(`نتیجه: ${teamStats.winnerMessage}`);
    }
    lines.push('');
    lines.push('--- فهرست بازیکنان و نقش‌ها ---');
    players.forEach((p) => {
      const dealt = session?.deck.find((d) => d.playerNumber === p.playerNumber);
      const roleStr = dealt ? ` (${dealt.role.name})` : '';
      const statusStr = p.isAlive ? 'زنده' : 'خارج‌شده';
      lines.push(`${toPersianDigits(p.playerNumber)}. ${p.playerName}${roleStr} — ${statusStr}`);
    });
    if (logs.length > 0) {
      lines.push('');
      lines.push('--- دفترچه وقایع ---');
      logs.forEach((entry) => {
        lines.push(
          `[${entry.phase === 'day' ? 'روز' : 'شب'} ${toPersianDigits(entry.round)}] ${entry.text}`
        );
      });
    }

    const reportText = lines.join('\n');
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(reportText);
        triggerHaptic('confirm', hapticEnabled);
        setCopiedSummary(true);
        window.setTimeout(() => setCopiedSummary(false), 2500);
      }
    } catch {
      // ignore clipboard restriction
    }
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNote.trim()) return;
    onAddManualNote(manualNote.trim());
    setManualNote('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Player Table & Team Win Tracker */}
      <section className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>جدول وضعیت بازیکنان</span>
            </h2>
            {teamStats ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                زنده: {toPersianDigits(teamStats.citizenAlive)} شهروند · {toPersianDigits(teamStats.mafiaAlive)} مافیا
                {teamStats.independentAlive > 0 ? ` · ${toPersianDigits(teamStats.independentAlive)} مستقل` : ''}
              </p>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تغییر وضعیت زنده/خارج‌شده، سایلنت، جلیقه و اخطار زرد
              </p>
            )}
          </div>

          {!session && (
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#090B10] rounded-xl p-1 border border-slate-200 dark:border-white/14">
              <button
                type="button"
                onClick={() => onAdjustPlayerTotal(-1)}
                className="w-11 h-11 rounded-lg bg-white dark:bg-[#171D2B] hover:bg-slate-200 dark:hover:bg-[#1E2536] border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-900 dark:text-white cursor-pointer"
                aria-label="کاهش تعداد بازیکنان"
              >
                <Minus className="w-5 h-5" />
              </button>
              <span className="px-2.5 text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                {toPersianDigits(players.length)} نفر
              </span>
              <button
                type="button"
                onClick={() => onAdjustPlayerTotal(1)}
                className="w-11 h-11 rounded-lg bg-white dark:bg-[#171D2B] hover:bg-slate-200 dark:hover:bg-[#1E2536] border border-slate-200 dark:border-white/15 flex items-center justify-center text-slate-900 dark:text-white cursor-pointer"
                aria-label="افزایش تعداد بازیکنان"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {teamStats?.winnerMessage && (
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/12 p-3.5 flex items-center gap-3">
            <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
              {teamStats.winnerMessage}
            </span>
          </div>
        )}

        {session && (
          <button
            type="button"
            onPointerDown={handleHoldRolesStart}
            onPointerUp={handleHoldRolesCancel}
            onPointerLeave={handleHoldRolesCancel}
            onPointerCancel={handleHoldRolesCancel}
            className="relative overflow-hidden w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] hover:bg-slate-100 dark:hover:bg-white/5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span
              className="absolute inset-y-0 right-0 bg-amber-500/20 pointer-events-none"
              style={{ width: `${Math.round(holdProgress * 100)}%` }}
            />
            {showRoles ? (
              <>
                <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400 relative z-10" />
                <span className="relative z-10">مخفی کردن نقش بازیکنان</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 relative z-10" />
                <span className="relative z-10">
                  {holdProgress > 0
                    ? 'در حال نمایش نقش‌ها...'
                    : 'نگه‌دارید (۱ ثانیه): نمایش نقش بازیکنان در جدول'}
                </span>
              </>
            )}
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {players.map((p) => {
            const dealt = session?.deck.find((d) => d.playerNumber === p.playerNumber);
            const roleColor = dealt ? getReadableRoleColor(dealt.role.color, isDark) : undefined;
            return (
              <div
                key={p.playerNumber}
                className={`rounded-2xl border p-3 flex items-center justify-between gap-2 transition-colors ${
                  p.isAlive
                    ? 'border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0C0F17]'
                    : 'border-red-500/25 dark:border-red-500/20 bg-red-50 dark:bg-red-950/15 opacity-65'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleAlive(p.playerNumber)}
                  className="flex-1 min-h-[44px] flex items-center gap-2.5 text-right cursor-pointer min-w-0"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold tabular-nums shrink-0 ${
                      p.isAlive
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 dark:border-emerald-500/30'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                    }`}
                  >
                    {p.isAlive ? toPersianDigits(p.playerNumber) : <Skull className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-sm font-bold truncate tabular-nums ${
                        p.isAlive
                          ? 'text-slate-900 dark:text-slate-100'
                          : 'text-slate-500 dark:text-slate-400 line-through'
                      }`}
                    >
                      {p.playerName}
                    </div>
                    {showRoles && dealt ? (
                      <div
                        className="text-xs font-bold flex items-center gap-1 mt-0.5 truncate"
                        style={{ color: roleColor }}
                      >
                        <RoleIcon
                          name={dealt.role.icon}
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: roleColor }}
                        />
                        <span className="truncate">{dealt.role.name}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {p.isAlive ? 'در بازی' : 'خارج شده'}
                      </div>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onToggleShield(p.playerNumber)}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                      p.isShielded
                        ? 'border-cyan-500/70 dark:border-cyan-400/70 bg-cyan-500/15 dark:bg-cyan-500/22 text-cyan-700 dark:text-cyan-200'
                        : 'border-slate-200 dark:border-white/18 bg-white dark:bg-[#171D2B] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/12'
                    }`}
                    aria-label={`جلیقه یا مصونیت ${p.playerName}`}
                    title="جلیقه / مصونیت شب"
                  >
                    <Shield className="w-[18px] h-[18px]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleSilenced(p.playerNumber)}
                    className={`min-h-[44px] min-w-[44px] rounded-xl border flex items-center justify-center cursor-pointer transition-colors ${
                      p.isSilenced
                        ? 'border-violet-500/70 dark:border-violet-400/70 bg-violet-500/15 dark:bg-violet-500/22 text-violet-700 dark:text-violet-200'
                        : 'border-slate-200 dark:border-white/18 bg-white dark:bg-[#171D2B] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/12'
                    }`}
                    aria-label={`سایلنت ${p.playerName}`}
                    title="سایلنت / ممنوع از صحبت"
                  >
                    <MicOff className="w-[18px] h-[18px]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onCycleWarning(p.playerNumber)}
                    className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer tabular-nums transition-colors ${
                      p.warnings > 0
                        ? 'border-amber-500/70 dark:border-amber-400/70 bg-amber-500/15 dark:bg-amber-500/22 text-amber-800 dark:text-amber-200'
                        : 'border-slate-200 dark:border-white/18 bg-white dark:bg-[#171D2B] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/12'
                    }`}
                    aria-label={`اخطار ${p.playerName}`}
                    title="کارت زرد / اخطار"
                  >
                    <AlertTriangle className="w-[18px] h-[18px]" />
                    {p.warnings > 0 && <span>{toPersianDigits(p.warnings)}</span>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* God's Notebook & Shareable Match Summary */}
      <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>دفترچه وقایع گاد</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ثبت خودکار و دستی اتفاقات هر روز و شب</p>
          </div>

          <button
            type="button"
            onClick={handleCopyMatchSummary}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 dark:border-amber-400/50 bg-amber-500/15 dark:bg-amber-500/18 hover:bg-amber-500/25 px-3.5 py-2 min-h-[44px] text-xs font-extrabold text-amber-800 dark:text-amber-200 cursor-pointer whitespace-nowrap"
          >
            {copiedSummary ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSummary ? 'کپی شد' : 'کپی گزارش بازی'}</span>
          </button>
        </div>

        <form onSubmit={handleSubmitNote} className="flex items-center gap-2">
          <input
            type="text"
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            placeholder="یادداشت سریع (مثلاً: چالش بازیکن ۳)..."
            className="flex-1 min-h-[46px] rounded-xl border border-slate-300 dark:border-white/16 bg-slate-50 dark:bg-[#090B10] px-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
          />
          <button
            type="submit"
            className="min-h-[46px] min-w-[46px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer"
            aria-label="ثبت یادداشت"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-3.5 max-h-[340px] overflow-y-auto space-y-2">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              هنوز واقعه‌ای ثبت نشده است. با ثبت وقایع شب یا رأی‌گیری، دفترچه به‌روز می‌شود.
            </p>
          ) : (
            [...logs].reverse().map((entry) => (
              <div
                key={entry.id}
                className="text-xs leading-relaxed border-b border-slate-200 dark:border-white/5 last:border-b-0 pb-2 last:pb-0"
              >
                <span className="font-bold text-amber-700 dark:text-amber-400 tabular-nums ml-1.5">
                  [{entry.phase === 'day' ? 'روز' : 'شب'} {toPersianDigits(entry.round)}]
                </span>
                <span className="text-slate-700 dark:text-slate-300">{entry.text}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
