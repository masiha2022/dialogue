import React, { useState } from 'react';
import {
  Check,
  Image as ImageIcon,
  Lightbulb,
  Minus,
  Palette,
  Plus,
  Search,
  Smile,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { ROLE_COLOR_PALETTE } from '../../data/defaultScenarios';
import { RoleDefinition, RoleIconName, RoleTeam } from '../../types/game';
import { hexToRgba, toPersianDigits } from '../../utils/persian';
import {
  compressRoleIconImage,
  ROLE_EMOJI_PRESETS,
  ROLE_ICON_OPTIONS,
  RoleIcon,
} from '../RoleIcon';

interface RoleEditModalProps {
  role: RoleDefinition;
  isNew?: boolean;
  allowCountEdit?: boolean;
  showSyncAcrossScenarios?: boolean;
  syncScenarioCount?: number;
  onSave: (updated: RoleDefinition, syncAcrossScenarios?: boolean) => void;
  onClose: () => void;
}

type IconTab = 'vector' | 'emoji' | 'image';

export const RoleEditModal: React.FC<RoleEditModalProps> = ({
  role,
  isNew = false,
  allowCountEdit = true,
  showSyncAcrossScenarios = false,
  syncScenarioCount = 0,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<RoleDefinition>({ ...role });
  const [iconTab, setIconTab] = useState<IconTab>(() =>
    role.icon.startsWith('img:')
      ? 'image'
      : role.icon.startsWith('emoji:')
      ? 'emoji'
      : 'vector'
  );
  const [iconQuery, setIconQuery] = useState('');
  const [customEmojiInput, setCustomEmojiInput] = useState(() =>
    role.icon.startsWith('emoji:') ? role.icon.slice('emoji:'.length) : ''
  );
  const [syncAcrossScenarios, setSyncAcrossScenarios] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredIcons = ROLE_ICON_OPTIONS.filter(
    (opt) =>
      !iconQuery.trim() ||
      opt.label.includes(iconQuery.trim()) ||
      opt.name.includes(iconQuery.trim().toLowerCase())
  );

  const filteredEmojis = ROLE_EMOJI_PRESETS.filter(
    (opt) => !iconQuery.trim() || opt.label.includes(iconQuery.trim()) || opt.emoji.includes(iconQuery.trim())
  );

  const handleUploadCustomImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    try {
      const iconName = await compressRoleIconImage(file);
      setDraft((prev) => ({ ...prev, icon: iconName }));
    } catch {
      setUploadError('فایل تصویر انتخاب‌شده معتبر نیست.');
    }
  };

  const handleApplyCustomEmoji = (val: string) => {
    setCustomEmojiInput(val);
    const trimmed = val.trim();
    if (trimmed) {
      setDraft((prev) => ({ ...prev, icon: `emoji:${trimmed}` as RoleIconName }));
    }
  };

  const handleConfirm = () => {
    const trimmedName = draft.name.trim();
    if (!trimmedName) {
      setError('نام نقش نمی‌تواند خالی باشد.');
      return;
    }
    onSave(
      {
        ...draft,
        name: trimmedName,
        description: draft.description.trim(),
        roleplayTip: draft.roleplayTip?.trim() || undefined,
        count: Math.max(0, draft.count),
      },
      showSyncAcrossScenarios ? syncAcrossScenarios : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:p-4">
      <div className="w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] p-5 sm:p-6 shadow-2xl max-h-[92dvh] overflow-y-auto">
        <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: hexToRgba(draft.color, 0.16),
                borderColor: hexToRgba(draft.color, 0.45),
              }}
            >
              <RoleIcon name={draft.icon} className="w-6 h-6" style={{ color: draft.color }} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {isNew ? 'افزودن نقش جدید' : `ویرایش «${role.name}»`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer shrink-0"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="role-modal-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              نام نقش
            </label>
            <input
              id="role-modal-name"
              type="text"
              value={draft.name}
              onChange={(e) => {
                setDraft({ ...draft, name: e.target.value });
                if (error) setError(null);
              }}
              placeholder="مثلاً: دزد"
              className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] px-4 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {allowCountEdit && (
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">تعداد در این سطح</span>
              <div className="flex items-center justify-between rounded-xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] p-1.5">
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, count: Math.max(1, draft.count - 1) })}
                  className="w-12 h-11 rounded-lg bg-white dark:bg-[#161B28] hover:bg-slate-100 dark:hover:bg-[#1E2536] border border-slate-200 dark:border-transparent flex items-center justify-center text-slate-800 dark:text-slate-100 cursor-pointer"
                  aria-label="کاهش تعداد نقش"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                  {toPersianDigits(draft.count)} نفر
                </span>
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, count: draft.count + 1 })}
                  className="w-12 h-11 rounded-lg bg-white dark:bg-[#161B28] hover:bg-slate-100 dark:hover:bg-[#1E2536] border border-slate-200 dark:border-transparent flex items-center justify-center text-slate-800 dark:text-slate-100 cursor-pointer"
                  aria-label="افزایش تعداد نقش"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="role-modal-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              توضیح نقش (نمایش روی کارت بازیکن)
            </label>
            <textarea
              id="role-modal-desc"
              rows={2}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="وظیفه یا قدرت نقش را بنویسید..."
              className="w-full rounded-xl border border-slate-300 dark:border-white/12 bg-slate-50 dark:bg-[#090B10] p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Roleplay Tip Field */}
          <div>
            <label htmlFor="role-modal-tip" className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>نکته ایفای بهتر نقش (اختیاری)</span>
            </label>
            <textarea
              id="role-modal-tip"
              rows={2}
              value={draft.roleplayTip ?? ''}
              onChange={(e) => setDraft({ ...draft, roleplayTip: e.target.value })}
              placeholder="مثلاً: در روز اول خودت را بی‌تفاوت نشان نده و اطلاعات استعلام را با زمان‌بندی درست مطرح کن..."
              className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/8 p-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Team & Detective Inquiry Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-3.5">
            <div>
              <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                جبهه / تیم نقش
              </span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { key: undefined, label: 'خودکار' },
                  { key: 'citizen' as RoleTeam, label: 'شهر' },
                  { key: 'mafia' as RoleTeam, label: 'مافیا' },
                  { key: 'independent' as RoleTeam, label: 'مستقل' },
                ].map((opt) => {
                  const active = draft.team === opt.key;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setDraft({ ...draft, team: opt.key })}
                      className={`min-h-[34px] rounded-lg text-[11px] font-bold cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                نتیجه استعلام کارآگاه
              </span>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { key: 'auto' as const, label: 'خودکار' },
                  { key: 'positive' as const, label: 'مثبت 👍' },
                  { key: 'negative' as const, label: 'منفی 👎' },
                ].map((opt) => {
                  const active = (draft.inquiryOverride ?? 'auto') === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setDraft({ ...draft, inquiryOverride: opt.key })}
                      className={`min-h-[34px] rounded-lg text-[11px] font-bold cursor-pointer ${
                        active
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Unlimited Icon Picker (Vector + Emoji/Symbol + Custom Image) */}
          <div className="space-y-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-[#090B10]/75 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                آیکون نقش
              </span>

              <div className="grid grid-cols-3 gap-1 bg-white dark:bg-[#121620] p-1 rounded-xl border border-slate-200 dark:border-white/10 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIconTab('vector')}
                  className={`min-h-[36px] px-2 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer ${
                    iconTab === 'vector'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>برداری ({toPersianDigits(ROLE_ICON_OPTIONS.length)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIconTab('emoji')}
                  className={`min-h-[36px] px-2 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer ${
                    iconTab === 'emoji'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5 shrink-0" />
                  <span>ایموجی</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIconTab('image')}
                  className={`min-h-[36px] px-2 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer ${
                    iconTab === 'image'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>تصویر</span>
                </button>
              </div>
            </div>

            {iconTab !== 'image' && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={iconQuery}
                  onChange={(e) => setIconQuery(e.target.value)}
                  placeholder={iconTab === 'vector' ? 'جستجو در ۵۵ آیکون...' : 'جستجو در ایموجی‌ها...'}
                  className="w-full min-h-[38px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] pr-8 pl-3 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            )}

            {iconTab === 'vector' && (
              <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-0.5">
                {filteredIcons.map((opt) => {
                  const isSelected = draft.icon === opt.name;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setDraft({ ...draft, icon: opt.name })}
                      className={`min-h-[54px] rounded-xl border px-1.5 py-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 dark:border-amber-400 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <RoleIcon
                        name={opt.name}
                        className="w-5 h-5"
                        style={{ color: isSelected ? draft.color : undefined }}
                      />
                      <span className="text-[10px] leading-tight text-center">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {iconTab === 'emoji' && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={customEmojiInput}
                    onChange={(e) => handleApplyCustomEmoji(e.target.value)}
                    placeholder="ایموجی یا نماد دلخواه را تایپ کنید..."
                    className="flex-1 min-h-[42px] rounded-xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] px-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-[175px] overflow-y-auto pr-0.5">
                  {filteredEmojis.map((opt) => {
                    const emojiKey = `emoji:${opt.emoji}` as RoleIconName;
                    const isSelected = draft.icon === emojiKey;
                    return (
                      <button
                        key={opt.emoji}
                        type="button"
                        onClick={() => {
                          setCustomEmojiInput(opt.emoji);
                          setDraft({ ...draft, icon: emojiKey });
                        }}
                        title={opt.label}
                        className={`min-h-[48px] rounded-xl border px-1 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/18 scale-[1.03]'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <span className="text-xl leading-none">{opt.emoji}</span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight text-center">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {iconTab === 'image' && (
              <div className="space-y-3">
                <label className="w-full min-h-[86px] rounded-2xl border-2 border-dashed border-amber-500/45 bg-amber-500/8 hover:bg-amber-500/14 flex flex-col items-center justify-center gap-1.5 p-4 text-center cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-extrabold text-amber-800 dark:text-amber-200">
                    انتخاب عکس، آواتار یا استیکر از گالری گوشی
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    تصویر به‌صورت خودکار به آیکون مربعی کم‌حجم تبدیل و آفلاین ذخیره می‌شود
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void handleUploadCustomImage(e)}
                    className="hidden"
                  />
                </label>

                {uploadError && (
                  <p className="text-xs text-red-600 dark:text-red-300">{uploadError}</p>
                )}

                {draft.icon.startsWith('img:') && (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] p-2.5">
                    <div className="flex items-center gap-2.5">
                      <RoleIcon name={draft.icon} className="w-11 h-11" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        آیکون تصویری انتخاب‌شده
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft({ ...draft, icon: 'shield' });
                        setIconTab('vector');
                      }}
                      className="min-h-[36px] px-3 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-red-500 cursor-pointer"
                    >
                      حذف تصویر
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Color Picker + Custom Hex Color */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">رنگ اختصاصی نقش</span>
              <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 cursor-pointer">
                <Palette className="w-3.5 h-3.5" />
                <span>رنگ دلخواه:</span>
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  className="w-7 h-7 rounded-lg bg-transparent border border-slate-300 dark:border-white/20 cursor-pointer"
                />
              </label>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {ROLE_COLOR_PALETTE.map((option) => {
                const isActive = draft.color.toLowerCase() === option.hex.toLowerCase();
                return (
                  <button
                    key={option.hex}
                    type="button"
                    onClick={() => setDraft({ ...draft, color: option.hex })}
                    className={`h-11 rounded-xl flex items-center justify-center border transition-transform active:scale-95 cursor-pointer ${
                      isActive ? 'border-slate-900 dark:border-white scale-105' : 'border-slate-300/60 dark:border-white/10'
                    }`}
                    style={{ backgroundColor: option.hex }}
                    title={option.label}
                    aria-label={`انتخاب رنگ ${option.label}`}
                  >
                    {isActive && <Check className="w-5 h-5 text-slate-950" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {showSyncAcrossScenarios && syncScenarioCount > 0 && (
            <label className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={syncAcrossScenarios}
                onChange={(e) => setSyncAcrossScenarios(e.target.checked)}
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                اعمال خودکار تغییرات روی تمام سناریوهای دارای این نقش ({toPersianDigits(syncScenarioCount)} سناریو)
              </span>
            </label>
          )}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 min-h-[50px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm cursor-pointer"
          >
            {isNew ? 'افزودن نقش' : 'ثبت تغییرات نقش'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[50px] px-5 rounded-xl border border-slate-200 dark:border-white/12 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-sm cursor-pointer"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};
