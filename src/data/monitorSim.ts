import type { Activity, MonitorMode, MonitorSample, SleepNight } from '@/domain/monitoring';

/**
 * Simulated wearable (no real hardware is connected). Produces plausible heart rate,
 * SpO₂, breathing and skin temperature for each monitoring mode, including the
 * dropouts and motion artifacts NASA reports for chest-strap and garment sensors.
 */

export type Injection = 'desat' | 'tachy' | 'dropout';

/** Small seeded PRNG so a given night or session is repeatable. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * clamp(k, 0, 1);

/** Chance per sample that a dropout starts (motion artifact is worse in a suit or while exercising). */
const DROPOUT_P: Record<MonitorMode, number> = { eva: 0.012, exercise: 0.015, ambulatory: 0.004 };

export class SensorSimulator {
  private rand: () => number;
  private t = 0;
  private hrNoise = 0;
  private dropoutLeft = 0;
  private desatLeft = 0;
  private tachyLeft = 0;
  /** Wall-clock hour the 24-h session started, so sleep falls at night. */
  private startHour: number;

  constructor(
    private mode: MonitorMode,
    seed = Date.now(),
    startHour = new Date().getHours() + new Date().getMinutes() / 60,
  ) {
    this.rand = mulberry32(seed);
    this.startHour = startHour;
  }

  /** Demo controls: script an event so the on-device alerting can be shown. Lengths are in samples. */
  inject(kind: Injection) {
    if (kind === 'desat') this.desatLeft = 45;
    if (kind === 'tachy') this.tachyLeft = 40;
    if (kind === 'dropout') this.dropoutLeft = 18;
  }

  /** Advance by dt simulated seconds and return one sample. */
  next(dt: number): MonitorSample {
    this.t += dt;
    const r = this.rand;
    const { activity, hrBase, resp } = this.profile();

    this.hrNoise = this.hrNoise * 0.8 + (r() - 0.5) * 3;
    let hr = hrBase + this.hrNoise;
    let spo2 = (activity === 'sleep' ? 96 : 97.5) + (r() - 0.5) * 1.6;

    if (this.tachyLeft > 0) {
      const k = Math.min(1, (40 - this.tachyLeft) / 8, this.tachyLeft / 6);
      hr += 75 * k;
      this.tachyLeft--;
    }
    if (this.desatLeft > 0) {
      const k = Math.min(1, (45 - this.desatLeft) / 10, this.desatLeft / 8);
      spo2 -= 10 * k;
      this.desatLeft--;
    }

    if (this.dropoutLeft === 0 && r() < DROPOUT_P[this.mode]) {
      this.dropoutLeft = 3 + Math.floor(r() * 12);
    }

    const base = {
      t: Math.round(this.t),
      resp: Math.round(resp + (r() - 0.5) * 2),
      skinTemp: +(33.4 + (activity === 'exertion' ? 0.6 : 0) + (r() - 0.5) * 0.3).toFixed(1),
      activity,
    };

    if (this.dropoutLeft > 0) {
      this.dropoutLeft--;
      // Half of a dropout reads nothing; the rest is junk from motion artifact.
      const junk = r() < 0.5;
      return {
        ...base,
        hr: junk ? Math.round(30 + r() * 190) : null,
        spo2: junk ? Math.round(80 + r() * 20) : null,
        quality: +(0.1 + r() * 0.3).toFixed(2),
      };
    }

    return {
      ...base,
      hr: Math.round(hr),
      spo2: Math.round(clamp(spo2, 70, 100)),
      quality: +(0.82 + r() * 0.18).toFixed(2),
    };
  }

  private profile(): { activity: Activity; hrBase: number; resp: number } {
    const t = this.t;
    if (this.mode === 'exercise') {
      // 3 min warm-up, 15 min work rising to a hard finish, 3 min cool-down, then repeat.
      const m = (t / 60) % 21;
      if (m < 3) return { activity: 'active', hrBase: lerp(72, 110, m / 3), resp: lerp(14, 22, m / 3) };
      if (m < 18) return { activity: 'exertion', hrBase: lerp(110, 158, (m - 3) / 15), resp: lerp(22, 34, (m - 3) / 15) };
      return { activity: 'active', hrBase: lerp(150, 85, (m - 18) / 3), resp: lerp(32, 16, (m - 18) / 3) };
    }
    if (this.mode === 'eva') {
      // Tasks of varying effort with short rests between them.
      const work = 0.5 + 0.5 * Math.sin(t / 95) * Math.sin(t / 37 + 1);
      const hrBase = 88 + 40 * clamp(work, 0, 1);
      return { activity: work > 0.6 ? 'exertion' : 'active', hrBase, resp: 16 + 12 * work };
    }
    // 24-hour session: sleep 23:00–07:00, two exercise bouts, rest otherwise.
    const hour = (this.startHour + t / 3600) % 24;
    if (hour >= 23 || hour < 7) return { activity: 'sleep', hrBase: 55 + 3 * Math.sin(t / 2400), resp: 13 };
    if ((hour >= 9 && hour < 10) || (hour >= 16 && hour < 17)) {
      const k = Math.sin(((hour % 1) * Math.PI));
      return { activity: k > 0.5 ? 'exertion' : 'active', hrBase: 80 + 60 * k, resp: 16 + 14 * k };
    }
    return { activity: 'rest', hrBase: 68 + 6 * Math.sin(t / 1800), resp: 15 };
  }
}

/**
 * Simulated actigraphy (wrist motion sensor) for recent nights. NASA's medical standard
 * schedules objective sleep measurement continuously through the mission (OCHMO-STD-100.1A [6039]).
 * Deterministic per mission day, so each night stays the same between visits.
 */
export function actigraphyNights(missionDay: number, count = 7): SleepNight[] {
  const nights: SleepNight[] = [];
  for (let d = missionDay - count + 1; d <= missionDay; d++) {
    if (d < 1) continue;
    const r = mulberry32(d * 7919 + 17);
    const onsetMin = Math.round(270 + r() * 120); // 22:30–00:30
    const totalSleepH = +(5.4 + r() * 2.5).toFixed(1);
    const awakenings = Math.floor(r() * 5);
    const inBedH = totalSleepH + 0.3 + awakenings * 0.12 + r() * 0.4;
    const efficiencyPct = Math.round((totalSleepH / inBedH) * 100);
    const epochCount = Math.round((inBedH * 60) / 10);
    const wakeAt = new Set(Array.from({ length: awakenings }, () => Math.floor(r() * epochCount)));
    const epochs = Array.from({ length: epochCount }, (_, i) => {
      const edge = i < 2 || i > epochCount - 3;
      if (wakeAt.has(i)) return Math.round(60 + r() * 40);
      return Math.round((edge ? 25 : 4) + r() * (edge ? 30 : 14));
    });
    nights.push({ missionDay: d, onsetMin, totalSleepH, efficiencyPct, awakenings, epochs });
  }
  return nights;
}
