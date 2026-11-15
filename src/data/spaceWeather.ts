import { create } from 'zustand';

/**
 * Live space weather from NASA's DONKI service (Space Weather Database Of
 * Notifications, Knowledge, Information; run by the CCMC at Goddard).
 * Fetched when online, cached on the device, and shown offline with its sync time.
 *   https://api.nasa.gov/DONKI/FLR  solar flares
 *   https://api.nasa.gov/DONKI/SEP  solar energetic particle events
 */

export interface Flare {
  id: string;
  peakTime: string;
  classType: string;
  sourceLocation?: string;
  link?: string;
}

export interface SepEvent {
  id: string;
  eventTime: string;
  link?: string;
}

export interface SpaceWeather {
  syncedAt: number;
  rangeDays: number;
  flares: Flare[];
  seps: SepEvent[];
}

const KEY = 'aetherhealth-donki';
const RANGE_DAYS = 30;
const STALE_MS = 6 * 60 * 60 * 1000;
const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';

function load(): SpaceWeather | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SpaceWeather) : null;
  } catch {
    return null;
  }
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Rank a GOES class like "X1.2" or "M5.0" so flares can be compared. */
export function flareRank(cls: string): number {
  const scale: Record<string, number> = { A: 0, B: 1, C: 2, M: 3, X: 4 };
  const letter = cls.trim().charAt(0).toUpperCase();
  const n = parseFloat(cls.slice(1)) || 0;
  return (scale[letter] ?? -1) * 100 + n;
}

async function getJson<T>(path: string, start: string, end: string): Promise<T[]> {
  const url = `https://api.nasa.gov/DONKI/${path}?startDate=${start}&endDate=${end}&api_key=${API_KEY}`;
  const res = await fetch(url);
  if (res.status === 429) {
    throw new Error(
      API_KEY === 'DEMO_KEY'
        ? "NASA's shared DEMO_KEY hit its hourly limit. Add a free api.nasa.gov key as VITE_NASA_API_KEY in .env.local, or sync again later."
        : 'NASA API rate limit reached; sync again later.',
    );
  }
  if (!res.ok) throw new Error(`NASA DONKI ${path} returned ${res.status}; showing the last synced data.`);
  const text = await res.text();
  if (!text.trim()) return []; // DONKI returns an empty body when there are no events
  const data = JSON.parse(text) as unknown;
  return Array.isArray(data) ? (data as T[]) : [];
}

interface RawFlare {
  flrID: string;
  peakTime?: string;
  beginTime: string;
  classType?: string;
  sourceLocation?: string;
  link?: string;
}
interface RawSep {
  sepID: string;
  eventTime: string;
  link?: string;
}

export const useSpaceWeather = create<{
  data: SpaceWeather | null;
  status: 'idle' | 'loading' | 'ok' | 'error';
  error: string;
  refresh: (force?: boolean) => Promise<void>;
}>((set, get) => ({
  data: load(),
  status: 'idle',
  error: '',
  refresh: async (force = false) => {
    const { data, status } = get();
    if (status === 'loading') return;
    if (!force && data && Date.now() - data.syncedAt < STALE_MS) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      set({ status: 'error', error: 'Offline: showing the last synced data.' });
      return;
    }
    set({ status: 'loading', error: '' });
    try {
      const end = new Date();
      const start = new Date(end.getTime() - RANGE_DAYS * 86400000);
      const [rawFlares, rawSeps] = await Promise.all([
        getJson<RawFlare>('FLR', ymd(start), ymd(end)),
        getJson<RawSep>('SEP', ymd(start), ymd(end)),
      ]);
      const next: SpaceWeather = {
        syncedAt: Date.now(),
        rangeDays: RANGE_DAYS,
        flares: rawFlares
          .map((f) => ({ id: f.flrID, peakTime: f.peakTime || f.beginTime, classType: f.classType || '?', sourceLocation: f.sourceLocation, link: f.link }))
          .sort((a, b) => (a.peakTime < b.peakTime ? 1 : -1)),
        seps: rawSeps.map((s) => ({ id: s.sepID, eventTime: s.eventTime, link: s.link })).sort((a, b) => (a.eventTime < b.eventTime ? 1 : -1)),
      };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage full or unavailable; keep in memory */
      }
      set({ data: next, status: 'ok' });
    } catch (e) {
      set({ status: 'error', error: e instanceof Error ? e.message : 'Could not reach NASA DONKI.' });
    }
  },
}));

/** Summary used by the UI: strongest flare, most recent SEP, and whether to advise shelter readiness. */
export function summarizeSpaceWeather(d: SpaceWeather, now = Date.now()) {
  const strongest = [...d.flares].sort((a, b) => flareRank(b.classType) - flareRank(a.classType))[0] ?? null;
  const latestSep = d.seps[0] ?? null;
  const sepAgeDays = latestSep ? (now - new Date(latestSep.eventTime).getTime()) / 86400000 : null;
  const recentX = d.flares.some((f) => flareRank(f.classType) >= 400 && now - new Date(f.peakTime).getTime() < 3 * 86400000);
  const alert: 'sep' | 'xflare' | null = sepAgeDays != null && sepAgeDays <= 3 ? 'sep' : recentX ? 'xflare' : null;
  return { strongest, latestSep, sepAgeDays, alert, flareCount: d.flares.length, sepCount: d.seps.length };
}
