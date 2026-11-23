import React, { useRef, useState } from 'react';
import { Download, FileText, FileUp, X } from 'lucide-react';
import { Scenario } from '../../types/game';
import { decodeScenarioInput } from '../../utils/share';

interface ImportScenarioModalProps {
  onImport: (scenario: Scenario) => void;
  onClose: () => void;
}

const SAMPLE_PERSIAN_TEMPLATE = `=== سناریو دیالوگ ===
نام سناریو: سناریوی نمونه سفارشی
معرفی کوتاه: سناریوی دورهمی با قابلیت ویرایش کامل متنی

--- سطح: پایه ---
تعداد بازیکنان: ۱۰
یادداشت سطح: ۳ مافیا · ۷ شهروند
نقش: رئیس مافیا | تعداد: ۱ | رنگ: قرمز | آیکون: رئیس / فرمانده | توضیح: فرمانده مافیا با استعلام منفی.
نقش: مافیای ساده | تعداد: ۲ | رنگ: زرشکی | آیکون: مافیا / قاتل | توضیح: هم‌تیمی رئیس در فاز شب.
نقش: کارآگاه | تعداد: ۱ | رنگ: آبی | آیکون: کارآگاه / محقق | توضیح: استعلام شبانه از گرداننده.
نقش: پزشک | تعداد: ۱ | رنگ: زمردی | آیکون: پزشک / درمانگر | توضیح: نجات یک نفر در شب.
نقش: شهروند ساده | تعداد: ۵ | رنگ: نقره‌ای | آیکون: شهروند / روستایی | توضیح: کشف مافیا با رأی‌گیری روز.

--- سطح: پیشرفته ---
تعداد بازیکنان: ۱۲
یادداشت سطح: ۳ مافیا + ۱ دزد خاموش
نقش: رئیس مافیا | تعداد: ۱ | رنگ: قرمز | آیکون: رئیس / فرمانده | توضیح: فرمانده مافیا با استعلام منفی.
نقش: مافیای ساده | تعداد: ۲ | رنگ: زرشکی | آیکون: مافیا / قاتل | توضیح: هم‌تیمی رئیس در فاز شب.
نقش: دزد | تعداد: ۱ | رنگ: بنفش | آیکون: دزد / شیاد / ناتو | توضیح: اکت نفر اول را می‌دزدد و روی نفر دوم اعمال می‌کند.
نقش: کارآگاه | تعداد: ۱ | رنگ: آبی | آیکون: کارآگاه / محقق | توضیح: استعلام شبانه از گرداننده.
نقش: پزشک | تعداد: ۱ | رنگ: زمردی | آیکون: پزشک / درمانگر | توضیح: نجات یک نفر در شب.
نقش: شهروند ساده | تعداد: ۶ | رنگ: نقره‌ای | آیکون: شهروند / روستایی | توضیح: شهروند ساده.

--- سطح: فوق پیشرفته ---
تعداد بازیکنان: ۱۵
یادداشت سطح: ۴ مافیا + ۱ دزد · ۱۰ شهروند
نقش: رئیس مافیا | تعداد: ۱ | رنگ: قرمز | آیکون: رئیس / فرمانده | توضیح: فرمانده مافیا با استعلام منفی.
نقش: مافیای ساده | تعداد: ۳ | رنگ: زرشکی | آیکون: مافیا / قاتل | توضیح: اعضای تیم مافیا.
نقش: دزد | تعداد: ۱ | رنگ: بنفش | آیکون: دزد / شیاد / ناتو | توضیح: مافیای خاموش.
نقش: کارآگاه | تعداد: ۱ | رنگ: آبی | آیکون: کارآگاه / محقق | توضیح: استعلام شبانه.
نقش: پزشک | تعداد: ۱ | رنگ: زمردی | آیکون: پزشک / درمانگر | توضیح: نجات شبانه.
نقش: تکاور / اسنایپر | تعداد: ۱ | رنگ: طلایی | آیکون: تکاور / اسنایپر | توضیح: شلیک شبانه.
نقش: شهروند ساده | تعداد: ۷ | رنگ: نقره‌ای | آیکون: شهروند / روستایی | توضیح: شهروند عادی.

--- قوانین و راهنما ---
معرفی کلی: یک سناریوی نمونه که می‌توانید تمام بخش‌های آن را در فایل متنی ویرایش کنید.
شرایط پیروزی:
- شهروندان با حذف تمام مافیاها و دزد برنده می‌شوند.
ترتیب بیداری شب:
- ۱. دزد
- ۲. مافیا
- ۳. کارآگاه و پزشک`;

export const ImportScenarioModal: React.FC<ImportScenarioModalProps> = ({
  onImport,
  onClose,
}) => {
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportText = () => {
    try {
      const scenario = decodeScenarioInput(inputText);
      onImport(scenario);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در خواندن سناریو');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = String(reader.result ?? '');
        const scenario = decodeScenarioInput(content);
        onImport(scenario);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فایل انتخاب‌شده معتبر نیست.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-5 sm:p-6 shadow-2xl max-h-[92dvh] flex flex-col">
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">درون‌ریزی سناریو (متن یا فایل)</h2>
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

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3 shrink-0">
          متن فارسی سناریو (یا کد `RN2:...`) را اینجا جای‌گذاری و ویرایش کنید یا فایل متنی `.txt` را از گوشی انتخاب نمایید.
        </p>

        {error && (
          <div className="mb-3 rounded-xl border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-200 shrink-0">
            {error}
          </div>
        )}

        <textarea
          rows={7}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="متن فارسی سناریو (=== سناریو دیالوگ ===) یا کد RN2:... را اینجا Paste کنید"
          dir="rtl"
          className="w-full rounded-xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] p-3.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-y flex-1 min-h-[150px] leading-relaxed"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.json,.ravi.json,text/plain,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-4 flex flex-col gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleImportText}
            disabled={!inputText.trim()}
            className="w-full min-h-[50px] rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-slate-950 font-extrabold text-sm cursor-pointer disabled:cursor-not-allowed"
          >
            افزودن به کتابخانه
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[48px] rounded-xl border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>انتخاب فایل (.txt / .json)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInputText(SAMPLE_PERSIAN_TEMPLATE);
                setError(null);
              }}
              className="min-h-[48px] rounded-xl border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>بارگذاری قالب نمونه فارسی</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
