import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Dices,
  ExternalLink,
  Film,
  MapPin,
  Navigation,
  Phone,
  Users,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { toPersianDigits } from '../../utils/persian';
import { BrandLogo } from '../BrandLogo';

interface CafeAboutScreenProps {
  hapticEnabled?: boolean;
  onBack: () => void;
}

const CAFE_PHONE_RAW = '09129303751';
const CAFE_PHONE_DISPLAY = toPersianDigits(CAFE_PHONE_RAW);
const CAFE_ADDRESS =
  'تهران، میدان توحید، خیابان اسکندری شمالی، تقاطع فرصت شیرازی، خیابان امیرلو (بین سبزه‌زار و اسکندری)، پلاک ۶، طبقه ۱ (زنگ دیالوگ)';
const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=%D8%AA%D9%87%D8%B1%D8%A7%D9%86+%D8%AE%DB%8C%D8%A7%D8%A8%D8%A7%D9%86+%D8%A7%D9%85%DB%8C%D8%B1%D9%84%D9%88+%D9%BE%D9%84%D8%A7%DA%A9+6+%DA%A9%D8%A7%D9%81%D9%87+%D8%A8%D8%A7%D8%B2%DB%8C+%D8%AF%DB%8C%D8%A7%D9%84%D9%88%DA%AF';
const NESHAN_URL =
  'https://neshan.org/maps/search/%DA%A9%D8%A7%D9%81%D9%87%20%D8%A8%D8%A7%D8%B2%DB%8C%20%D8%AF%DB%8C%D8%A7%D9%84%D9%88%DA%AF%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%20%D8%A7%D9%85%DB%8C%D8%B1%D9%84%D9%88';
const BALAD_URL =
  'https://balad.ir/search?query=%DA%A9%D8%A7%D9%81%D9%87%20%D8%A8%D8%A7%D8%B2%DB%8C%20%D8%AF%DB%8C%D8%A7%D9%84%D9%88%DA%AF%20%D8%AA%D9%87%D8%B1%D8%A7%D9%86%20%D8%A7%D9%85%DB%8C%D8%B1%D9%84%D9%88';

export const CafeAboutScreen: React.FC<CafeAboutScreenProps> = ({
  hapticEnabled = true,
  onBack,
}) => {
  const [copiedField, setCopiedField] = useState<'phone' | 'address' | null>(null);

  const handleCopy = async (text: string, field: 'phone' | 'address') => {
    triggerHaptic('tap', hapticEnabled);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      window.setTimeout(() => {
        setCopiedField((prev) => (prev === field ? null : prev));
      }, 2000);
    } catch {
      // Clipboard API unavailable in restricted environments
    }
  };

  return (
    <div className="relative z-10 min-h-dvh w-full overflow-x-hidden flex flex-col bg-transparent text-slate-900 dark:text-slate-100 pb-safe pb-12 transition-colors">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 pt-safe bg-white/85 dark:bg-[#090B10]/85 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-3 sm:px-6">
        <div className="w-full max-w-3xl mx-auto h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('tap', hapticEnabled);
                onBack();
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-[#161B28] text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="بازگشت به صفحه اصلی"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
              کافه دیالوگ
            </h1>
          </div>
        </div>
      </header>

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 flex-1 flex flex-col gap-4">
        {/* Hero Brand Card */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/14 bg-white/95 dark:bg-[#121620]/95 p-5 sm:p-6 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-4">
            <BrandLogo size="lg" />
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                کافه بازی دیالوگ
              </h2>
              <p
                className="text-xs sm:text-sm font-extrabold tracking-wider text-[#C4161C] dark:text-red-400 mt-0.5"
                dir="ltr"
              >
                Dialogue Game Club
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
            کافه دیالوگ پاتوق تخصصی بازی‌های گروهی، رویدادهای حرفه‌ای مافیا، بردگیم و دورهمی‌های
            دوستانه در تهران است؛ فضایی مجهز و دنج برای اجرای سناریوهای شبانه و رقابت‌های گروهی.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#0D1018] p-3 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ایونت‌های مافیا و سناریو
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#0D1018] p-3 flex items-center gap-2.5">
              <Dices className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                بردگیم و بازی‌های فکری
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#0D1018] p-3 flex items-center gap-2.5">
              <Film className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                نمایش و نقد فیلم
              </span>
            </div>
          </div>
        </section>

        {/* Phone Contact Card */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/14 bg-white/95 dark:bg-[#121620]/95 p-5 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  شماره تماس و رزرو
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  برای هماهنگی میز و شرکت در سانس‌های مافیا
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`tel:${CAFE_PHONE_RAW}`}
              onClick={() => triggerHaptic('confirm', hapticEnabled)}
              className="flex-1 min-w-[200px] min-h-[48px] px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 active:scale-[0.98] text-white dark:text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            >
              <Phone className="w-4 h-4 shrink-0" />
              <span className="tabular-nums" dir="ltr">
                {CAFE_PHONE_DISPLAY}
              </span>
            </a>

            <button
              type="button"
              onClick={() => handleCopy(CAFE_PHONE_RAW, 'phone')}
              className="min-h-[48px] px-4 rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-[#171D2B] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {copiedField === 'phone' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>کپی شماره</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Address & Location Navigation Card */}
        <section className="rounded-3xl border border-slate-200 dark:border-white/14 bg-white/95 dark:bg-[#121620]/95 p-5 shadow-sm dark:shadow-none space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  آدرس و لوکیشن
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  محدوده میدان توحید · اسکندری شمالی
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(CAFE_ADDRESS, 'address')}
              className="min-h-[40px] px-3 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-[#171D2B] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-100 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              {copiedField === 'address' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>کپی آدرس</span>
                </>
              )}
            </button>
          </div>

          <p className="rounded-2xl border border-slate-200 dark:border-white/12 bg-slate-50 dark:bg-[#0D1018] p-3.5 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {CAFE_ADDRESS}
          </p>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>مسیریابی روی نقشه:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic('tap', hapticEnabled)}
                className="min-h-[46px] px-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>گوگل مپس</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              <a
                href={NESHAN_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic('tap', hapticEnabled)}
                className="min-h-[46px] px-3.5 rounded-2xl border border-blue-500/35 bg-blue-500/12 hover:bg-blue-500/20 text-blue-800 dark:text-blue-200 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Navigation className="w-4 h-4 shrink-0" />
                <span>مسیریاب نشان</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              <a
                href={BALAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic('tap', hapticEnabled)}
                className="min-h-[46px] px-3.5 rounded-2xl border border-emerald-500/35 bg-emerald-500/12 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Navigation className="w-4 h-4 shrink-0" />
                <span>مسیریاب بلد</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
