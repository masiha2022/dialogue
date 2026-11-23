import React, { useState } from 'react';
import { CheckCircle2, Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="نصب آفلاین برنامه"
        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/12 px-2.5 sm:px-3 py-2 min-h-[44px] text-xs font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 active:scale-[0.98] transition-all whitespace-nowrap shrink-0 cursor-pointer"
      >
        {isInstallable ? <Download className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
        <span className="sm:hidden">نصب</span>
        <span className="hidden sm:inline">نصب آفلاین</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 dark:bg-black/80 backdrop-blur-sm sm:p-4">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-6 pb-safe shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
                نصب و اجرای کاملاً آفلاین دیالوگ
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                aria-label="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300 list-decimal list-inside">
                <li>صفحه را در مرورگر سافاری (Safari) باز کنید.</li>
                <li>دکمه اشتراک‌گذاری (Share) را در نوار پایین لمس کنید.</li>
                <li>گزینه «Add to Home Screen» را انتخاب و تایید کنید.</li>
              </ol>
            ) : (
              <div className="space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                <p>
                  برای نصب روی گوشی اندروید ۸ به بالا و اجرای دائمی بدون اینترنت:
                </p>
                <ol className="space-y-2 list-decimal list-inside text-slate-800 dark:text-slate-200">
                  <li>برنامه را مستقیماً در مرورگر کروم (Chrome) باز کنید.</li>
                  <li>از منوی سه‌نقطه بالا سمت راست، گزینه <strong>Install app</strong> یا <strong>Add to Home screen</strong> را بزنید.</li>
                  <li>آیکون «دیالوگ» روی صفحه گوشی نصب می‌شود و بدون اینترنت اجرا خواهد شد.</li>
                </ol>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>پس از یک بار باز شدن، تمام سناریوها و فایل‌ها روی دستگاه ذخیره و کش می‌شوند.</span>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
