import React from 'react';
import {
  BellRing,
  Music,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Timer,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AlarmSoundId,
  AppPreferences,
  CustomNightTrack,
  NightTrackId,
} from '../../types/game';
import { saveCustomAudioFile, deleteCustomAudioFile } from '../../utils/audioStorage';
import { generateLocalId, toPersianDigits } from '../../utils/persian';
import {
  ALARM_SOUND_OPTIONS,
  NIGHT_TRACK_OPTIONS,
  playCountdownTick,
  playTimerEndAlarm,
  unlockAudioContext,
} from '../../utils/soundEngine';

interface TimerAndAudioTabProps {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isMuted: boolean;
  preferences: AppPreferences;
  onUpdatePreferences: (next: AppPreferences) => void;
  onOpenCustomization: () => void;
  onToggleMute: () => void;
  onSelectPreset: (secs: number) => void;
  onTogglePlayPause: () => void;
  onResetTimer: () => void;
  isAmbientPlaying: boolean;
  ambientVolume: number;
  onToggleAmbient: () => void;
  onChangeAmbientVolume: (vol: number) => void;
  onSelectNightTrack: (trackId: NightTrackId) => void;
}

function formatCountdown(secs: number) {
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  const mm = String(mins).padStart(2, '0');
  const ss = String(rem).padStart(2, '0');
  return `${toPersianDigits(mm)}:${toPersianDigits(ss)}`;
}

export const TimerAndAudioTab: React.FC<TimerAndAudioTabProps> = ({
  durationSeconds,
  remainingSeconds,
  isRunning,
  isMuted,
  preferences,
  onUpdatePreferences,
  onOpenCustomization,
  onToggleMute,
  onSelectPreset,
  onTogglePlayPause,
  onResetTimer,
  isAmbientPlaying,
  ambientVolume,
  onToggleAmbient,
  onChangeAmbientVolume,
  onSelectNightTrack,
}) => {
  const progressPct =
    durationSeconds > 0 ? Math.round((remainingSeconds / durationSeconds) * 100) : 0;
  const isWarningTime =
    remainingSeconds > 0 &&
    preferences.warningCountdownSeconds > 0 &&
    remainingSeconds <= preferences.warningCountdownSeconds;
  const isTimeUp = remainingSeconds === 0;
  const isTickEnabled = preferences.warningCountdownSeconds > 0;

  const customTracks = preferences.customNightTracks ?? [];
  const selectedCustomId = preferences.nightTrackId.startsWith('custom:')
    ? preferences.nightTrackId.slice('custom:'.length)
    : null;

  const handleToggleLastWords = () => {
    unlockAudioContext();
    const nextSec = isTickEnabled ? 0 : 10;
    onUpdatePreferences({
      ...preferences,
      warningCountdownSeconds: nextSec,
    });
    if (nextSec > 0 && !isMuted) {
      playCountdownTick(10);
    }
  };

  const handleUploadCustomTracks = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        // Ignore single file failure
      }
    }

    if (addedTracks.length === 0) return;
    const nextTracks = [...customTracks, ...addedTracks];
    const nextSelected: NightTrackId = `custom:${addedTracks[0].id}`;
    onUpdatePreferences({
      ...preferences,
      customNightTracks: nextTracks,
      nightTrackId: nextSelected,
    });
  };

  const handleDeleteSelectedCustomTrack = async () => {
    if (selectedCustomId) {
      await deleteCustomAudioFile(`night_custom_${selectedCustomId}`);
      const nextTracks = customTracks.filter((t) => t.id !== selectedCustomId);
      const fallbackTrack: NightTrackId =
        nextTracks.length > 0 ? `custom:${nextTracks[0].id}` : 'wind-night';
      onUpdatePreferences({
        ...preferences,
        customNightTracks: nextTracks,
        nightTrackId: fallbackTrack,
      });
      return;
    }

    if (preferences.nightTrackId === 'custom' && preferences.nightCustomTrackName) {
      await deleteCustomAudioFile('night_music');
      onUpdatePreferences({
        ...preferences,
        nightCustomTrackName: '',
        nightTrackId: 'wind-night',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Timer Card */}
      <section className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-white/14 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Timer className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">تایمر صحبت، چالش و دفاعیه</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCustomization}
              className="min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 cursor-pointer"
              title="سفارشی‌سازی تایمر و آلارم"
            >
              <SlidersHorizontal className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">شخصی‌سازی</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer ${
                isMuted
                  ? 'border-red-500/45 bg-red-500/12 dark:bg-red-500/15 text-red-700 dark:text-red-200'
                  : 'border-amber-500/45 bg-amber-500/12 text-amber-800 dark:text-amber-200'
              }`}
              aria-label={isMuted ? 'فعال‌سازی صدا' : 'بی‌صدا کردن هشدار'}
              title={isMuted ? 'صدا خاموش است' : 'هشدار صوتی روشن است'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              <span className="hidden sm:inline">{isMuted ? 'بی‌صدا' : 'صدا روشن'}</span>
            </button>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 text-center space-y-3 transition-colors ${
            isTimeUp
              ? 'border-red-500/70 bg-red-500/10 dark:bg-red-500/12'
              : isWarningTime
              ? 'border-amber-500/70 bg-amber-500/12 dark:bg-amber-500/14'
              : 'border-slate-200 dark:border-white/14 bg-slate-50 dark:bg-[#090B10]'
          }`}
        >
          <div
            className={`text-5xl sm:text-6xl font-extrabold tabular-nums tracking-tight transition-colors ${
              isTimeUp
                ? 'text-red-600 dark:text-red-300'
                : isWarningTime
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-slate-900 dark:text-white'
            }`}
            dir="ltr"
          >
            {formatCountdown(remainingSeconds)}
          </div>

          <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-white/12 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isTimeUp ? 'bg-red-500' : isWarningTime ? 'bg-amber-500 dark:bg-amber-400' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <p
            className={`text-xs sm:text-sm font-bold ${
              isTimeUp
                ? 'text-red-700 dark:text-red-200'
                : isWarningTime
                ? 'text-amber-800 dark:text-amber-200'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {isTimeUp
              ? 'زمان صحبت به پایان رسید!'
              : isWarningTime
              ? `${toPersianDigits(remainingSeconds)} ثانیه تا پایان وقت — هشدار فعال`
              : isRunning
              ? 'در حال شمارش...'
              : 'آماده شروع'}
          </p>
        </div>

        {/* Last Words Toggle & Sound Test Bar */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/14 bg-slate-50 dark:bg-[#0B0E15] p-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleToggleLastWords}
            className={`min-h-[44px] px-3 rounded-xl border text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-colors ${
              isTickEnabled
                ? 'border-amber-500/55 bg-amber-500/15 dark:bg-amber-500/18 text-amber-800 dark:text-amber-200'
                : 'border-slate-300 dark:border-white/18 bg-white dark:bg-[#161B28] text-slate-700 dark:text-slate-300'
            }`}
          >
            <BellRing className="w-4 h-4" />
            <span>{isTickEnabled ? 'کلام آخر : فعال' : 'کلام آخر : غیرفعال'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              unlockAudioContext();
              playCountdownTick(3);
            }}
            className="min-h-[44px] px-3 rounded-xl border border-slate-300 dark:border-white/18 bg-white dark:bg-[#161B28] hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-bold text-slate-800 dark:text-slate-100 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-300" />
            <span>تست</span>
          </button>
        </div>

        {/* Custom Presets (15s, 30s, 60s default, editable in Settings) */}
        <div className="flex flex-wrap gap-2">
          {preferences.customTimerPresets.map((secs) => {
            const isSelected = durationSeconds === secs && !isRunning;
            return (
              <button
                key={secs}
                type="button"
                onClick={() => onSelectPreset(secs)}
                className={`flex-1 min-w-[78px] min-h-[48px] rounded-xl px-2.5 text-xs sm:text-sm font-extrabold border transition-colors cursor-pointer tabular-nums ${
                  isSelected
                    ? 'border-amber-500 dark:border-amber-400 bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200'
                    : 'border-slate-200 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {toPersianDigits(secs)} ثانیه
              </button>
            );
          })}
        </div>

        {/* Start/Pause (icon-only) + Reset */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onTogglePlayPause}
            aria-label={isRunning ? 'توقف تایمر' : 'شروع تایمر'}
            className="flex-1 min-h-[56px] rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-extrabold flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-amber-500/15"
          >
            {isRunning ? (
              <Pause className="w-6 h-6 fill-slate-950" />
            ) : (
              <Play className="w-6 h-6 fill-slate-950" />
            )}
          </button>

          <button
            type="button"
            onClick={onResetTimer}
            className="min-h-[56px] min-w-[56px] px-4 rounded-xl border border-slate-300 dark:border-white/18 bg-slate-100 dark:bg-[#161B28] hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white cursor-pointer"
            aria-label="ریست تایمر"
            title="ریست تایمر"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Alarm Sound Picker */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/12 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">صدای آلارم پایان تایمر:</span>
          <div className="flex items-center gap-2">
            <select
              value={preferences.alarmSoundId}
              onChange={(e) =>
                onUpdatePreferences({
                  ...preferences,
                  alarmSoundId: e.target.value as AlarmSoundId,
                })
              }
              className="min-h-[44px] rounded-xl border border-slate-300 dark:border-white/18 bg-slate-50 dark:bg-[#161B28] px-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              {ALARM_SOUND_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-white dark:bg-[#161B28] text-slate-900 dark:text-white">
                  {opt.id === 'custom' && preferences.alarmCustomName
                    ? `دلخواه: ${preferences.alarmCustomName}`
                    : opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                unlockAudioContext();
                void playTimerEndAlarm(preferences.alarmSoundId);
              }}
              className="min-h-[44px] min-w-[44px] rounded-xl border border-amber-500/45 bg-amber-500/15 hover:bg-amber-500/25 flex items-center justify-center text-amber-800 dark:text-amber-200 cursor-pointer"
              aria-label="تست صدای آلارم"
              title="تست صدای آلارم"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Column 2: Night Cover Whisper-Masking Audio */}
      <div className="lg:col-span-5 space-y-5">
        <section className="rounded-3xl border border-slate-200 dark:border-white/14 bg-white dark:bg-[#121620] p-5 space-y-4 shadow-sm dark:shadow-none">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>پخش‌کننده صدای شب (ضد نجوا)</span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                صداهای متراکم و پرانرژی برای پوشاندن کامل پچ‌پچ و حرکت مافیا، یا افزودن چند آهنگ دلخواه از گوشی
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
              انتخاب صدای پوشش شب:
            </label>
            <select
              value={preferences.nightTrackId}
              onChange={(e) => onSelectNightTrack(e.target.value as NightTrackId)}
              className="w-full min-h-[46px] rounded-xl border border-slate-300 dark:border-white/18 bg-slate-50 dark:bg-[#161B28] px-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <optgroup label="صداهای ضد نجوا (آفلاین)">
                {NIGHT_TRACK_OPTIONS.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    className="bg-white dark:bg-[#161B28] text-slate-900 dark:text-white"
                  >
                    {t.label}
                  </option>
                ))}
              </optgroup>

              {(customTracks.length > 0 || preferences.nightCustomTrackName) && (
                <optgroup label="آهنگ‌های دلخواه من">
                  {preferences.nightCustomTrackName && (
                    <option
                      value="custom"
                      className="bg-white dark:bg-[#161B28] text-slate-900 dark:text-white"
                    >
                      دلخواه: {preferences.nightCustomTrackName}
                    </option>
                  )}
                  {customTracks.map((trk) => (
                    <option
                      key={trk.id}
                      value={`custom:${trk.id}`}
                      className="bg-white dark:bg-[#161B28] text-slate-900 dark:text-white"
                    >
                      دلخواه: {trk.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            <div className="flex items-center gap-2">
              <label className="flex-1 min-h-[42px] px-3 rounded-xl border border-amber-500/40 bg-amber-500/12 hover:bg-amber-500/20 text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 shrink-0" />
                <span>افزودن آهنگ دلخواه از گوشی</span>
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => void handleUploadCustomTracks(e)}
                  className="hidden"
                />
              </label>

              {(selectedCustomId !== null ||
                (preferences.nightTrackId === 'custom' && preferences.nightCustomTrackName)) && (
                <button
                  type="button"
                  onClick={() => void handleDeleteSelectedCustomTrack()}
                  className="min-h-[42px] min-w-[42px] rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 flex items-center justify-center cursor-pointer"
                  aria-label="حذف آهنگ دلخواه انتخاب‌شده"
                  title="حذف آهنگ دلخواه انتخاب‌شده"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              unlockAudioContext();
              onToggleAmbient();
            }}
            className={`w-full min-h-[58px] rounded-2xl font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer border ${
              isAmbientPlaying
                ? 'bg-blue-500/18 dark:bg-blue-500/25 border-blue-500/65 dark:border-blue-400/70 text-blue-900 dark:text-blue-100 hover:bg-blue-500/25 dark:hover:bg-blue-500/30'
                : 'bg-slate-100 dark:bg-[#161B28] border-slate-300 dark:border-white/20 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {isAmbientPlaying ? (
              <>
                <Pause className="w-5 h-5 text-blue-700 dark:text-blue-200" />
                <span>توقف موزیک شب</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                <span>پخش آهنگ شب</span>
              </>
            )}
          </button>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
              <span>بلندی صدای شب</span>
              <span>{toPersianDigits(Math.round(ambientVolume * 100))}٪</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={ambientVolume}
              onChange={(e) => onChangeAmbientVolume(Number(e.target.value))}
              className="w-full accent-blue-600 dark:accent-blue-400 cursor-pointer"
            />
          </div>
        </section>
      </div>
    </div>
  );
};
