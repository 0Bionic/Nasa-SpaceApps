import { create } from 'zustand';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'aetherhealth-theme';

function initialTheme(): Theme {
  // index.html sets data-theme before first paint; read it back so React agrees.
  const attr = document.documentElement.dataset.theme;
  return attr === 'dark' ? 'dark' : 'light'; // light is the default
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#FFFFFF' : '#000000');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage unavailable (private mode); theme still applies for this visit */
  }
}

export const useTheme = create<{ theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }>((set, get) => ({
  theme: initialTheme(),
  setTheme: (theme) => {
    apply(theme);
    set({ theme });
  },
  toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));

/** Sun/moon switch for light and dark mode. */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`flex items-center gap-2 rounded-[10px] border border-n-line text-n-muted transition-colors hover:border-n-neon/50 hover:text-n-text ${
        compact ? 'h-8 w-8 justify-center' : 'w-full px-3 py-2 text-[13px]'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === 'dark' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        )}
      </svg>
      {!compact && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
