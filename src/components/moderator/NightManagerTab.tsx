import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Crosshair,
  HeartPulse,
  Lock,
  Moon,
  Search,
  Shield,
  Skull,
  Sparkles,
} from 'lucide-react';
import { ActiveGameSession, PlayerTrackerState } from '../../types/game';
import { computeDetectiveInquiry, toPersianDigits } from '../../utils/persian';

export interface NightResolutionPayload {
  eliminatedNumbers: number[];
  silencedNumber: number | null;
  summaryLines: string[];
  announcementText: string;
}

interface NightManagerTabProps {
  session: ActiveGameSession | null;
  roundNumber: number;
  players: PlayerTrackerState[];
  defaultSniperPenalty: boolean;
  onApplyNightOutcome: (payload: NightResolutionPayload) => void;
}

type PlayerSelectValue = number | null;

export const NightManagerTab: React.FC<NightManagerTabProps> = ({
  session,
  roundNumber,
  players,
  defaultSniperPenalty,
  onApplyNightOutcome,
}) => {
  const alivePlayers = players.filter((p) => p.isAlive);

  const [mafiaShot, setMafiaShot] = useState<PlayerSelectValue>(null);
  const [lecterSave, setLecterSave] = useState<PlayerSelectValue>(null);
  const [doctorSave, setDoctorSave] = useState<PlayerSelectValue>(null);
  const [detectiveTarget, setDetectiveTarget] = useState<PlayerSelectValue>(null);
  const [sniperShot, setSniperShot] = useState<PlayerSelectValue>(null);
  const [silenceTarget, setSilenceTarget] = useState<PlayerSelectValue>(null);
  const [sniperSelfPenalty, setSniperSelfPenalty] = useState(defaultSniperPenalty);
  const [lastPreview, setLastPreview] = useState<NightResolutionPayload | null>(null);

  const getPlayerLabel = (num: number | null) => {
    if (num === null) return 'هیچ‌کس';
    const found = players.find((p) => p.playerNumber === num);
    return found ? `${toPersianDigits(num)}. ${found.playerName}` : `بازیکن ${toPersianDigits(num)}`;
  };

  // Compute instant Detective Inquiry when a target is selected
  const detectiveDealt =
    detectiveTarget !== null
      ? session?.deck.find((d) => d.playerNumber === detectiveTarget)
      : undefined;
  const detectiveResult = detectiveDealt
    ? computeDetectiveInquiry(detectiveDealt.role)
    : null;

  const computeNightPreview = (): NightResolutionPayload => {
    const eliminatedSet = new Set<number>();
    const summaryLines: string[] = [];

    // 1. Mafia Shot vs Doctor Save
    if (mafiaShot !== null) {
      const targetTracker = players.find((p) => p.playerNumber === mafiaShot);
      if (doctorSave === mafiaShot) {
        summaryLines.push(
          `شلیک مافیا به «${getPlayerLabel(mafiaShot)}» توسط پزشک شهر سیو شد.`
        );
      } else if (targetTracker?.isShielded) {
        summaryLines.push(
          `شلیک مافیا به «${getPlayerLabel(mafiaShot)}» به دلیل جلیقه/سپرسازی ناکام ماند.`
        );
      } else {
        eliminatedSet.add(mafiaShot);
        summaryLines.push(`«${getPlayerLabel(mafiaShot)}» با شلیک مافیا از بازی خارج شد.`);
      }
    } else {
      summaryLines.push('مافیا امشب شلیکی نداشت.');
    }

    // 2. Sniper / Professional Shot vs Lecter Save
    if (sniperShot !== null) {
      if (lecterSave === sniperShot) {
        summaryLines.push(
          `تیر تک‌تیرانداز/حرفه‌ای به «${getPlayerLabel(sniperShot)}» توسط دکتر لکتر سیو شد.`
        );
      } else {
        const sniperDealt = session?.deck.find((d) => d.playerNumber === sniperShot);
        const sniperCheck = sniperDealt ? computeDetectiveInquiry(sniperDealt.role) : null;
        if (sniperCheck && !sniperCheck.isPositive && sniperSelfPenalty) {
          summaryLines.push(
            `تیر خطای تک‌تیرانداز به شهروند (${getPlayerLabel(sniperShot)}) — مطابق قانون میز، خود تک‌تیرانداز خارج می‌شود (یا هدف زنده می‌ماند).`
          );
        } else {
          eliminatedSet.add(sniperShot);
          summaryLines.push(
            `«${getPlayerLabel(sniperShot)}» با شلیک تک‌تیرانداز/کماندو خارج شد.`
          );
        }
      }
    }

    // 3. Detective log
    if (detectiveTarget !== null) {
      summaryLines.push(
        `کارآگاه استعلام «${getPlayerLabel(detectiveTarget)}» را گرفت: ${
          detectiveResult ? detectiveResult.label : 'ثبت شد'
        }.`
      );
    }

    // 4. Silence / Lock log
    if (silenceTarget !== null) {
      summaryLines.push(`«${getPlayerLabel(silenceTarget)}» امشب قفل/سایلنت شد.`);
    }

    const eliminatedNumbers = Array.from(eliminatedSet);
    const announcementText =
      eliminatedNumbers.length === 0
        ? 'صبح بخیر شهر! دیشب کشته نداشتیم.'
        : `صبح شد؛ دیشب ${eliminatedNumbers.map((n) => getPlayerLabel(n)).join(' و ')} از بازی خارج ${
            eliminatedNumbers.length > 1 ? 'شدند' : 'شد'
          }.`;

    return {
      eliminatedNumbers,
      silencedNumber: silenceTarget,
      summaryLines,
      announcementText,
    };
  };

  const handleConfirmNight = () => {
    const payload = computeNightPreview();
    setLastPreview(payload);
    onApplyNightOutcome(payload);
    setMafiaShot(null);
    setLecterSave(null);
    setDoctorSave(null);
    setDetectiveTarget(null);
    setSniperShot(null);
    setSilenceTarget(null);
  };

  const renderSelect = (
    label: string,
    icon: React.ReactNode,
    value: PlayerSelectValue,
    onChange: (val: PlayerSelectValue) => void,
    accentClass: string,
    hint?: string
  ) => (
    <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0B0E15] p-3.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className={`text-xs sm:text-sm font-bold flex items-center gap-2 ${accentClass}`}>
          {icon}
          <span>{label}</span>
        </label>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </div>

      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] px-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500/60 cursor-pointer"
      >
        <option value="" className="bg-white dark:bg-[#121620] text-slate-900 dark:text-slate-100">
          — انتخاب نشده / انجام نشد —
        </option>
        {alivePlayers.map((p) => (
          <option
            key={p.playerNumber}
            value={p.playerNumber}
            className="bg-white dark:bg-[#121620] text-slate-900 dark:text-slate-100"
          >
            {toPersianDigits(p.playerNumber)}. {p.playerName}
          </option>
        ))}
      </select>
    </div>
  );

  const preview = computeNightPreview();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Night Action Steps */}
      <section className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Moon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>مدیریت هوشمند شب {toPersianDigits(roundNumber)}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              اقدامات شبانه را ثبت کنید تا نتیجه خروج، سیو و استعلام به‌طور خودکار محاسبه شود
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {renderSelect(
            'شلیک مافیا',
            <Skull className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
            mafiaShot,
            setMafiaShot,
            'text-rose-700 dark:text-rose-300',
            'حذف شبانه'
          )}

          {renderSelect(
            'سیو دکتر لکتر',
            <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />,
            lecterSave,
            setLecterSave,
            'text-red-700 dark:text-red-300',
            'محافظت یار مافیا'
          )}

          {renderSelect(
            'سیو پزشک شهر',
            <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
            doctorSave,
            setDoctorSave,
            'text-emerald-700 dark:text-emerald-300',
            'نجات از شلیک'
          )}

          {renderSelect(
            'تیر تک‌تیرانداز / حرفه‌ای',
            <Crosshair className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
            sniperShot,
            setSniperShot,
            'text-cyan-700 dark:text-cyan-300',
            'اختیاری'
          )}

          {renderSelect(
            'استعلام کارآگاه',
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
            detectiveTarget,
            setDetectiveTarget,
            'text-blue-700 dark:text-blue-300',
            'محاسبه خودکار'
          )}

          {renderSelect(
            'سایلنت / گروگان‌گیر / شب‌خسب',
            <Lock className="w-4 h-4 text-violet-600 dark:text-violet-400" />,
            silenceTarget,
            setSilenceTarget,
            'text-violet-700 dark:text-violet-300',
            'اختیاری'
          )}
        </div>

        {/* Instant Detective Inquiry Computation Card */}
        {detectiveTarget !== null && (
          <div
            className={`rounded-2xl border p-4 space-y-1 ${
              detectiveResult?.isPositive
                ? 'border-rose-500/40 bg-rose-500/10'
                : 'border-emerald-500/35 bg-emerald-500/10'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                پاسخ استعلام برای «{getPlayerLabel(detectiveTarget)}»:
              </span>
              <span
                className={`text-sm font-extrabold ${
                  detectiveResult?.isPositive
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {detectiveResult ? detectiveResult.label : 'نقش در این جلسه توزیع نشده'}
              </span>
            </div>
            {detectiveResult && (
              <p className="text-xs text-slate-600 dark:text-slate-300/90 leading-relaxed">{detectiveResult.note}</p>
            )}
          </div>
        )}

        <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 pt-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sniperSelfPenalty}
            onChange={(e) => setSniperSelfPenalty(e.target.checked)}
            className="w-4 h-4 accent-amber-500 rounded"
          />
          <span>قانون میز: تیر خطای تک‌تیرانداز به شهروند باعث خروج شهروند نشود</span>
        </label>
      </section>

      {/* Night Outcome Preview & Apply */}
      <section className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-sm dark:shadow-none">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>پیش‌نمایش نتیجه صبح</span>
        </h3>

        <div className="rounded-2xl border border-amber-500/30 dark:border-amber-500/25 bg-slate-50 dark:bg-[#090B10] p-4 space-y-3">
          <p className="text-sm font-extrabold text-amber-800 dark:text-amber-300 leading-relaxed">
            {preview.announcementText}
          </p>

          <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-white/8 pt-3">
            {preview.summaryLines.map((line, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={handleConfirmNight}
          className="w-full min-h-[54px] rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/15"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>ثبت وقایع شب و اعلام صبح</span>
        </button>

        {lastPreview && (
          <div className="rounded-xl border border-emerald-500/30 dark:border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
            آخرین شب ثبت‌شده: {lastPreview.announcementText}
          </div>
        )}
      </section>
    </div>
  );
};
