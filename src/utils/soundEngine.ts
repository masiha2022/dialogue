import { AlarmSoundId, NightTrackId, RevealSoundId } from '../types/game';
import { CustomAudioSlot, getCustomAudioUrl } from './audioStorage';

/**
 * 100% Offline Web Audio API + Custom IndexedDB Audio Engine
 * Supports unlimited custom user night audio tracks and selectable Timer Alarms.
 */

export const NIGHT_TRACK_OPTIONS: { id: NightTrackId; label: string; subtitle: string }[] = [];

export const ALARM_SOUND_OPTIONS: { id: AlarmSoundId; label: string }[] = [
  { id: 'bell', label: 'زنگ پذیرش هتل (Service Bell)' },
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

function triggerSingleServiceBell(ctx: AudioContext, startOffset = 0): void {
  const t = ctx.currentTime + startOffset;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.88, t);
  master.connect(ctx.destination);

  // Bright steel/brass hotel reception desk bell partials (~2136 Hz fundamental)
  const partials: { freq: number; gain: number; decay: number }[] = [
    { freq: 1068, gain: 0.06, decay: 0.55 },
    { freq: 2136, gain: 0.36, decay: 1.45 },
    { freq: 2141, gain: 0.15, decay: 1.25 },
    { freq: 4272, gain: 0.16, decay: 0.68 },
    { freq: 5880, gain: 0.09, decay: 0.35 },
    { freq: 8480, gain: 0.04, decay: 0.12 },
  ];

  for (const partial of partials) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(partial.freq, t);

    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(partial.gain, t + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, t + partial.decay);

    osc.connect(env);
    env.connect(master);
    osc.start(t);
    osc.stop(t + partial.decay + 0.04);
  }

  // Crisp mechanical plunger / clapper strike transient
  const strikeOsc = ctx.createOscillator();
  const strikeEnv = ctx.createGain();
  strikeOsc.type = 'triangle';
  strikeOsc.frequency.setValueAtTime(4400, t);
  strikeOsc.frequency.exponentialRampToValueAtTime(2500, t + 0.02);
  strikeEnv.gain.setValueAtTime(0.0001, t);
  strikeEnv.gain.linearRampToValueAtTime(0.24, t + 0.0012);
  strikeEnv.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);
  strikeOsc.connect(strikeEnv);
  strikeEnv.connect(master);
  strikeOsc.start(t);
  strikeOsc.stop(t + 0.03);

  // Subtle metallic contact click burst
  try {
    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * 0.014));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(3200, t);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, t);
    noise.connect(hp);
    hp.connect(noiseGain);
    noiseGain.connect(master);
    noise.start(t);
  } catch {
    // Ignore optional noise buffer error
  }
}

function playServiceBell(ctx: AudioContext, repeatCount: 1 | 2 = 1): void {
  triggerSingleServiceBell(ctx, 0);
  if (repeatCount === 2) {
    triggerSingleServiceBell(ctx, 0.34);
  }
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

export async function playTimerEndAlarm(
  alarmId: AlarmSoundId = 'bell',
  repeatCount: 1 | 2 = 1
): Promise<void> {
  if (alarmId === 'custom') {
    const url = await getCustomAudioUrl('timer_alarm');
    if (url) {
      try {
        const audio = new Audio(url);
        audio.volume = 0.9;
        await audio.play();
        if (repeatCount === 2) {
          window.setTimeout(() => {
            const secondAudio = new Audio(url);
            secondAudio.volume = 0.9;
            void secondAudio.play().catch(() => {});
          }, 420);
        }
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
        playServiceBell(ctx, repeatCount);
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
  private customAudioEl: HTMLAudioElement | null = null;
  private customObjectUrl: string | null = null;
  private active = false;
  private volume = 0.65;
  private currentTrackId: NightTrackId = 'custom';

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
  }

  private resolveCustomSlot(trackId: NightTrackId): CustomAudioSlot | null {
    if (trackId === 'custom') return 'night_music';
    if (trackId.startsWith('custom:')) {
      return `night_custom_${trackId.slice('custom:'.length)}`;
    }
    return null;
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

    const customSlot = this.resolveCustomSlot(this.currentTrackId);
    if (!customSlot) return false;

    const url = await getCustomAudioUrl(customSlot);
    if (!url) return false;

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
      return false;
    }
  }

  public stop(): void {
    this.active = false;

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
  }
}

export const nightAmbient = new NightAmbientEngine();
