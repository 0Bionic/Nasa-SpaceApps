import { create } from 'zustand';

/**
 * Earth mode: the same offline triage engine, worded for clinics and home care
 * instead of a spacecraft. Only labels change; thresholds and logic stay the same.
 */
export type Audience = 'mission' | 'earth';

const KEY = 'aetherhealth-audience';

function load(): Audience {
  try {
    return localStorage.getItem(KEY) === 'earth' ? 'earth' : 'mission';
  } catch {
    return 'mission';
  }
}

export const useAudience = create<{ audience: Audience; setAudience: (a: Audience) => void }>((set) => ({
  audience: load(),
  setAudience: (audience) => {
    try {
      localStorage.setItem(KEY, audience);
    } catch {
      /* storage unavailable; applies for this visit only */
    }
    set({ audience });
  },
}));

const TERMS = {
  packetTitle: { mission: 'Ground Packet', earth: 'Clinic Packet' },
  packetBody: {
    mission: 'Summary of every indicator, alert and countermeasure, ready for the next flight-surgeon downlink.',
    earth: 'Summary of every reading, alert and recommended action, ready to send at the next telehealth visit.',
  },
  packetExport: { mission: 'Export to ground', earth: 'Send to clinic' },
  exportPacket: { mission: 'Export ground packet', earth: 'Export clinic packet' },
  tier2: { mission: 'CMO', earth: 'Health worker' },
  tier2When: { mission: 'When a reading stays out of range or worsens.', earth: 'Ask the local nurse or community health worker if a reading stays out of range.' },
  tier3: { mission: 'Ground', earth: 'Remote clinician' },
  tier3When: { mission: 'Critical. Export a packet at the next comm window.', earth: 'Critical. Send a packet to the remote clinician or call for transport.' },
  delayTitle: { mission: 'Earth delay', earth: 'Care access' },
  habitat: { mission: 'Habitat', earth: 'Environment' },
} as const;

export type TermKey = keyof typeof TERMS;

export function useTerm() {
  const audience = useAudience((s) => s.audience);
  return (key: TermKey) => TERMS[key][audience];
}
