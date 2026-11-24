import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Gavel,
  GraduationCap,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { toPersianDigits } from '../../utils/persian';
import { playTimerEndAlarm, unlockAudioContext } from '../../utils/soundEngine';

interface InAppGuideModalProps {
  onClose: () => void;
  onDismissBanner?: () => void;
  initialStep?: number;
}

interface GuideStep {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentClass: string;
  points: { heading: string; detail: string }[];
  proTip: string;
  hasSoundTest?: boolean;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: 'گام ۱: انتخاب سناریو، سطح و بازیکنان',
    subtitle: 'آماده‌سازی سریع قبل از شروع دور',
    icon: <Users className="w-6 h-6 text-amber-400" />,
    accentClass: 'border-amber-500/35 bg-amber-500/12',
    points: [
      {
        heading: '۳ سطح برای هر سناریو',
        detail:
          'در صفحه تنظیم بازی می‌توانید سطح (پایه، پیشرفته یا فوق پیشرفته) را انتخاب کنید؛ تعداد هر نقش و حتی آیکون و رنگ آن را هم می‌توانید جداگانه تغییر دهید.',
      },
      {
        heading: 'تعیین تعداد بازیکنان و تعادل نقش‌ها',
        detail:
          'تعداد نفرات میز را کم یا زیاد کنید تا مجموع نقش‌ها با تعداد بازیکنان برابر شود؛ صندلی‌ها به‌صورت خودکار شماره‌گذاری می‌شوند.',
      },
      {
        heading: 'ویرایش متنی فارسی و اشتراک‌گذاری',
        detail:
          'هر سناریو را می‌توانید به‌صورت فایل متنی فارسی (.txt) ویرایش، ذخیره یا در پیام‌رسان‌ها برای دوستان بفرستید.',
      },
    ],
    proTip:
      'روی کارت سناریو بزنید، تعداد بازیکنان و ترکیب نقش‌ها را تایید کنید و دکمه «توزیع نقش‌ها و شروع» را بزنید تا بازی بلافاصله آماده شود.',
  },
  {
    title: 'گام ۲: توزیع و نمایش محرمانه نقش‌ها',
    subtitle: 'گرداندن گوشی بین بازیکنان در تاریکی',
    icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
    accentClass: 'border-emerald-500/35 bg-emerald-500/12',
    points: [
      {
        heading: 'آماده‌سازی و نمایش نوبت هر بازیکن',
        detail:
          'پس از زدن دکمه «توزیع نقش»، در نوبت هر صندلی با لمس صفحه، کارت نقش شامل شماره صندلی و ساید، عنوان نقش، آیکون و توضیحات نمایش داده می‌شود.',
      },
      {
        heading: 'قفل یک‌طرفه و بدون بازگشت',
        detail:
          'پس از زدن دکمه «متوجه شدم / نفر بعدی» زیر کارت، نقش مخفی شده و نوبت بازیکن بعدی می‌شود؛ امکان بازگشت به نقش نفر قبلی وجود ندارد.',
      },
      {
        heading: 'بُر زدن مجدد و خروج اضطراری گاد',
        detail:
          'پیش از شروع توزیع می‌توانید نقش‌ها را دوباره بُر بزنید یا قوانین شب را ببینید. حین توزیع نیز دکمه «نگه‌دارید برای خروج» با ۱.۲ ثانیه نگه‌داشتن توزیع را لغو می‌کند.',
      },
    ],
    proTip:
      'پیش از زدن «توزیع نقش»، می‌توانید هر چند بار که خواستید دکمه «بُر زدن مجدد» را بزنید تا چیدمان کاملاً تصادفی تازه‌ای بسازید.',
  },
  {
    title: 'گام ۳: تایمر صحبت، کلام آخر و آهنگ شب',
    subtitle: 'کنترل ریتم صحبت‌ها با زنگ پذیرش هتل و موزیک شب',
    icon: <Timer className="w-6 h-6 text-amber-400" />,
    accentClass: 'border-amber-500/35 bg-amber-500/12',
    points: [
      {
        heading: 'زنگ پذیرش هتل در شروع کلام آخر و پایان وقت',
        detail:
          'هنگام ورود به زمان «کلام آخر» (پیش‌فرض ۱۰ ثانیه آخر؛ قابل تغییر به ۳، ۵، ۱۰ ثانیه یا غیرفعال در تنظیمات)، رنگ تایمر کهربایی شده و زنگ پذیرش هتل یک بار نواخته می‌شود؛ در پایان وقت نیز زنگ دو بار به صدا درمی‌آید.',
      },
      {
        heading: 'زمان‌های آماده و کلید بی‌صدا',
        detail:
          'دکمه‌های آماده (پیش‌فرض ۱۵، ۳۰ و ۶۰ ثانیه و قابل ویرایش در تنظیمات)، کلید فعال/غیرفعال «کلام آخر» و دکمه بلندگو برای بی‌صدا کردن زنگ زیر کادر تایمر قرار دارند.',
      },
      {
        heading: 'پخش آهنگ شب دلخواه از گوشی (ضد نجوا)',
        detail:
          'آهنگ‌های دلخواه خود را از حافظه گوشی اضافه کنید تا در فاز شب برای پوشاندن صداها به‌صورت چرخه‌ای پخش شوند و بلندی صدای آن را تنظیم کنید.',
      },
    ],
    proTip:
      'اگر صدای زنگ پخش نشد، دکمه بلندگو روبه‌روی «کلام آخر» را چک کنید که در حالت بی‌صدا نباشد و صدای گوشی را بررسی کنید.',
    hasSoundTest: true,
  },
  {
    title: 'گام ۴: تنظیمات',
    subtitle: 'شخصی‌سازی صدا، تایمر، پس‌زمینه و نصب برنامه',
    icon: <SlidersHorizontal className="w-6 h-6 text-violet-400" />,
    accentClass: 'border-violet-500/35 bg-violet-500/12',
    points: [
      {
        heading: 'تنظیمات یکپارچه صدا، تایمر، پس‌زمینه و ظاهر',
        detail:
          'در بخش تنظیمات (شخصی‌سازی) می‌توانید آهنگ‌های شب و زنگ دلخواه تایمر را از گوشی اضافه کنید، زمان پیش‌فرض و میان‌برهای تایمر و مدت کلام آخر را تغییر دهید، تصویر پس‌زمینه دلخواه بگذارید و بین حالت «روز» و «شب» جابه‌جا شوید.',
      },
    ],
    proTip:
      'برای اجرای دائمی و تمام‌صفحه بدون اینترنت روی اندروید و آیفون، از دکمه «نصب» در بالای صفحه اصلی استفاده کنید.',
  },
];

export const InAppGuideModal: React.FC<InAppGuideModalProps> = ({
  onClose,
  onDismissBanner,
  initialStep = 0,
}) => {
  const [stepIdx, setStepIdx] = useState(
    Math.max(0, Math.min(GUIDE_STEPS.length - 1, initialStep))
  );

  const current = GUIDE_STEPS[stepIdx];
  const isFirst = stepIdx === 0;
  const isLast = stepIdx === GUIDE_STEPS.length - 1;

  const handleCloseDone = () => {
    onDismissBanner?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/85 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-xl max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/18 bg-white dark:bg-[#121620] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/12 flex items-center justify-between gap-3 shrink-0 bg-slate-50 dark:bg-[#151A26]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white truncate">
                راهنمای گام‌به‌گام دیالوگ
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
                گام {toPersianDigits(stepIdx + 1)} از {toPersianDigits(GUIDE_STEPS.length)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-[#1B2130] text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
            aria-label="بستن راهنما"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Quick Jump Pills */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-[#0E121B] shrink-0">
          <div className="grid grid-cols-4 gap-1.5">
            {GUIDE_STEPS.map((_, idx) => {
              const active = idx === stepIdx;
              const visited = idx < stepIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setStepIdx(idx)}
                  className={`min-h-[40px] rounded-xl text-xs font-extrabold tabular-nums transition-all cursor-pointer border ${
                    active
                      ? 'bg-amber-500 border-amber-500 dark:border-amber-400 text-slate-950 shadow-sm'
                      : visited
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-200 hover:bg-emerald-500/25'
                      : 'bg-white dark:bg-[#171C28] border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10'
                  }`}
                >
                  گام {toPersianDigits(idx + 1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${current.accentClass}`}
            >
              {current.icon}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                {current.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">{current.subtitle}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {current.points.map((pt, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-white/14 bg-slate-50 dark:bg-[#0B0E15] p-3.5 space-y-1"
              >
                <div className="text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>{pt.heading}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed pr-6">
                  {pt.detail}
                </p>
              </div>
            ))}
          </div>

          {current.hasSoundTest && (
            <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-3.5 flex flex-wrap items-center justify-between gap-2.5">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-200">
                تست زنگ پذیرش هتل (کلام آخر و پایان زمان):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    unlockAudioContext();
                    void playTimerEndAlarm('bell', 1);
                  }}
                  className="min-h-[42px] px-3 rounded-xl border border-amber-500/40 bg-white dark:bg-[#151A26] hover:bg-amber-50 dark:hover:bg-[#1E2536] text-xs font-bold text-amber-800 dark:text-amber-200 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>شروع کلام آخر (۱ زنگ)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    unlockAudioContext();
                    void playTimerEndAlarm('bell', 2);
                  }}
                  className="min-h-[42px] px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>پایان زمان (۲ زنگ)</span>
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs sm:text-sm text-blue-900 dark:text-blue-100 leading-relaxed flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-800 dark:text-blue-200">نکته حرفه‌ای گاد: </strong>
              {current.proTip}
            </div>
          </div>
        </div>

        {/* Footer Navigation (Thumb-friendly large buttons) */}
        <div className="px-5 py-4 pb-safe border-t border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#151A26] flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            disabled={isFirst}
            className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-white/18 bg-white dark:bg-[#1C2232] hover:bg-slate-100 dark:hover:bg-[#242B3E] disabled:opacity-35 text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowRight className="w-4 h-4" />
            <span>قبلی</span>
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.min(GUIDE_STEPS.length - 1, i + 1))}
              className="flex-1 min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>گام بعدی</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCloseDone}
              className="flex-1 min-h-[48px] rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Gavel className="w-4 h-4" />
              <span>بسیار خب، بریم برای بازی!</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
