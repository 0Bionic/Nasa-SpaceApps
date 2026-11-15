import { create } from 'zustand';
import { MISSION_PROFILES } from '@/domain/mission';
import type { MissionEnvironment } from '@/domain/types';

/**
 * Simulated comm link: a ground packet takes the habitat's one-way signal
 * delay to arrive, and the earliest reply takes another delay to come back.
 * Real deep-space links also wait for a comm window; this models delay only.
 */
export interface Uplink {
  id: string;
  sentAt: number;
  arrivesAt: number;
  earliestReplyAt: number;
  destination: string;
}

const KEY = 'aetherhealth-uplinks';

function load(): Uplink[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Uplink[]) : [];
  } catch {
    return [];
  }
}

function save(list: Uplink[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable; queue lives for this visit only */
  }
}

export const useUplinks = create<{ uplinks: Uplink[]; enqueue: (env: MissionEnvironment) => Uplink }>((set, get) => ({
  uplinks: load(),
  enqueue: (env) => {
    const p = MISSION_PROFILES[env];
    const sentAt = Date.now();
    const oneWay = p.delaySeconds * 1000;
    const u: Uplink = {
      id: `up-${sentAt}`,
      sentAt,
      arrivesAt: sentAt + oneWay,
      earliestReplyAt: sentAt + oneWay * 2,
      destination: p.destination,
    };
    const next = [u, ...get().uplinks].slice(0, 10);
    save(next);
    set({ uplinks: next });
    return u;
  },
}));

export type UplinkStatus = 'transit' | 'awaiting-reply' | 'reply-window';

export function uplinkStatus(u: Uplink, now: number): UplinkStatus {
  if (now < u.arrivesAt) return 'transit';
  if (now < u.earliestReplyAt) return 'awaiting-reply';
  return 'reply-window';
}
