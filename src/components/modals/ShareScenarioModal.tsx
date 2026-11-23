import React, { useState } from 'react';
import { Check, Copy, Download, FileText, Share2, X } from 'lucide-react';
import { Scenario } from '../../types/game';
import {
  downloadScenarioPersianTextFile,
  encodeScenarioShareCode,
  serializeScenarioToPersianText,
} from '../../utils/share';

interface ShareScenarioModalProps {
  scenario: Scenario;
  onClose: () => void;
}

export const ShareScenarioModal: React.FC<ShareScenarioModalProps> = ({
  scenario,
  onClose,
}) => {
  const [persianText, setPersianText] = useState(() => serializeScenarioToPersianText(scenario));
  const [copiedType, setCopiedType] = useState<'text' | 'code' | null>(null);

  const shareCode = encodeScenarioShareCode(scenario);
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const copyText = async (text: string, type: 'text' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      window.setTimeout(() => setCopiedType(null), 2200);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedType(type);
      window.setTimeout(() => setCopiedType(null), 2200);
    }
  };

  const handleDownloadEditedTxt = () => {
    // If user didn't modify text, use helper; if modified, download exact edited text
    if (persianText === serializeScenarioToPersianText(scenario)) {
      downloadScenarioPersianTextFile(scenario);
      return;
    }
    const blob = new Blob(['\uFEFF' + persianText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `سناریوی ${scenario.name} — دیالوگ`,
        text: persianText,
      });
    } catch {
      // User cancelled native share sheet
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-5 sm:p-6 shadow-2xl max-h-[92dvh] flex flex-col">
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              اشتراک و خروجی فایل متنی فارسی
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3 shrink-0">
          تمام تنظیمات، سطوح سه‌گانه، نقش‌ها، رنگ‌ها، آیکون‌ها، توضیحات و قوانین در قالب متن فارسی زیر آماده است و می‌توانید پیش از ارسال یا دانلود فایل `.txt` آن را مستقیماً ویرایش کنید:
        </p>

        <textarea
          rows={9}
          value={persianText}
          onChange={(e) => setPersianText(e.target.value)}
          dir="rtl"
          className="w-full rounded-2xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] p-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-none focus:border-amber-500 resize-y flex-1 min-h-[180px]"
        />

        <div className="mt-4 space-y-2.5 shrink-0">
          {canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>ارسال مستقیم (واتساپ، تلگرام، بلوتوث...)</span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownloadEditedTxt}
              className={`min-h-[48px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer ${
                canNativeShare
                  ? 'border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-[#0C0F17] hover:bg-slate-200 dark:hover:bg-white/5 text-slate-800 dark:text-slate-100'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل متنی (.txt)</span>
            </button>

            <button
              type="button"
              onClick={() => copyText(persianText, 'text')}
              className="min-h-[48px] rounded-xl border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-[#0C0F17] hover:bg-slate-200 dark:hover:bg-white/5 text-slate-800 dark:text-slate-100 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedType === 'text' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-300">متن فارسی کپی شد</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>کپی کل متن فارسی</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => copyText(shareCode, 'code')}
            className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedType === 'code' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">کد فشرده RN2 کپی شد</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>کپی کد فشرده تک‌خطی (RN2)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
