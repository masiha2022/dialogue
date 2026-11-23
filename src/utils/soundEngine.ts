import { AlarmSoundId, NightTrackId, RevealSoundId } from '../types/game';
import { getCustomAudioUrl } from './audioStorage';

/**
 * 100% Offline Web Audio API + Custom IndexedDB Audio Engine
 * Supports 5 selectable Night Cover tracks + custom user audio,
 * 5 selectable Timer Alarms + custom user alarm, and 4 Role Reveal SFX.
 */

export const NIGHT_TRACK_OPTIONS: { id: NightTrackId; label: string; subtitle: string }[] = [
  { id: 'rain-drone', label: 'باران و نوای مرموز', subtitle: 'صدای ملایم باران برای پوشاندن پچ‌پچ' },
  { id: 'heartbeat', label: 'ضربان قلب و تعلیق', subtitle: 'ریتم نبض آرام و فضای هیجانی شب' },
  { id: 'cello-noir', label: 'آکورد تاریک سینمایی', subtitle: 'هارمونی عمیق و آرامش‌بخش شبانه' },
  { id: 'wind-night', label: 'نسیم شب و سکوت', subtitle: 'طیف صدای باد شب برای محرمانگی کامل' },
  { id: 'tick-clock', label: 'تیک‌تاک ساعت شب', subtitle: 'تیک‌تاک نرم به همراه زمینه کم‌نور' },
  { id: 'custom', label: 'آهنگ دلخواه من (فایل گوشی)', subtitle: 'پخش فایل صوتی انتخاب‌شده از حافظه' },
];

export const ALARM_SOUND_OPTIONS: { id: AlarmSoundId; label: string }[] = [
  { id: 'bell', label: 'زنگ شفاف کلاسیک' },
  { id: 'siren', label: 'هشدار کوتاه و سریع' },
  { id: 'gong', label: 'گونگ عمیق و سنگین' },
  { id: 'chime', label: 'ملودی سه‌نتی ملایم' },
  { id: 'double-beep', label: 'بوق دیجیتال دوگانه' },
  { id: 'custom', label: 'صدای آلارم دلخواه من' },
];

export const REVEAL_SOUND_OPTIONS: { id: RevealSoundId; label: string }[] = [
  { id: 'magic', label: 'افکت درخشان (پیشنهادی)' },
  { id: 'whoosh', label: 'صدای نرم باز شدن کارت' },
  { id: 'chime', label: 'زنگ کوتاه شفاف' },
  { id: 'silent', label: 'بی‌صدا' },
];

function getAudioContextClass(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

let sharedCtx: AudioContext | null = null;

function getSharedAudioContext(): AudioContext | null {
  try {
    const AudioCtx = getAudioContextClass();
    if (!AudioCtx) return null;
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new AudioCtx();
    }
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch(() => {});
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

export function unlockAudioContext(): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

function createTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peakGain: number,
  endFreq?: number
) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now + startOffset);
  if (endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + startOffset + duration);
  }
  gain.gain.setValueAtTime(0.001, now + startOffset);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0008, now + startOffset + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now + startOffset);
  osc.stop(now + startOffset + duration + 0.03);
}

/**
 * Audible escalating countdown tick for final N seconds (especially last 10 seconds).
 * Seconds 10..4 play a crisp double-harmonic clock tick; seconds 3..1 play an urgent higher double-beep.
 */
export function playCountdownTick(secondsRemaining: number): void {
  const ctx = getSharedAudioContext();
  if (!ctx) return;
  try {
    if (secondsRemaining <= 3) {
      createTone(ctx, 960, 0, 0.11, 'triangle', 0.28, 1180);
      createTone(ctx, 1320, 0.05, 0.12, 'sine', 0.2);
    } else {
      createTone(ctx, 680, 0, 0.09, 'triangle', 0.22, 620);
      createTone(ctx, 1020, 0, 0.06, 'sine', 0.12);
    }
  } catch {
    // Ignore audio context restriction errors
  }
}

export async function playTimerEndAlarm(alarmId: AlarmSoundId = 'bell'): Promise<void> {
  if (alarmId === 'custom') {
    const url = await getCustomAudioUrl('timer_alarm');
    if (url) {
      try {
        const audio = new Audio(url);
        audio.volume = 0.9;
        await audio.play();
        audio.onended = () => URL.revokeObjectURL(url);
        window.setTimeout(() => URL.revokeObjectURL(url), 15000);
        return;
      } catch {
        URL.revokeObjectURL(url);
        // Fall through to default synthesized bell
      }
    }
  }

  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    switch (alarmId) {
      case 'siren':
        createTone(ctx, 740, 0, 0.16, 'sawtooth', 0.18, 980);
        createTone(ctx, 980, 0.18, 0.16, 'sawtooth', 0.18, 740);
        createTone(ctx, 740, 0.36, 0.22, 'sawtooth', 0.22, 1046);
        break;
      case 'gong':
        createTone(ctx, 146.83, 0, 1.15, 'sine', 0.35, 138);
        createTone(ctx, 220, 0, 0.95, 'triangle', 0.2, 212);
        createTone(ctx, 293.66, 0.02, 0.7, 'sine', 0.14);
        break;
      case 'chime':
        createTone(ctx, 523.25, 0, 0.22, 'sine', 0.24);
        createTone(ctx, 659.25, 0.13, 0.22, 'sine', 0.24);
        createTone(ctx, 783.99, 0.26, 0.42, 'sine', 0.28);
        break;
      case 'double-beep':
        createTone(ctx, 880, 0, 0.12, 'square', 0.13);
        createTone(ctx, 880, 0.17, 0.18, 'square', 0.15);
        break;
      case 'bell':
      default:
        createTone(ctx, 660, 0, 0.2, 'triangle', 0.28);
        createTone(ctx, 880, 0.15, 0.44, 'triangle', 0.3);
        break;
    }
  } catch {
    // Ignore audio context restriction errors
  }
}

export function playRevealCue(soundId: RevealSoundId = 'magic'): void {
  if (soundId === 'silent') return;
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    if (soundId === 'whoosh') {
      createTone(ctx, 190, 0, 0.18, 'sine', 0.11, 420);
    } else if (soundId === 'chime') {
      createTone(ctx, 587.33, 0, 0.18, 'sine', 0.14);
      createTone(ctx, 880, 0.08, 0.22, 'sine', 0.12);
    } else {
      createTone(ctx, 392, 0, 0.14, 'sine', 0.12, 523.25);
      createTone(ctx, 659.25, 0.06, 0.2, 'triangle', 0.09);
    }
  } catch {
    // ignore
  }
}

export function playOfflineBeep(kind: 'tick' | 'end' | 'reveal' | 'night' | 'day' | 'eliminate'): void {
  if (kind === 'end') {
    void playTimerEndAlarm('bell');
    return;
  }
  if (kind === 'reveal') {
    playRevealCue('magic');
    return;
  }
  if (kind === 'tick') {
    playCountdownTick(10);
    return;
  }
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    if (kind === 'night') {
      createTone(ctx, 293.66, 0, 0.35, 'sine', 0.18, 220);
      createTone(ctx, 196, 0.2, 0.5, 'triangle', 0.15);
    } else if (kind === 'day') {
      createTone(ctx, 440, 0, 0.2, 'triangle', 0.18);
      createTone(ctx, 554.37, 0.12, 0.25, 'triangle', 0.18);
      createTone(ctx, 659.25, 0.24, 0.35, 'triangle', 0.2);
    } else if (kind === 'eliminate') {
      createTone(ctx, 240, 0, 0.32, 'sawtooth', 0.1, 120);
    }
  } catch {
    // Ignore audio context restriction errors
  }
}

class NightAmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private pulseInterval: number | null = null;
  private oscList: OscillatorNode[] = [];
  private noiseNode: AudioBufferSourceNode | null = null;
  private customAudioEl: HTMLAudioElement | null = null;
  private customObjectUrl: string | null = null;
  private active = false;
  private volume = 0.45;
  private currentTrackId: NightTrackId = 'rain-drone';

  public isRunning(): boolean {
    return this.active;
  }

  public getTrackId(): NightTrackId {
    return this.currentTrackId;
  }

  public setVolume(nextVol: number): void {
    this.volume = Math.max(0, Math.min(1, nextVol));
    if (this.customAudioEl && this.active) {
      this.customAudioEl.volume = this.volume;
    }
    if (this.ctx && this.masterGain && this.active) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.3, this.ctx.currentTime, 0.08);
    }
  }

  public async start(initialVolume?: number, trackId?: NightTrackId): Promise<boolean> {
    if (initialVolume !== undefined) {
      this.volume = Math.max(0, Math.min(1, initialVolume));
    }
    if (trackId !== undefined) {
      if (this.active && this.currentTrackId !== trackId) {
        this.stop();
      }
      this.currentTrackId = trackId;
    }
    if (this.active) return true;

    if (this.currentTrackId === 'custom') {
      const url = await getCustomAudioUrl('night_music');
      if (url) {
        try {
          const audio = new Audio(url);
          audio.loop = true;
          audio.volume = this.volume;
          await audio.play();
          this.customAudioEl = audio;
          this.customObjectUrl = url;
          this.active = true;
          return true;
        } catch {
          URL.revokeObjectURL(url);
          // Fallback cleanly to rain-drone if playback fails
        }
      }
    }

    try {
      const AudioCtx = getAudioContextClass();
      if (!AudioCtx) return false;

      const ctx = new AudioCtx();
      this.ctx = ctx;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(
        Math.max(0.01, this.volume * 0.3),
        ctx.currentTime + 0.65
      );
      master.connect(ctx.destination);
      this.masterGain = master;

      const style = this.currentTrackId === 'custom' ? 'rain-drone' : this.currentTrackId;

      // Filtered noise bed for whisper-masking across tracks
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.028 * white) / 1.028;
        lastOut = output[i];
        output[i] *= 2.8;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = style === 'wind-night' ? 'bandpass' : 'lowpass';
      noiseFilter.frequency.setValueAtTime(
        style === 'wind-night' ? 420 : style === 'rain-drone' ? 520 : 280,
        ctx.currentTime
      );

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(
        style === 'wind-night' ? 0.58 : style === 'rain-drone' ? 0.5 : 0.3,
        ctx.currentTime
      );

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(master);
      noise.start();
      this.noiseNode = noise;

      const addDroneOsc = (freq: number, type: OscillatorType, gainAmt: number, cutoff = 260) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(cutoff, ctx.currentTime);

        const g = ctx.createGain();
        g.gain.setValueAtTime(gainAmt, ctx.currentTime);

        osc.connect(filter);
        filter.connect(g);
        g.connect(master);
        osc.start();
        this.oscList.push(osc);
      };

      if (style === 'cello-noir') {
        addDroneOsc(65.41, 'sawtooth', 0.16, 200); // C2
        addDroneOsc(98.0, 'triangle', 0.22, 240); // G2
        addDroneOsc(155.56, 'sine', 0.14, 300); // Eb3
      } else if (style === 'wind-night') {
        addDroneOsc(55.0, 'sine', 0.22, 180);
      } else {
        addDroneOsc(73.42, 'sine', 0.24, 220); // D2
        addDroneOsc(110.0, 'triangle', 0.18, 220); // A2
      }

      this.active = true;

      if (style === 'heartbeat') {
        const triggerHeartbeat = () => {
          if (!this.ctx || !this.masterGain || !this.active) return;
          const t = this.ctx.currentTime;
          const beat = (delay: number, peak: number) => {
            if (!this.ctx || !this.masterGain) return;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(64, t + delay);
            o.frequency.exponentialRampToValueAtTime(34, t + delay + 0.18);
            g.gain.setValueAtTime(0.001, t + delay);
            g.gain.exponentialRampToValueAtTime(peak, t + delay + 0.025);
            g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.22);
            o.connect(g);
            g.connect(this.masterGain);
            o.start(t + delay);
            o.stop(t + delay + 0.24);
          };
          beat(0, 0.42);
          beat(0.24, 0.26);
        };
        triggerHeartbeat();
        this.pulseInterval = window.setInterval(triggerHeartbeat, 1300);
      } else if (style === 'tick-clock') {
        let isOdd = false;
        const triggerTick = () => {
          if (!this.ctx || !this.masterGain || !this.active) return;
          const t = this.ctx.currentTime;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(isOdd ? 680 : 880, t);
          isOdd = !isOdd;
          g.gain.setValueAtTime(0.001, t);
          g.gain.exponentialRampToValueAtTime(0.2, t + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0008, t + 0.06);
          o.connect(g);
          g.connect(this.masterGain);
          o.start(t);
          o.stop(t + 0.07);
        };
        triggerTick();
        this.pulseInterval = window.setInterval(triggerTick, 1000);
      } else if (style === 'rain-drone') {
        const triggerDrop = () => {
          if (!this.ctx || !this.masterGain || !this.active) return;
          const t = this.ctx.currentTime;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(420 + Math.random() * 280, t);
          o.frequency.exponentialRampToValueAtTime(220, t + 0.14);
          g.gain.setValueAtTime(0.001, t);
          g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          o.connect(g);
          g.connect(this.masterGain);
          o.start(t);
          o.stop(t + 0.18);
        };
        this.pulseInterval = window.setInterval(triggerDrop, 1600);
      }

      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  public stop(): void {
    this.active = false;
    if (this.pulseInterval !== null) {
      window.clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }

    if (this.customAudioEl) {
      try {
        this.customAudioEl.pause();
        this.customAudioEl.src = '';
      } catch {
        // ignore
      }
      this.customAudioEl = null;
    }
    if (this.customObjectUrl) {
      URL.revokeObjectURL(this.customObjectUrl);
      this.customObjectUrl = null;
    }

    const ctxToClose = this.ctx;
    const oscs = this.oscList;
    const noise = this.noiseNode;
    const master = this.masterGain;

    this.ctx = null;
    this.oscList = [];
    this.noiseNode = null;
    this.masterGain = null;

    try {
      if (ctxToClose && master) {
        master.gain.setTargetAtTime(0.0001, ctxToClose.currentTime, 0.1);
      }
      window.setTimeout(() => {
        try {
          oscs.forEach((o) => o.stop());
          noise?.stop();
          ctxToClose?.close().catch(() => {});
        } catch {
          // ignore
        }
      }, 180);
    } catch {
      // ignore
    }
  }
}

export const nightAmbient = new NightAmbientEngine();
