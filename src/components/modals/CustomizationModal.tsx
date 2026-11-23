import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  Eye,
  Image as ImageIcon,
  Moon,
  Music,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  Timer,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import {
  AlarmSoundId,
  AppPreferences,
  HomeBackdropId,
  NightTrackId,
  RevealSoundId,
} from '../../types/game';
import { deleteCustomAudioFile, saveCustomAudioFile } from '../../utils/audioStorage';
import { compressImageFileToDataUrl, HOME_BACKDROP_OPTIONS } from '../../utils/backdrop';
import { triggerHaptic } from '../../utils/haptics';
import { toPersianDigits } from '../../utils/persian';
import {
  ALARM_SOUND_OPTIONS,
  NIGHT_TRACK_OPTIONS,
  REVEAL_SOUND_OPTIONS,
  nightAmbient,
  playRevealCue,
  playTimerEndAlarm,
} from '../../utils/soundEngine';
import { DEFAULT_APP_PREFERENCES } from '../../utils/storage';
import { HomeBackdropArt } from '../HomeBackdropArt';

interface CustomizationModalProps {
  preferences: AppPreferences;
  onUpdatePreferences: (next: AppPreferences) => void;
  onClose: () => void;
}

type PrefsTabKey = 'audio' | 'timers' | 'backdrop' | 'display';

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  preferences,
  onUpdatePreferences,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PrefsTabKey>('audio');
  const [previewingNight, setPreviewingNight] = useState(false);
  const [newPresetSec, setNewPresetSec] = useState('120');
  const [audioStatusMsg, setAudioStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewingNight) {
        nightAmbient.stop();
      }
    };
  }, [previewingNight]);

  const update = (patch: Partial<AppPreferences>) => {
    onUpdatePreferences({ ...preferences, ...patch });
  };

  const handlePreviewNightTrack = async (trackId: NightTrackId) => {
    if (previewingNight && nightAmbient.getTrackId() === trackId) {
      nightAmbient.stop();
      setPreviewingNight(false);
      return;
    }
    nightAmbient.stop();
    const ok = await nightAmbient.start(preferences.nightVolume, trackId);
    setPreviewingNight(ok);
  };

  const handleUploadNightAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await saveCustomAudioFile('night_music', file);
      update({
        nightTrackId: 'custom',
        nightCustomTrackName: file.name,
      });
      setAudioStatusMsg(`آهنگ شب «${file.name}» برای استفاده آفلاین ذخیره شد.`);
    } catch {
      setAudioStatusMsg('خطا در ذخیره فایل صوتی در حافظه دستگاه.');
    }
  };

  const handleUploadAlarmAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await saveCustomAudioFile('timer_alarm', file);
      update({
        alarmSoundId: 'custom',
        alarmCustomName: file.name,
      });
      setAudioStatusMsg(`صدای آلارم «${file.name}» برای استفاده آفلاین ذخیره شد.`);
    } catch {
      setAudioStatusMsg('خطا در ذخیره فایل آلارم.');
    }
  };

  const handleClearCustomNight = async () => {
    nightAmbient.stop();
    setPreviewingNight(false);
    await deleteCustomAudioFile('night_music');
    update({
      nightTrackId: 'rain-drone',
      nightCustomTrackName: '',
    });
  };

  const handleClearCustomAlarm = async () => {
    await deleteCustomAudioFile('timer_alarm');
    update({
      alarmSoundId: 'bell',
      alarmCustomName: '',
    });
  };

  const handleAddTimerPreset = () => {
    const parsed = parseInt(newPresetSec, 10);
    if (Number.isNaN(parsed) || parsed < 5 || parsed > 600) return;
    if (preferences.customTimerPresets.includes(parsed)) return;
    const nextPresets = [...preferences.customTimerPresets, parsed].sort((a, b) => a - b);
    update({ customTimerPresets: nextPresets });
    setNewPresetSec('');
  };

  const handleRemoveTimerPreset = (sec: number) => {
    if (preferences.customTimerPresets.length <= 1) return;
    update({
      customTimerPresets: preferences.customTimerPresets.filter((s) => s !== sec),
    });
  };

  const TABS: { key: PrefsTabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'audio', label: 'آهنگ و آلارم', icon: <Music className="w-4 h-4" /> },
    { key: 'timers', label: 'تایمر و قوانین', icon: <Timer className="w-4 h-4" /> },
    { key: 'backdrop', label: 'تصویر پس‌زمینه', icon: <ImageIcon className="w-4 h-4" /> },
    { key: 'display', label: 'نمایش و امنیت', icon: <Eye className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 dark:bg-black/80 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/8 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              شخصی‌سازی و تنظیمات برنامه
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              nightAmbient.stop();
              onClose();
            }}
            className="min-h-[40px] min-w-[40px] rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-200 dark:border-white/6 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#090B10] border border-slate-200 dark:border-white/8">
            {TABS.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    triggerHaptic('tap', preferences.hapticFeedbackEnabled);
                    setActiveTab(t.key);
                  }}
                  className={`min-h-[42px] rounded-lg px-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    active ? 'bg-amber-500 text-slate-950' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/5'
                  }`}
                >
                  {t.icon}
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {audioStatusMsg && (
            <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-2">
              <span>{audioStatusMsg}</span>
              <button
                type="button"
                onClick={() => setAudioStatusMsg(null)}
                className="text-emerald-700 dark:text-emerald-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'audio' && (
            <>
              {/* Night Cover Music Track Selection */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Music className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>انتخاب آهنگ پس‌زمینه شب</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">کاملاً آفلاین</span>
                </div>

                <div className="space-y-2">
                  {NIGHT_TRACK_OPTIONS.map((track) => {
                    const selected = preferences.nightTrackId === track.id;
                    const isPlayingThis =
                      previewingNight && nightAmbient.getTrackId() === track.id;
                    const isCustomEmpty =
                      track.id === 'custom' && !preferences.nightCustomTrackName;

                    return (
                      <div
                        key={track.id}
                        className={`rounded-2xl border p-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 transition-colors ${
                          selected
                            ? 'border-blue-500/50 bg-blue-500/10'
                            : 'border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => update({ nightTrackId: track.id })}
                          className="flex-1 flex items-center gap-3 text-right min-w-0 cursor-pointer"
                        >
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                              selected
                                ? 'border-blue-500 bg-blue-500 text-white dark:text-slate-950'
                                : 'border-slate-400 dark:border-slate-600'
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {track.label}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {track.id === 'custom' && preferences.nightCustomTrackName
                                ? `فایل انتخابی: ${preferences.nightCustomTrackName}`
                                : track.subtitle}
                            </div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {track.id === 'custom' && (
                            <label className="min-h-[38px] px-2.5 rounded-xl border border-amber-500/35 bg-amber-500/12 hover:bg-amber-500/20 text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 cursor-pointer">
                              <Upload className="w-3.5 h-3.5" />
                              <span>انتخاب فایل</span>
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={handleUploadNightAudio}
                                className="hidden"
                              />
                            </label>
                          )}

                          {track.id === 'custom' && preferences.nightCustomTrackName && (
                            <button
                              type="button"
                              onClick={handleClearCustomNight}
                              className="min-h-[38px] min-w-[38px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:text-red-500 flex items-center justify-center text-slate-500 dark:text-slate-400 cursor-pointer"
                              title="حذف آهنگ دلخواه"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {!isCustomEmpty && (
                            <button
                              type="button"
                              onClick={() => void handlePreviewNightTrack(track.id)}
                              className="min-h-[38px] min-w-[38px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-blue-600 dark:text-blue-300 cursor-pointer"
                              title={isPlayingThis ? 'توقف پیش‌نمایش' : 'پخش پیش‌نمایش'}
                            >
                              {isPlayingThis ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 tabular-nums">
                    <span>بلندی پیش‌فرض آهنگ شب</span>
                    <span>{toPersianDigits(Math.round(preferences.nightVolume * 100))}٪</span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={preferences.nightVolume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      update({ nightVolume: val });
                      nightAmbient.setVolume(val);
                    }}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </section>

              {/* Timer End Alarm Sound */}
              <section className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>انتخاب صدای آلارم پایان تایمر</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALARM_SOUND_OPTIONS.map((opt) => {
                    const selected = preferences.alarmSoundId === opt.id;
                    const isCustom = opt.id === 'custom';
                    return (
                      <div
                        key={opt.id}
                        className={`rounded-2xl border p-3 flex items-center justify-between gap-2 ${
                          selected
                            ? 'border-amber-500/50 bg-amber-500/12'
                            : 'border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => update({ alarmSoundId: opt.id as AlarmSoundId })}
                          className="flex-1 flex items-center gap-2.5 text-right min-w-0 cursor-pointer"
                        >
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              selected
                                ? 'border-amber-500 bg-amber-500 text-slate-950'
                                : 'border-slate-400 dark:border-slate-600'
                            }`}
                          >
                            {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {opt.label}
                            </div>
                            {isCustom && preferences.alarmCustomName && (
                              <div className="text-[10px] text-amber-700 dark:text-amber-300 truncate">
                                {preferences.alarmCustomName}
                              </div>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          {isCustom && (
                            <label className="min-h-[34px] px-2 rounded-lg border border-amber-500/35 bg-amber-500/10 text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 cursor-pointer">
                              <Upload className="w-3 h-3" />
                              <span>فایل</span>
                              <input
                                type="file"
                                accept="audio/*"
                                onChange={handleUploadAlarmAudio}
                                className="hidden"
                              />
                            </label>
                          )}
                          {isCustom && preferences.alarmCustomName && (
                            <button
                              type="button"
                              onClick={handleClearCustomAlarm}
                              className="min-h-[34px] min-w-[34px] rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-red-500 flex items-center justify-center cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => void playTimerEndAlarm(opt.id as AlarmSoundId)}
                            className="min-h-[34px] min-w-[34px] rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center text-amber-600 dark:text-amber-300 cursor-pointer"
                            title="تست صدا"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Role Reveal SFX + Vibration + Countdown Tick */}
              <section className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  صدای افشای نقش و هشدار ثانیه‌های آخر
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REVEAL_SOUND_OPTIONS.map((opt) => {
                    const selected = preferences.revealSoundId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          update({ revealSoundId: opt.id as RevealSoundId });
                          playRevealCue(opt.id as RevealSoundId);
                        }}
                        className={`min-h-[44px] rounded-xl border px-2.5 text-xs font-bold cursor-pointer transition-colors ${
                          selected
                            ? 'border-amber-500/55 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#090B10] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      تیک‌تاک هشدار در ثانیه‌های پایانی تایمر
                    </span>
                    <div className="grid grid-cols-4 sm:flex items-center gap-1.5">
                      {([0, 3, 5, 10] as const).map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => update({ warningCountdownSeconds: sec })}
                          className={`min-h-[36px] px-2.5 rounded-lg text-xs font-bold cursor-pointer tabular-nums ${
                            preferences.warningCountdownSeconds === sec
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10'
                          }`}
                        >
                          {sec === 0 ? 'خاموش' : `${toPersianDigits(sec)} ث`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center justify-between gap-2 cursor-pointer pt-2 border-t border-slate-200 dark:border-white/6">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      بازخورد لرزشی (Haptic) هنگام لمس دکمه‌ها، تایمر و افشای نقش
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.hapticFeedbackEnabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        update({ hapticFeedbackEnabled: checked });
                        if (checked) triggerHaptic('confirm', true);
                      }}
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 cursor-pointer pt-2 border-t border-slate-200 dark:border-white/6">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      لرزش (ویبره) طولانی گوشی هنگام اتمام تایمر
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.vibrateOnTimerEnd}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        update({ vibrateOnTimerEnd: checked });
                        if (checked) triggerHaptic('countdownTick', true);
                      }}
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>
                </div>
              </section>
            </>
          )}

          {activeTab === 'timers' && (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  زمان پیش‌فرض تایمر و دکمه‌های میان‌بر
                </h3>

                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      زمان پیش‌فرض تایمر صحبت
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            defaultSpeechSeconds: Math.max(10, preferences.defaultSpeechSeconds - 5),
                          })
                        }
                        className="w-9 h-9 rounded-lg bg-white dark:bg-[#121620] border border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-16 text-center text-sm font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                        {toPersianDigits(preferences.defaultSpeechSeconds)} ثانیه
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          update({
                            defaultSpeechSeconds: Math.min(300, preferences.defaultSpeechSeconds + 5),
                          })
                        }
                        className="w-9 h-9 rounded-lg bg-white dark:bg-[#121620] border border-slate-300 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-white/6 space-y-2">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      دکمه‌های آماده تایمر در کنسول گرداننده:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.customTimerPresets.map((sec) => (
                        <div
                          key={sec}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/12 bg-white dark:bg-[#121620] px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums"
                        >
                          <span>{toPersianDigits(sec)} ثانیه</span>
                          {preferences.customTimerPresets.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTimerPreset(sec)}
                              className="text-slate-400 hover:text-red-500 cursor-pointer"
                              aria-label="حذف میان‌بر"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min={5}
                        max={600}
                        value={newPresetSec}
                        onChange={(e) => setNewPresetSec(e.target.value)}
                        placeholder="مثلاً 120 ثانیه"
                        className="w-36 min-h-[40px] rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] px-3 text-xs text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-amber-500/60"
                      />
                      <button
                        type="button"
                        onClick={handleAddTimerPreset}
                        className="min-h-[40px] px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن دکمه تایمر</span>
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  سفارشی‌سازی قوانین محاسبه میز
                </h3>

                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-3">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      فرمول حدنصاب ورود به دادگاه دفاعیه:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => update({ defenseVoteFormula: 'half' })}
                        className={`min-h-[42px] rounded-xl border px-3 text-xs font-bold cursor-pointer ${
                          preferences.defenseVoteFormula === 'half'
                            ? 'border-amber-500/55 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                            : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        نصف افراد زنده (معمول)
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ defenseVoteFormula: 'half_plus_one' })}
                        className={`min-h-[42px] rounded-xl border px-3 text-xs font-bold cursor-pointer ${
                          preferences.defenseVoteFormula === 'half_plus_one'
                            ? 'border-amber-500/55 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                            : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        نصف به‌علاوه یک رأی
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center justify-between gap-2 cursor-pointer pt-2 border-t border-slate-200 dark:border-white/6">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      در تیر خطای تک‌تیرانداز به شهروند، شهروند خارج نشود (جریمه خود اسنایپر)
                    </span>
                    <input
                      type="checkbox"
                      checked={preferences.sniperPenaltyOnCitizen}
                      onChange={(e) => update({ sniperPenaltyOnCitizen: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 shrink-0"
                    />
                  </label>
                </div>
              </section>
            </>
          )}

          {activeTab === 'backdrop' && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#C4161C] dark:text-amber-400" />
                      <span>انتخاب تصویر پس‌زمینه فراگیر</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      تصویر انتخابی به‌صورت تمام‌صفحه در کل برنامه اعمال می‌شود.
                    </p>
                  </div>

                  <label className="min-h-[40px] px-3.5 rounded-xl bg-[#C4161C] hover:bg-[#AD1217] dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>انتخاب از گالری</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        try {
                          const dataUrl = await compressImageFileToDataUrl(file);
                          triggerHaptic('confirm', preferences.hapticFeedbackEnabled);
                          update({
                            homeBackdropId: 'custom',
                            homeBackdropCustomDataUrl: dataUrl,
                          });
                          setAudioStatusMsg('تصویر پس‌زمینه با موفقیت ذخیره و اعمال شد.');
                        } catch {
                          setAudioStatusMsg('خطا در پردازش تصویر انتخابی.');
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {HOME_BACKDROP_OPTIONS.filter((o) => o.id !== 'custom').map((opt) => {
                    const active = preferences.homeBackdropId === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', preferences.hapticFeedbackEnabled);
                          update({ homeBackdropId: opt.id as HomeBackdropId });
                        }}
                        className={`rounded-2xl border overflow-hidden text-right cursor-pointer transition-all ${
                          active
                            ? 'border-[#C4161C] dark:border-amber-500 ring-2 ring-[#C4161C]/25 dark:ring-amber-500/25'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25'
                        }`}
                      >
                        <div className="h-24 w-full bg-white dark:bg-[#121620] relative overflow-hidden">
                          <HomeBackdropArt
                            backdropId={opt.id}
                            isDark={preferences.themeMode !== 'light'}
                            compact
                          />
                          {active && (
                            <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-[#C4161C] dark:bg-amber-500 text-white dark:text-slate-950 flex items-center justify-center shadow">
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="px-3 py-2 bg-white dark:bg-[#121620]">
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {opt.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {opt.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {preferences.homeBackdropCustomDataUrl && (
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        تصویر دلخواه ذخیره‌شده
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', preferences.hapticFeedbackEnabled);
                          update({ homeBackdropId: 'logo', homeBackdropCustomDataUrl: '' });
                        }}
                        className="min-h-[34px] px-2.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-500 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="حذف تصویر دلخواه"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap', preferences.hapticFeedbackEnabled);
                        update({ homeBackdropId: 'custom' });
                      }}
                      className={`w-full h-28 rounded-xl overflow-hidden border relative cursor-pointer block transition-all ${
                        preferences.homeBackdropId === 'custom'
                          ? 'border-[#C4161C] dark:border-amber-500 ring-2 ring-[#C4161C]/25 dark:ring-amber-500/25'
                          : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <img
                        src={preferences.homeBackdropCustomDataUrl}
                        alt="تصویر پس‌زمینه دلخواه"
                        className="w-full h-full object-cover"
                      />
                      {preferences.homeBackdropId === 'custom' && (
                        <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg bg-[#C4161C] dark:bg-amber-500 text-white dark:text-slate-950 text-[10px] font-extrabold shadow">
                          فعال
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === 'display' && (
            <section className="space-y-4">
              {/* Day / Night Theme Switcher */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  تم ظاهری برنامه (روز و شب):
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', preferences.hapticFeedbackEnabled);
                      update({ themeMode: 'light' });
                    }}
                    className={`min-h-[46px] rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      preferences.themeMode === 'light'
                        ? 'border-amber-500 bg-amber-500 text-slate-950'
                        : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>تم روز (روشن)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('tap', preferences.hapticFeedbackEnabled);
                      update({ themeMode: 'dark' });
                    }}
                    className={`min-h-[46px] rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                      preferences.themeMode === 'dark'
                        ? 'border-amber-500 bg-amber-500 text-slate-950'
                        : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>تم شب (تیره)</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  نحوه باز شدن کارت نقش هر بازیکن:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update({ revealMode: 'tap' })}
                    className={`min-h-[44px] rounded-xl border text-xs font-bold cursor-pointer ${
                      preferences.revealMode === 'tap'
                        ? 'border-amber-500/55 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                        : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    لمس سریع (یک ضربه)
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ revealMode: 'hold' })}
                    className={`min-h-[44px] rounded-xl border text-xs font-bold cursor-pointer ${
                      preferences.revealMode === 'hold'
                        ? 'border-amber-500/55 bg-amber-500/15 text-amber-800 dark:text-amber-300'
                        : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    حالت امن (نگه‌داشتن انگشت)
                  </button>
                </div>

                {preferences.revealMode === 'hold' && (
                  <div className="pt-2 border-t border-slate-200 dark:border-white/6 space-y-2">
                    <span className="text-xs text-slate-600 dark:text-slate-300 block">
                      مدت‌زمان نگه‌داشتن انگشت برای نمایش نقش:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[400, 650, 1000, 1400].map((ms) => (
                        <button
                          key={ms}
                          type="button"
                          onClick={() => update({ holdRevealMs: ms })}
                          className={`min-h-[38px] rounded-lg text-xs font-bold cursor-pointer tabular-nums ${
                            preferences.holdRevealMs === ms
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10'
                          }`}
                        >
                          {toPersianDigits((ms / 1000).toFixed(1))} ث
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  مخفی‌سازی خودکار نقش (قفل امنیتی در صورت رها کردن گوشی):
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {([0, 5, 8, 12] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => update({ autoHideAfterSeconds: sec })}
                      className={`min-h-[40px] rounded-lg text-xs font-bold cursor-pointer tabular-nums ${
                        preferences.autoHideAfterSeconds === sec
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-white dark:bg-[#121620] text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/10'
                      }`}
                    >
                      {sec === 0 ? 'خاموش' : `${toPersianDigits(sec)} ثانیه`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-3">
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    نمایش برچسب تیم (شهروند / مافیا / مستقل) روی کارت افشای نقش
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.showRoleTeamBadgeOnReveal}
                    onChange={(e) => update({ showRoleTeamBadgeOnReveal: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 shrink-0"
                  />
                </label>

                <label className="flex items-center justify-between gap-2 cursor-pointer pt-2 border-t border-slate-200 dark:border-white/6">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    اندازه متن درشت‌تر در صفحه نمایش نقش (مناسب نور کم)
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.largeRevealFont}
                    onChange={(e) => update({ largeRevealFont: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 shrink-0"
                  />
                </label>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#0E121B] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              nightAmbient.stop();
              setPreviewingNight(false);
              onUpdatePreferences(DEFAULT_APP_PREFERENCES);
              setAudioStatusMsg('تمام تنظیمات به حالت استاندارد کارخانه بازگشت.');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 cursor-pointer min-h-[40px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازگشت به پیش‌فرض</span>
          </button>

          <button
            type="button"
            onClick={() => {
              nightAmbient.stop();
              onClose();
            }}
            className="min-h-[46px] px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm cursor-pointer"
          >
            تایید و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
