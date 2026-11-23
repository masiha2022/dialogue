import React, { useState } from 'react';
import {
  Gavel,
  Minus,
  Plus,
  RotateCcw,
  Shuffle,
  Skull,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { LastMoveCard, PlayerTrackerState } from '../../types/game';
import { fairShuffle, generateLocalId, toPersianDigits } from '../../utils/persian';

interface DayCourtTabProps {
  players: PlayerTrackerState[];
  lastMoveCards: LastMoveCard[];
  usedCardIds: string[];
  defenseVoteFormula: 'half' | 'half_plus_one';
  onAdjustVote: (playerNumber: number, delta: number) => void;
  onResetVotes: () => void;
  onEliminateWithCard: (playerNumber: number, card: LastMoveCard | null) => void;
  onSaveLastMoveCards: (cards: LastMoveCard[]) => void;
  onMarkCardUsed: (cardId: string) => void;
  onResetUsedCards: () => void;
}

export const DayCourtTab: React.FC<DayCourtTabProps> = ({
  players,
  lastMoveCards,
  usedCardIds,
  defenseVoteFormula,
  onAdjustVote,
  onResetVotes,
  onEliminateWithCard,
  onSaveLastMoveCards,
  onMarkCardUsed,
  onResetUsedCards,
}) => {
  const alivePlayers = players.filter((p) => p.isAlive);
  const aliveCount = alivePlayers.length;
  const defenseThreshold =
    defenseVoteFormula === 'half_plus_one'
      ? Math.floor(aliveCount / 2) + 1
      : Math.max(1, Math.floor(aliveCount / 2));
  const exitThreshold = Math.floor(aliveCount / 2) + 1;

  const [drawnCard, setDrawnCard] = useState<LastMoveCard | null>(null);
  const [pendingEliminatePlayer, setPendingEliminatePlayer] = useState<PlayerTrackerState | null>(null);
  const [showCardDeckManager, setShowCardDeckManager] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardDesc, setNewCardDesc] = useState('');

  const availableCards = lastMoveCards.filter((c) => c.enabled && !usedCardIds.includes(c.id));

  const drawRandomLastMove = (): LastMoveCard | null => {
    if (availableCards.length === 0) return null;
    const picked = fairShuffle(availableCards)[0];
    setDrawnCard(picked);
    onMarkCardUsed(picked.id);
    return picked;
  };

  const handleTriggerVoteOut = (player: PlayerTrackerState) => {
    setPendingEliminatePlayer(player);
    setDrawnCard(null);
  };

  const handleConfirmElimination = () => {
    if (!pendingEliminatePlayer) return;
    onEliminateWithCard(pendingEliminatePlayer.playerNumber, drawnCard);
    setPendingEliminatePlayer(null);
  };

  const handleToggleCardEnabled = (id: string) => {
    onSaveLastMoveCards(
      lastMoveCards.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleAddCustomCard = () => {
    if (!newCardTitle.trim()) return;
    const card: LastMoveCard = {
      id: generateLocalId('lm'),
      title: newCardTitle.trim(),
      description: newCardDesc.trim() || 'کارت حرکت آخر سفارشی میز',
      enabled: true,
      isBuiltIn: false,
    };
    onSaveLastMoveCards([...lastMoveCards, card]);
    setNewCardTitle('');
    setNewCardDesc('');
  };

  const handleDeleteCustomCard = (id: string) => {
    onSaveLastMoveCards(lastMoveCards.filter((c) => c.id !== id));
  };

  const sortedForCourt = [...alivePlayers].sort((a, b) => b.votes - a.votes);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Live Day Voting & Court */}
      <section className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>میز رأی‌گیری و دادگاه روز</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              حدنصاب دفاعیه: {toPersianDigits(defenseThreshold)} رأی · حدنصاب خروج مستقیم: {toPersianDigits(exitThreshold)} رأی
            </p>
          </div>

          <button
            type="button"
            onClick={onResetVotes}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/18 bg-slate-100 dark:bg-[#171D2B] hover:bg-slate-200 dark:hover:bg-white/10 px-3.5 py-2 min-h-[44px] text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-300" />
            <span>صفر کردن آرا</span>
          </button>
        </div>

        <div className="space-y-2">
          {sortedForCourt.map((p) => {
            const reachesExit = p.votes >= exitThreshold;
            const reachesDefense = p.votes >= defenseThreshold;

            return (
              <div
                key={p.playerNumber}
                className={`rounded-2xl border p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 transition-colors ${
                  reachesExit
                    ? 'border-rose-500/45 bg-rose-500/10'
                    : reachesDefense
                    ? 'border-amber-500/45 dark:border-amber-500/40 bg-amber-500/10'
                    : 'border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0B0E15]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl bg-slate-200/70 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center text-xs font-extrabold text-slate-800 dark:text-slate-200 tabular-nums shrink-0">
                    {toPersianDigits(p.playerNumber)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">{p.playerName}</div>
                    <div className="text-xs tabular-nums">
                      {reachesExit ? (
                        <span className="text-rose-700 dark:text-rose-200 font-extrabold">حدنصاب خروج کامل شده</span>
                      ) : reachesDefense ? (
                        <span className="text-amber-700 dark:text-amber-200 font-bold">وارد دادگاه دفاعیه</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-300">در انتظار رأی</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mr-auto">
                  <button
                    type="button"
                    onClick={() => onAdjustVote(p.playerNumber, -1)}
                    disabled={p.votes <= 0}
                    className="w-11 h-11 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#171D2B] hover:bg-slate-100 dark:hover:bg-white/12 disabled:opacity-35 flex items-center justify-center text-slate-900 dark:text-white cursor-pointer"
                    aria-label="کاهش رأی"
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <span className="w-8 text-center text-base font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">
                    {toPersianDigits(p.votes)}
                  </span>

                  <button
                    type="button"
                    onClick={() => onAdjustVote(p.playerNumber, 1)}
                    className="w-11 h-11 rounded-xl border border-slate-300 dark:border-white/20 bg-white dark:bg-[#171D2B] hover:bg-slate-100 dark:hover:bg-white/12 flex items-center justify-center text-slate-900 dark:text-white cursor-pointer"
                    aria-label="افزایش رأی"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTriggerVoteOut(p)}
                    className="min-h-[44px] px-3.5 rounded-xl border border-rose-500/50 dark:border-rose-400/55 bg-rose-500/15 dark:bg-rose-500/22 hover:bg-rose-500/25 dark:hover:bg-rose-500/32 text-xs sm:text-sm font-extrabold text-rose-700 dark:text-rose-100 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Skull className="w-4 h-4" />
                    <span>خروج</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Last Move Cards Deck */}
      <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>کارت‌های حرکت آخر</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {toPersianDigits(availableCards.length)} کارت فعال باقی‌مانده در دسته
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCardDeckManager((v) => !v)}
            className="min-h-[44px] px-3.5 rounded-xl border border-slate-300 dark:border-white/18 bg-slate-100 dark:bg-[#171D2B] hover:bg-slate-200 dark:hover:bg-white/10 text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-300 cursor-pointer"
          >
            {showCardDeckManager ? 'نمایش میز کارت' : 'تنظیم و کارت جدید'}
          </button>
        </div>

        {showCardDeckManager ? (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
              {lastMoveCards.map((card) => {
                const isUsed = usedCardIds.includes(card.id);
                return (
                  <div
                    key={card.id}
                    className="rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-3 flex items-start justify-between gap-2"
                  >
                    <label className="flex items-start gap-2.5 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={card.enabled}
                        onChange={() => handleToggleCardEnabled(card.id)}
                        className="mt-1 w-4 h-4 accent-amber-500 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <span>{card.title}</span>
                          {isUsed && <span className="text-[10px] text-slate-500">(مصرف‌شده)</span>}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {card.description}
                        </p>
                      </div>
                    </label>

                    {!card.isBuiltIn && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCard(card.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 cursor-pointer shrink-0"
                        title="حذف کارت سفارشی"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] p-3.5 space-y-2.5">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">افزودن کارت حرکت آخر سفارشی</div>
              <input
                type="text"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="نام کارت (مثلاً: عفو شهر)"
                className="w-full min-h-[40px] rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500/60"
              />
              <textarea
                rows={2}
                value={newCardDesc}
                onChange={(e) => setNewCardDesc(e.target.value)}
                placeholder="توضیح اثر کارت در بازی..."
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500/60"
              />
              <button
                type="button"
                onClick={handleAddCustomCard}
                className="w-full min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                افزودن به دسته کارت‌ها
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={drawRandomLastMove}
                disabled={availableCards.length === 0}
                className="flex-1 min-h-[50px] rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>کشیدن کارت حرکت آخر تصادفی</span>
              </button>
              {usedCardIds.length > 0 && (
                <button
                  type="button"
                  onClick={onResetUsedCards}
                  className="min-h-[50px] px-3 rounded-2xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-[#090B10] hover:bg-slate-200 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                  title="برگرداندن کارت‌های مصرف‌شده"
                >
                  ریست دسته
                </button>
              )}
            </div>

            {drawnCard && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">کارت انتخاب‌شده:</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{drawnCard.title}</div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{drawnCard.description}</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-white/8">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">یا انتخاب دستی کارت برای بازیکن خروجی:</div>
              <div className="flex flex-wrap gap-1.5">
                {availableCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setDrawnCard(card);
                      onMarkCardUsed(card.id);
                    }}
                    className="px-3 py-2 min-h-[36px] rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    {card.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Confirm Elimination + Optional Last Move Modal */}
      {pendingEliminatePlayer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 dark:bg-black/75 backdrop-blur-sm sm:p-4">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              خروج «{pendingEliminatePlayer.playerName}» با رأی دادگاه
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              می‌توانید قبل از ثبت خروج، یک کارت حرکت آخر بکشید یا مستقیماً بازیکن را خارج کنید.
            </p>

            {drawnCard ? (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-1.5">
                <div className="text-sm font-extrabold text-amber-800 dark:text-amber-300">{drawnCard.title}</div>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">{drawnCard.description}</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={drawRandomLastMove}
                disabled={availableCards.length === 0}
                className="w-full min-h-[46px] rounded-xl border border-amber-500/40 dark:border-amber-500/35 bg-amber-500/12 hover:bg-amber-500/20 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>کشیدن کارت حرکت آخر تصادفی ({toPersianDigits(availableCards.length)} کارت)</span>
              </button>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmElimination}
                className="flex-1 min-h-[48px] rounded-xl bg-rose-600 dark:bg-rose-500 hover:bg-rose-500 dark:hover:bg-rose-400 text-white font-bold text-sm cursor-pointer"
              >
                تایید خروج بازیکن
              </button>
              <button
                type="button"
                onClick={() => setPendingEliminatePlayer(null)}
                className="min-h-[48px] px-5 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer"
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
