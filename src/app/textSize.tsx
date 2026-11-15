import { create } from 'zustand';
import type { CheckInRecord } from '@/domain/types';

/**
 * Text size for the whole app. "Large" scales every rem-based size by 137.5%,
 * moving key text toward NASA's preferred 0.4° character height
 * (NASA-STD-3001 Vol. 2, Appendix F), for a crew member who is unwell.
 */
export type TextSize = 'standard' | 'large';

const STORAGE_KEY = 'aetherhealth-text-size';

function initial(): TextSize {
  // index.html sets data-text before first paint; read it back so React agrees.
  return document.documentElement.dataset.text === 'large' ? 'large' : 'standard';
}

function apply(large: boolean) {
  if (large) document.documentElement.dataset.text = 'large';
  else delete document.documentElement.dataset.text;
}

interface TextSizeState {
  /** The crew member's saved choice. */
  size: TextSize;
  /** Large for this screen only (the guided protocol), without changing the saved choice. */
  temporary: boolean;
  /** Check-in id whose "switch to large text" offer was dismissed. */
  dismissedFor: string | null;
  setSize: (s: TextSize) => void;
  setTemporary: (on: boolean) => void;
  dismissOffer: (checkInId: string) => void;
}

export const useTextSize = create<TextSizeState>((set, get) => ({
  size: initial(),
  temporary: false,
  dismissedFor: null,
  setSize: (size) => {
    try {
      localStorage.setItem(STORAGE_KEY, size);
    } catch {
      /* storage unavailable; still applies for this visit */
    }
    apply(size === 'large' || get().temporary);
    set({ size });
  },
  setTemporary: (temporary) => {
    apply(get().size === 'large' || temporary);
    set({ temporary });
  },
  dismissOffer: (checkInId) => set({ dismissedFor: checkInId }),
}));

export function useLargeText() {
  return useTextSize((s) => s.size === 'large' || s.temporary);
}

/** A check-in that suggests the crew member is unwell: a warning or worse, or notable dizziness or fatigue. */
export function looksUnwell(c: CheckInRecord | null): boolean {
  if (!c) return false;
  return c.overallSeverity === 'amber' || c.overallSeverity === 'red' || c.dizziness >= 5 || c.fatigue >= 8;
}

/** Standard / Large switch. */
export function TextSizeToggle({ compact = false }: { compact?: boolean }) {
  const large = useLargeText();
  const setSize = useTextSize((s) => s.setSize);
  const setTemporary = useTextSize((s) => s.setTemporary);
  const toggle = () => {
    if (large) {
      setTemporary(false);
      setSize('standard');
    } else setSize('large');
  };
  const label = large ? 'Switch to standard text' : 'Switch to large text';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={large}
      aria-label={label}
      title={label}
      className={`flex items-center gap-2 rounded-[10px] border transition-colors hover:border-n-neon/50 hover:text-n-text ${
        large ? 'border-n-neon/60 bg-n-neon/10 text-n-neon' : 'border-n-line text-n-muted'
      } ${compact ? 'h-11 min-w-[2.75rem] justify-center px-2' : 'min-h-[3rem] w-full px-3 py-2 text-sm'}`}
    >
      <span aria-hidden="true" className="font-display font-semibold leading-none">
        <span className="text-xs">A</span>
        <span className="text-lg">A</span>
      </span>
      {!compact && <span>{large ? 'Large text: on' : 'Large text'}</span>}
    </button>
  );
}
