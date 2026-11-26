import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  Image as ImageIcon,
  Music,
  Palette,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Timer,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import {
  AlarmSoundId,
  AppPreferences,
  CustomNightTrack,
  HomeBackdropId,
  NightTrackId,
} from '../../types/game';
import { deleteCustomAudioFile, saveCustomAudioFile } from '../../utils/audioStorage';
import { compressImageFileToDataUrl, HOME_BACKDROP_OPTIONS } from '../../utils/backdrop';
import { triggerHaptic } from '../../utils/haptics';
import { generateLocalId, hexToRgba, toPersianDigits } from '../../utils/persian';
import {
  getThemePatternBackground,
  getThemePatternSize,
  SCENARIO_THEME_OPTIONS,
  SCENARIO_VISUAL_THEMES,
} from '../../utils/scenarioTheme';
import {
  ALARM_SOUND_OPTIONS,
  nightAmbient,
  playTimerEndAlarm,
} from '../../utils/soundEngine';
import { DEFAULT_APP_PREFERENCES } from '../../utils/storage';
import { HomeBackdropArt } from '../HomeBackdropArt';

interface CustomizationModalProps {
  preferences: AppPreferences;
  onUpdatePreferences: (next: AppPreferences) => void;
  onClose: () => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  preferences,
  onUpdatePreferences,
  onClose,
}) => {
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
    const fileList = e.target.files;
    const files: File[] = fileList ? Array.from(fileList) : [];
    e.target.value = '';
    if (files.length === 0) return;

    const addedTracks: CustomNightTrack[] = [];
    for (const file of files) {
      const id = generateLocalId('trk');
      try {
        await saveCustomAudioFile(`night_custom_${id}`, file);
        addedTracks.push({
          id,
          name: file.name.replace(/\.[^/.]+$/, '') || file.name,
        });
      } catch {
        // ignore single failure
      }
    }

    if (addedTracks.length === 0) {
      setAudioStatusMsg('خطا در ذخیره فایل صوتی در حافظه دستگاه.');
      return;
    }

    const nextTracks = [...(preferences.customNightTracks ?? []), ...addedTracks];
    const nextTrackId: NightTrackId = `custom:${addedTracks[0].id}`;
    update({
      customNightTracks: nextTracks,
      nightTrackId: nextTrackId,
    });
    setAudioStatusMsg(
      addedTracks.length === 1
        ? `آهنگ «${addedTracks[0].name}» به فهرست آهنگ‌های دلخواه اضافه شد.`
        : `${toPersianDigits(addedTracks.length)} آهنگ دلخواه به فهرست اضافه شد.`
    );
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

  const handleDeleteCustomNightTrack = async (trackId: string) => {
    const targetFullId: NightTrackId = `custom:${trackId}`;
    if (previewingNight && nightAmbient.getTrackId() === targetFullId) {
      nightAmbient.stop();
      setPreviewingNight(false);
    }
    await deleteCustomAudioFile(`night_custom_${trackId}`);
    const nextTracks = (preferences.customNightTracks ?? []).filter((t) => t.id !== trackId);
    const nextSelected: NightTrackId =
      preferences.nightTrackId === targetFullId
        ? nextTracks.length > 0
          ? `custom:${nextTracks[0].id}`
          : preferences.nightCustomTrackName
          ? 'custom'
          : 'custom'
        : preferences.nightTrackId;
    update({
      customNightTracks: nextTracks,
      nightTrackId: nextSelected,
    });
  };

  const handleClearLegacyCustomNight = async () => {
    if (previewingNight && nightAmbient.getTrackId() === 'custom') {
      nightAmbient.stop();
      setPreviewingNight(false);
    }
    await deleteCustomAudioFile('night_music');
    const customTracks = preferences.customNightTracks ?? [];
    update({
      nightTrackId:
        preferences.nightTrackId === 'custom'
          ? customTracks.length > 0
            ? `custom:${customTracks[0].id}`
            : 'custom'
          : preferences.nightTrackId,
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 dark:bg-black/80 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-white/12 bg-white dark:bg-[#121620] text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/8 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100">
              تنظیمات
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

              {/* Night Cover Music Track Selection */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Music className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>آهنگ شب</span>
                  </h3>
                  <label className="min-h-[38px] px-3 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>افزودن آهنگ</span>
                    <input
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={(e) => void handleUploadNightAudio(e)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-3.5 space-y-2.5">
                  {!preferences.nightCustomTrackName &&
                  (preferences.customNightTracks ?? []).length === 0 ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-1">
                      آهنگی اضافه نشده است
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {preferences.nightCustomTrackName && (
                        <div
                          className={`rounded-xl border p-2.5 flex items-center justify-between gap-2 ${
                            preferences.nightTrackId === 'custom'
                              ? 'border-blue-500/50 bg-blue-500/10'
                              : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => update({ nightTrackId: 'custom' })}
                            className="flex-1 flex items-center gap-2.5 text-right min-w-0 cursor-pointer"
                          >
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                preferences.nightTrackId === 'custom'
                                  ? 'border-blue-500 bg-blue-500 text-white dark:text-slate-950'
                                  : 'border-slate-400 dark:border-slate-600'
                              }`}
                            >
                              {preferences.nightTrackId === 'custom' && (
                                <Check className="w-3 h-3" strokeWidth={3} />
                              )}
                            </div>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {preferences.nightCustomTrackName}
                            </span>
                          </button>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => void handlePreviewNightTrack('custom')}
                              className="min-h-[34px] min-w-[34px] rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] flex items-center justify-center text-blue-600 dark:text-blue-300 cursor-pointer"
                              title="پخش پیش‌نمایش"
                            >
                              {previewingNight && nightAmbient.getTrackId() === 'custom' ? (
                                <Pause className="w-3.5 h-3.5" />
                              ) : (
                                <Play className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleClearLegacyCustomNight()}
                              className="min-h-[34px] min-w-[34px] rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-500 flex items-center justify-center cursor-pointer"
                              title="حذف آهنگ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {(preferences.customNightTracks ?? []).map((trk) => {
                        const fullId: NightTrackId = `custom:${trk.id}`;
                        const selected = preferences.nightTrackId === fullId;
                        const isPlayingThis =
                          previewingNight && nightAmbient.getTrackId() === fullId;

                        return (
                          <div
                            key={trk.id}
                            className={`rounded-xl border p-2.5 flex items-center justify-between gap-2 ${
                              selected
                                ? 'border-blue-500/50 bg-blue-500/10'
                                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => update({ nightTrackId: fullId })}
                              className="flex-1 flex items-center gap-2.5 text-right min-w-0 cursor-pointer"
                            >
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  selected
                                    ? 'border-blue-500 bg-blue-500 text-white dark:text-slate-950'
                                    : 'border-slate-400 dark:border-slate-600'
                                }`}
                              >
                                {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                              </div>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {trk.name}
                              </span>
                            </button>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => void handlePreviewNightTrack(fullId)}
                                className="min-h-[34px] min-w-[34px] rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121620] flex items-center justify-center text-blue-600 dark:text-blue-300 cursor-pointer"
                                title={isPlayingThis ? 'توقف پیش‌نمایش' : 'پخش پیش‌نمایش'}
                              >
                                {isPlayingThis ? (
                                  <Pause className="w-3.5 h-3.5" />
                                ) : (
                                  <Play className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteCustomNightTrack(trk.id)}
                                className="min-h-[34px] min-w-[34px] rounded-lg border border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-500 flex items-center justify-center cursor-pointer"
                                title="حذف آهنگ"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 tabular-nums">
                    <span>بلندی صدا</span>
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
                  <span>زنگ تایمر</span>
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

              {/* Last Words Countdown */}
              <section className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/8">
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      مدت کلام آخر
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
                </div>
              </section>

              {/* Timers */}
              <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/8">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>تایمر</span>
                </h3>
                <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    زمان پیش‌فرض
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

                <div className="pt-3 border-t border-slate-200 dark:border-white/6 space-y-2.5">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    زمان‌های آماده
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
                            aria-label="حذف"
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
                      placeholder="ثانیه"
                      className="w-28 min-h-[40px] rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#121620] px-3 text-xs text-slate-900 dark:text-slate-100 tabular-nums focus:outline-none focus:border-amber-500/60"
                    />
                    <button
                      type="button"
                      onClick={handleAddTimerPreset}
                      className="min-h-[40px] px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Card Visual Theme */}
            <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/8">
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>تم کارت‌های نقش</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      طرح و رنگ کارت‌ها و صفحه توزیع نقش
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {SCENARIO_THEME_OPTIONS.map((opt) => {
                    const isDark = preferences.themeMode !== 'light';
                    const isSelected = (preferences.cardVisualTheme ?? 'auto') === opt.id;
                    const previewTheme =
                      opt.id === 'auto'
                        ? SCENARIO_VISUAL_THEMES.godfather
                        : SCENARIO_VISUAL_THEMES[opt.id];
                    const previewAccent = isDark
                      ? previewTheme.accentHex
                      : previewTheme.lightAccentHex;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('tap', preferences.hapticFeedbackEnabled);
                          update({ cardVisualTheme: opt.id });
                        }}
                        className={`rounded-xl border p-2 text-right flex flex-col gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 bg-white dark:bg-[#151A26] text-slate-950 dark:text-white font-extrabold shadow-sm'
                            : 'border-slate-200 dark:border-white/10 bg-white/75 dark:bg-[#121620] hover:bg-white dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: previewAccent,
                                boxShadow: `0 0 0 2px ${hexToRgba(previewAccent, 0.25)}`,
                              }
                            : undefined
                        }
                      >
                        <div
                          className="w-full h-9 rounded-lg relative overflow-hidden border"
                          style={{
                            background: isDark
                              ? previewTheme.darkCardBg
                              : previewTheme.lightCardBg,
                            borderColor: hexToRgba(previewAccent, 0.45),
                          }}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: getThemePatternBackground(previewTheme, isDark),
                              backgroundSize: getThemePatternSize(previewTheme.pattern),
                            }}
                          />
                          {isSelected && (
                            <span
                              className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-slate-950 shadow"
                              style={{ backgroundColor: previewAccent }}
                            >
                              <Check className="w-2.5 h-2.5" strokeWidth={3} />
                            </span>
                          )}
                          {opt.id === 'auto' && (
                            <span className="absolute bottom-1 right-1.5 text-[9px] font-extrabold text-amber-700 dark:text-amber-300">
                              هوشمند
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] leading-snug text-center w-full">
                          {opt.id === 'auto' ? 'خودکار' : opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Backdrop */}
            <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/8">
              <div className="rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-[#090B10] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#C4161C] dark:text-amber-400" />
                      <span>تصویر پس‌زمینه</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      نمایش تمام‌صفحه در کل برنامه
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
                          <div className="text-xs font-extrabold text-slate-900 dark:text-white leading-snug">
                            {opt.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
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
