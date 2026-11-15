import { create } from 'zustand';
import {
  MonitorEngine,
  downsample,
  type MonitorEvent,
  type MonitorMode,
  type MonitorSample,
  type MonitorSession,
} from '@/domain/monitoring';
import { SensorSimulator, type Injection } from '@/data/monitorSim';
import { saveMonitorSession } from '@/data/monitorRepo';

/** Simulated seconds per real second. 24-h sessions can be sped up for a demo. */
export type Speed = 1 | 60 | 600;

const DAY_S = 24 * 3600;
const WINDOW = 120;

interface LiveState {
  status: 'idle' | 'running';
  mode: MonitorMode;
  speed: Speed;
  startedAt: string | null;
  elapsedS: number;
  /** Rolling window shown in the live chart. */
  window: MonitorSample[];
  current: MonitorSample | null;
  events: MonitorEvent[];
  hrActive: MonitorEngine['state']['hr']['active'];
  spo2Active: MonitorEngine['state']['spo2']['active'];
  signalLost: boolean;
  /** Last saved session, so the page can point to it. */
  lastSaved: MonitorSession | null;
  start: (mode: MonitorMode, speed: Speed) => void;
  stop: () => Promise<MonitorSession | null>;
  discard: () => void;
  inject: (kind: Injection) => void;
}

// The recording lives outside React so it keeps going when the crew switches pages.
let timer: ReturnType<typeof setInterval> | null = null;
let sim: SensorSimulator | null = null;
let engine: MonitorEngine | null = null;
let all: MonitorSample[] = [];

function clear() {
  if (timer) clearInterval(timer);
  timer = null;
  sim = null;
  engine = null;
  all = [];
}

export const useLiveMonitor = create<LiveState>((set, get) => ({
  status: 'idle',
  mode: 'eva',
  speed: 1,
  startedAt: null,
  elapsedS: 0,
  window: [],
  current: null,
  events: [],
  hrActive: 'green',
  spo2Active: 'green',
  signalLost: false,
  lastSaved: null,

  start: (mode, speed) => {
    clear();
    const fast = speed > 1;
    sim = new SensorSimulator(mode);
    // Faster playback means each sample stands for a longer epoch, so fewer are needed to confirm.
    engine = new MonitorEngine({ persist: fast ? 2 : 5, lossAfter: fast ? 3 : 8 });
    const intervalMs = fast ? 250 : 1000;
    const dt = (speed * intervalMs) / 1000;
    set({
      status: 'running',
      mode,
      speed,
      startedAt: new Date().toISOString(),
      elapsedS: 0,
      window: [],
      current: null,
      events: [],
      hrActive: 'green',
      spo2Active: 'green',
      signalLost: false,
      lastSaved: null,
    });

    // Driven by the wall clock, not the tick count: browsers slow timers in background
    // tabs, so each tick generates every sample that is due (capped) to keep time true.
    let last = performance.now();
    let due = 0;
    timer = setInterval(() => {
      if (!sim || !engine) return;
      const now = performance.now();
      due += ((now - last) / 1000) * speed;
      last = now;
      const fresh: MonitorSample[] = [];
      while (due >= dt && fresh.length < 600) {
        due -= dt;
        const s = sim.next(dt);
        engine.push(s);
        all.push(s);
        fresh.push(s);
        if (get().mode === 'ambulatory' && s.t >= DAY_S) break;
      }
      if (fresh.length === 0) return;
      const s = fresh[fresh.length - 1];
      set((st) => ({
        elapsedS: s.t,
        current: s,
        window: [...st.window, ...fresh].slice(-WINDOW),
        events: [...engine!.events],
        hrActive: engine!.state.hr.active,
        spo2Active: engine!.state.spo2.active,
        signalLost: engine!.signalLost,
      }));
      // A 24-h session ends itself after a full day.
      if (get().mode === 'ambulatory' && s.t >= DAY_S) void get().stop();
    }, intervalMs);
  },

  stop: async () => {
    const { startedAt, mode, elapsedS } = get();
    if (!engine || !startedAt || all.length === 0) {
      clear();
      set({ status: 'idle' });
      return null;
    }
    const e = engine;
    const samples = downsample(all);
    clear();
    const saved = await saveMonitorSession({
      mode,
      startedAt,
      endedAt: new Date().toISOString(),
      durationS: elapsedS,
      samples,
      events: e.events,
      stats: e.stats(),
      worstSeverity: e.worst,
      downlinked: false,
    });
    set({ status: 'idle', lastSaved: saved });
    return saved;
  },

  discard: () => {
    clear();
    set({ status: 'idle', window: [], current: null, events: [], elapsedS: 0 });
  },

  inject: (kind) => sim?.inject(kind),
}));
