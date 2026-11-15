import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { MedicalDisclaimer } from '@/components/Disclaimer';
import { EARTH_DELAY, ENVIRONMENT_LABEL, alpha, formatValue } from '@/components/vitals';
import { ThemeToggle } from './theme';
import { useAudience, useTerm } from './audience';
import { INDICATORS } from '@/domain/indicators';
import {
  IconCheckIn,
  IconCrew,
  IconGlobe,
  IconGuidance,
  IconRoutines,
  IconSensor,
  IconSignal,
  IconStatus,
  IconTrends,
} from '@/components/Icons';
import { useLiveMonitor } from '@/features/monitor/useLiveMonitor';
import { ANALYTICS_METRICS, NIcon, SEVERITY_RANK, SEV_TONE, summarize } from '@/features/trends/neon';

const links = [
  { to: '/', label: 'Analytics', Icon: IconTrends },
  { to: '/status', label: 'Status', Icon: IconStatus },
  { to: '/checkin', label: 'Check-in', Icon: IconCheckIn },
  { to: '/monitor', label: 'Monitor', Icon: IconSensor },
  { to: '/guidance', label: 'Guidance', Icon: IconGuidance },
  { to: '/routines', label: 'Routines', Icon: IconRoutines },
  { to: '/profile', label: 'Crew', Icon: IconCrew },
  { to: '/beyond', label: 'On Earth', Icon: IconGlobe },
];

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="n-glow-hot inline-flex shrink-0 items-center justify-center rounded-[9px] bg-n-blue font-display font-bold text-white"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      aria-hidden="true"
    >
      AH
    </span>
  );
}

export function Layout() {
  const profile = useAppStore((s) => s.profile);
  const history = useAppStore((s) => s.history);
  const delay = profile ? EARTH_DELAY[profile.environment] : null;
  const term = useTerm();
  const audience = useAudience((s) => s.audience);
  const recording = useLiveMonitor((s) => s.status === 'running');
  const recDot = (to: string) =>
    to === '/monitor' && recording ? (
      <span className="h-2 w-2 animate-blink rounded-full bg-n-red" aria-label="Recording" />
    ) : null;

  const watch = ANALYTICS_METRICS.map((m) => ({ ...m, s: summarize(history, m.id) }))
    .filter((m) => m.s && m.s.severity !== 'green')
    .sort((a, b) => SEVERITY_RANK[b.s!.severity] - SEVERITY_RANK[a.s!.severity])
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-n-ink text-n-text lg:grid lg:grid-cols-[240px_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-n-blue px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen font-ui flex-col gap-6 overflow-y-auto border-r border-n-line bg-n-ink px-[18px] py-[22px] lg:flex">
        <div className="flex items-center gap-2.5">
          <BrandMark size={34} />
          <div className="leading-tight">
            <p className="font-display text-[15px] font-medium">AetherHealth</p>
            <p className="text-[11px] text-n-muted">Crew health monitor</p>
          </div>
        </div>

        <nav aria-label="Primary" className="flex flex-col gap-1">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'n-glow border-n-neon/70 bg-n-neon/[0.07] font-medium text-n-neon'
                    : 'border-transparent text-n-muted hover:border-n-line hover:text-n-text'
                }`
              }
            >
              <Icon width={18} height={18} />
              {label}
              {recDot(to) && <span className="ml-auto">{recDot(to)}</span>}
            </NavLink>
          ))}
        </nav>

        {watch.length > 0 && (
          <div className="space-y-2.5">
            <p className="flex items-center gap-2 text-[13px] font-medium">
              <NIcon name="bolt" className="text-n-neon" />
              Watch list
              <span className="n-pill">{watch.length}</span>
            </p>
            {watch.map((m) => {
              const tone = SEV_TONE[m.s!.severity];
              return (
                <Link
                  key={m.id}
                  to={`/?metric=${m.id}`}
                  className="flex items-center gap-2.5 rounded-[10px] border border-n-line bg-n-panel px-2.5 py-2 hover:border-n-neon/50"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border font-mono text-[10px] font-medium ${tone.text}`}
                    style={{ borderColor: alpha(tone.hex, 70), background: alpha(tone.hex, 16) }}
                  >
                    {m.glyph}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-xs">{INDICATORS[m.id].label}</span>
                    <span className="block font-mono text-[11px] text-n-muted">
                      {formatValue(m.id, m.s!.latest)} {INDICATORS[m.id].unit}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-auto space-y-3">
        <ThemeToggle />
        {profile && delay && (
          <div className="n-glow space-y-1 rounded-xl border border-n-neon/55 bg-n-panel p-3.5">
            <p className="flex items-center gap-2 text-xs text-n-muted">
              <IconSignal width={16} height={16} className="text-n-neon" />
              {term('delayTitle')}
            </p>
            <p className="font-display text-[22px] font-medium">{audience === 'earth' ? 'Offline-first' : delay.value}</p>
            <p className="text-[11px] text-n-muted">{audience === 'earth' ? 'Works with no network · syncs later' : `${delay.note} · offline capable`}</p>
          </div>
        )}
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex font-ui items-center justify-between border-b border-n-line bg-n-ink px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <BrandMark size={26} />
          <span className="font-display text-sm font-medium">AetherHealth</span>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <p className="text-right text-xs text-n-muted">
              Day {profile.missionDay}
              <span className="text-n-faint"> / </span>
              {ENVIRONMENT_LABEL[profile.environment]}
            </p>
          )}
          <ThemeToggle compact />
        </div>
      </header>

      <main id="main" className="min-w-0 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
        <div className="mx-auto max-w-[1200px] space-y-5">
          <Outlet />
          <footer className="border-t border-n-line pt-3">
            <MedicalDisclaimer compact />
          </footer>
        </div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 grid font-ui grid-cols-8 border-t border-n-line bg-n-ink pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-[0.625rem] font-medium ${
                isActive ? 'text-n-neon' : 'text-n-faint'
              }`
            }
          >
            <span className="relative">
              <Icon width={20} height={20} />
              {recDot(to) && <span className="absolute -right-1 -top-0.5">{recDot(to)}</span>}
            </span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
