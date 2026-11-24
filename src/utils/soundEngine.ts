import { AlarmSoundId, BuiltInNightTrackId, NightTrackId, RevealSoundId } from '../types/game';
import { CustomAudioSlot, getCustomAudioUrl } from './audioStorage';

/**
 * 100% Offline Web Audio API + Custom IndexedDB Audio Engine
 * Supports 7 high-density whisper-masking Night Cover tracks + unlimited custom user audio tracks,
 * 5 selectable Timer Alarms + custom user alarm, and 4 Role Reveal SFX.
 */

export const NIGHT_TRACK_OPTIONS: { id: BuiltInNightTrackId; label: string; subtitle: string }[] = [
  {
    id: 'wind-night',
    label: 'نویز ضد نجوا (طیف گفتار)',
    subtitle: 'پوشش متراکم فرکانس‌های پچ‌پچ و نفس بدون لحظه سکوت',
  },
  {
    id: 'crowd-murmur',
    label: 'همهمه شلوغ کافه و محیط',
    subtitle: 'شبیه‌سازی صدای همهمه جمع برای محو کردن صدای مافیا',
  },
  {
    id: 'techno-pulse',
    label: 'ریتم الکترونیک تند (ضد سکوت)',
    subtitle: 'بیت سریع ۱۳۶BPM همراه با باس کوبنده و نویز پیوسته',
  },
  {
    id: 'heartbeat',
    label: 'باس کوبنده و ضرباهنگ پرانرژی',
    subtitle: 'کوبش سنگین و پرشتاب همراه با لایه نویز متراکم',
  },
  {
    id: 'rain-drone',
    label: 'طوفان شدید و بارش سنگین',
    subtitle: 'باران پرقدرت و رگبار پیوسته برای پوشش کامل اتاق',
  },
  {
    id: 'tick-clock',
    label: 'ضرب‌آهنگ صنعتی و متراکم',
    subtitle: 'کوبش‌های پی‌درپی مکانیکی و نویز میان‌رده ضد نجوا',
  },
  {
    id: 'cello-noir',
    label: 'تنش تاریک و ساینده سینمایی',
    subtitle: 'سینت پرفشار و نویز فیلترشده پرانرژی (غیرآرامش‌بخش)',
  },
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
  private volume = 0.65;
  private currentTrackId: NightTrackId = 'wind-night';

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
      this.masterGain.gain.setTargetAtTime(this.volume * 0.65, this.ctx.currentTime, 0.08);
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
    if (customSlot) {
      const url = await getCustomAudioUrl(customSlot);
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
          // Fallback cleanly to built-in speech-masking track if playback fails
        }
      }
    }

    try {
      const AudioCtx = getAudioContextClass();
      if (!AudioCtx) return false;

      const ctx = new AudioCtx();
      this.ctx = ctx;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, ctx.currentTime);
      compressor.knee.setValueAtTime(12, ctx.currentTime);
      compressor.ratio.setValueAtTime(6, ctx.currentTime);
      compressor.attack.setValueAtTime(0.005, ctx.currentTime);
      compressor.release.setValueAtTime(0.12, ctx.currentTime);

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(
        Math.max(0.02, this.volume * 0.65),
        ctx.currentTime + 0.35
      );
      compressor.connect(master);
      master.connect(ctx.destination);
      this.masterGain = master;

      const style: BuiltInNightTrackId = customSlot
        ? 'wind-night'
        : (this.currentTrackId as BuiltInNightTrackId);

      // Dense Pink + Speech-Band Noise Buffer (4 seconds seamless loop)
      const bufferSize = ctx.sampleRate * 4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
        output[i] = Math.max(-1, Math.min(1, pink * 1.45));
      }

      // Layer 1: Broadband Speech-Masking Bed (buries whisper frequencies 350Hz - 3800Hz)
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const speechBandFilter = ctx.createBiquadFilter();
      speechBandFilter.type = 'bandpass';
      speechBandFilter.frequency.setValueAtTime(
        style === 'wind-night'
          ? 1250
          : style === 'crowd-murmur'
          ? 980
          : style === 'rain-drone'
          ? 1650
          : 1100,
        ctx.currentTime
      );
      speechBandFilter.Q.setValueAtTime(
        style === 'wind-night' ? 0.55 : style === 'crowd-murmur' ? 0.8 : 0.65,
        ctx.currentTime
      );

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(
        style === 'wind-night'
          ? 0.92
          : style === 'rain-drone'
          ? 0.88
          : style === 'crowd-murmur'
          ? 0.82
          : 0.45,
        ctx.currentTime
      );

      noise.connect(speechBandFilter);
      speechBandFilter.connect(noiseGain);
      noiseGain.connect(compressor);
      noise.start();
      this.noiseNode = noise;

      // Layer 2: Low-mid rumble / sub density (masks footsteps, chair creaks & cloth rustling)
      const rumbleNoise = ctx.createBufferSource();
      rumbleNoise.buffer = noiseBuffer;
      rumbleNoise.loop = true;
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = 'lowpass';
      rumbleFilter.frequency.setValueAtTime(340, ctx.currentTime);
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.setValueAtTime(0.55, ctx.currentTime);
      rumbleNoise.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(compressor);
      rumbleNoise.start(0, 1.3);
      // Store cleanup via stop() by tracking extra source on oscList-like wrapper? AudioBufferSourceNode also has .stop()
      this.oscList.push(rumbleNoise as unknown as OscillatorNode);

      // LFO modulation on speech-band filter so it sounds dynamic and masks shifting whisper tones
      const filterLfo = ctx.createOscillator();
      filterLfo.type = 'triangle';
      filterLfo.frequency.setValueAtTime(
        style === 'crowd-murmur' ? 2.8 : style === 'wind-night' ? 0.75 : 1.4,
        ctx.currentTime
      );
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(style === 'crowd-murmur' ? 420 : 280, ctx.currentTime);
      filterLfo.connect(lfoGain);
      lfoGain.connect(speechBandFilter.frequency);
      filterLfo.start();
      this.oscList.push(filterLfo);

      const addSynthLayer = (freq: number, type: OscillatorType, gainAmt: number, cutoff = 900) => {
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
        g.connect(compressor);
        osc.start();
        this.oscList.push(osc);
      };

      if (style === 'cello-noir') {
        // Gritty detuned tension synth (non-relaxing)
        addSynthLayer(65.41, 'sawtooth', 0.24, 620);
        addSynthLayer(66.15, 'sawtooth', 0.22, 680);
        addSynthLayer(98.0, 'square', 0.14, 780);
        addSynthLayer(155.56, 'sawtooth', 0.12, 1100);
      } else if (style === 'techno-pulse' || style === 'heartbeat') {
        addSynthLayer(55.0, 'sawtooth', 0.22, 420);
        addSynthLayer(110.0, 'square', 0.12, 720);
      } else if (style === 'tick-clock') {
        addSynthLayer(82.41, 'sawtooth', 0.16, 480);
      } else if (style === 'crowd-murmur') {
        addSynthLayer(130.81, 'sawtooth', 0.08, 380);
      }

      this.active = true;

      if (style === 'heartbeat') {
        // Driving 130 BPM punchy kick + crisp off-beat snare/hat burst (NO quiet gaps)
        let step = 0;
        const triggerBeat = () => {
          if (!this.ctx || !this.masterGain || !this.active) return;
          const t = this.ctx.currentTime;
          const isKick = step % 2 === 0;
          step++;

          if (isKick) {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.setValueAtTime(125, t);
            o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
            g.gain.setValueAtTime(0.001, t);
            g.gain.exponentialRampToValueAtTime(0.65, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.21);
            o.connect(g);
            g.connect(compressor);
            o.start(t);
            o.stop(t + 0.23);
          } else {
            // Sharp mid-high percussion hit to mask whispers on off-beats
            const hat = this.ctx.createBufferSource();
            hat.buffer = noiseBuffer;
            const hp = this.ctx.createBiquadFilter();
            hp.type = 'bandpass';
            hp.frequency.setValueAtTime(2400, t);
            const hg = this.ctx.createGain();
            hg.gain.setValueAtTime(0.45, t);
            hg.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
            hat.connect(hp);
            hp.connect(hg);
            hg.connect(compressor);
            hat.start(t, Math.random() * 2);
            hat.stop(t + 0.12);
          }
        };
        triggerBeat();
        this.pulseInterval = window.setInterval(triggerBeat, 230);
      } else if (style === 'techno-pulse') {
        // Fast 136 BPM energetic bassline arpeggio + snare/hat groove
        const bassNotes = [55.0, 55.0, 65.41, 73.42, 55.0, 82.41, 65.41, 49.0];
        let step = 0;
        const triggerStep = () => {
          if (!this.ctx || !this.masterGain || !this.active) return;
          const t = this.ctx.currentTime;
          const note = bassNotes[step % bassNotes.length];
          const isKick = step % 2 === 0;
          const isSnare = step % 4 === 2;
          step++;

          // Driving sawtooth bass step
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const g = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(note * 2, t);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(950, t);
          filter.frequency.exponentialRampToValueAtTime(260, t + 0.18);
          g.gain.setValueAtTime(0.001, t);
          g.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.19);
          osc.connect(filter);
          filter.connect(g);
          g.connect(compressor);
          osc.start(t);
          osc.stop(t + 0.2);

          if (isKick) {
            const k = this.ctx.createOscillator();
            const kg = this.ctx.createGain();
            k.type = 'sine';
            k.frequency.setValueAtTime(135, t);
            k.frequency.exponentialRampToValueAtTime(44, t + 0.14);
            kg.gain.setValueAtTime(0.55, t);
            kg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            k.connect(kg);
            kg.connect(compressor);
            k.start(t);
            k.stop(t + 0.17);
          }

          if (isSnare) {
            const sn = this.ctx.createBufferSource();
            sn.buffer = noiseBuffer;
            const bp = this.ctx.createBiquadFilter();
            bp.type = 'bandpass';
            bp.frequency.setValueAtTime(1800, t);
            const sg = this.ctx.createGain();
            sg.gain.setValueAtTime(0.5, t);
            sg.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
            sn.connect(bp);
            bp.connect(sg);
            sg.connect(compressor);
            sn.start(t, Math.random() * 2);
            sn.stop(t + 0.15);
          }
        };
        triggerStep();
        this.pulseInterval = window.setInterval(triggerStep, 220);
      } else if (style === 'tick-clock') {
        // Fast industrial rhythmic percussion every 240ms
        let step = 0;
        const triggerIndustrial = () => {
          if (!this.ctx || !this.masterGain || !this.active) return;
          const t = this.ctx.currentTime;
          const accent = step % 4 === 0;
          step++;

          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'square';
          o.frequency.setValueAtTime(accent ? 520 : 780, t);
          o.frequency.exponentialRampToValueAtTime(180, t + 0.08);
          g.gain.setValueAtTime(0.001, t);
          g.gain.exponentialRampToValueAtTime(accent ? 0.28 : 0.16, t + 0.005);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
          o.connect(g);
          g.connect(compressor);
          o.start(t);
          o.stop(t + 0.1);

          const burst = this.ctx.createBufferSource();
          burst.buffer = noiseBuffer;
          const bp = this.ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(accent ? 1600 : 2800, t);
          const bg = this.ctx.createGain();
          bg.gain.setValueAtTime(accent ? 0.42 : 0.26, t);
          bg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
          burst.connect(bp);
          bp.connect(bg);
          bg.connect(compressor);
          burst.start(t, Math.random() * 2);
          burst.stop(t + 0.11);
        };
        triggerIndustrial();
        this.pulseInterval = window.setInterval(triggerIndustrial, 240);
      } else if (style === 'crowd-murmur') {
        // Overlapping synthetic speech-formant chatter bursts to bury real whispers
        const triggerChatter = () => {
          if (!this.ctx || !this.masterGain || !this.active) return;
          const t = this.ctx.currentTime;
          const src = this.ctx.createBufferSource();
          src.buffer = noiseBuffer;
          const formant = this.ctx.createBiquadFilter();
          formant.type = 'bandpass';
          formant.frequency.setValueAtTime(480 + Math.random() * 1700, t);
          formant.Q.setValueAtTime(2.2, t);
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.45, t + 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
          src.connect(formant);
          formant.connect(g);
          g.connect(compressor);
          src.start(t, Math.random() * 2);
          src.stop(t + 0.45);
        };
        triggerChatter();
        this.pulseInterval = window.setInterval(triggerChatter, 190);
      } else if (style === 'rain-drone') {
        // Heavy continuous storm surges + thunder rumbles
        const triggerSurge = () => {
          if (!this.ctx || !this.masterGain || !this.active) return;
          const t = this.ctx.currentTime;
          const surge = this.ctx.createBufferSource();
          surge.buffer = noiseBuffer;
          const bp = this.ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(600 + Math.random() * 1800, t);
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(0.38, t + 0.25);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
          surge.connect(bp);
          bp.connect(g);
          g.connect(compressor);
          surge.start(t, Math.random() * 2);
          surge.stop(t + 0.95);
        };
        triggerSurge();
        this.pulseInterval = window.setInterval(triggerSurge, 550);
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
