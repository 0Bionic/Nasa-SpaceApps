import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { SeverityGlyph } from '@/components/SeverityBadge';
import { EARTH_DELAY, ENVIRONMENT_LABEL, SEVERITY_LABEL } from '@/components/vitals';
import {
  IconCheckIn,
  IconCrew,
  IconGuidance,
  IconRoutines,
  IconSignal,
  IconStatus,
  IconTrends,
} from '@/components/Icons';

const links = [
  { to: '/', label: 'Status', Icon: IconStatus },
  { to: '/checkin', label: 'Check-in', Icon: IconCheckIn },
  { to: '/trends', label: 'Trends', Icon: IconTrends },
  { to: '/guidance', label: 'Guidance', Icon: IconGuidance },
  { to: '/routines', label: 'Routines', Icon: IconRoutines },
  { to: '/profile', label: 'Crew', Icon: IconCrew },
];

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="11" fill="none" stroke="#33496A" strokeWidth="1.5" />
      <path d="M5.4 19.5A11 11 0 0 0 26.6 19.5" fill="none" stroke="#7FB2FF" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 15h3.2l1.6-3.4 2.6 7 1.8-4.4 1 0.8H23" fill="none" stroke="#E6ECF5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Layout() {
  const profile = useAppStore((s) => s.profile);
  const latest = useAppStore((s) => s.latest);
  const delay = profile ? EARTH_DELAY[profile.environment] : null;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-limb px-3 py-2 text-void focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-rule bg-[#0C1729] lg:flex">
        <div className="flex items-center gap-2.5 px-5 pb-6 pt-6">
          <BrandMark />
          <span className="w-wide text-[1.0625rem] font-semibold tracking-[-0.01em]">AetherHealth</span>
        </div>

        {profile && (
          <div className="mx-3 mb-5 rounded-lg border border-rule px-3 py-3">
            <p className="truncate text-sm font-semibold text-star">{profile.name}</p>
            <p className="mt-0.5 truncate text-xs text-dust">{profile.role}</p>
            {latest && (
              <p className="mt-2.5 flex items-center gap-1.5 text-xs text-dust">
                <SeverityGlyph severity={latest.overallSeverity} />
                <span>Overall {SEVERITY_LABEL[latest.overallSeverity].toLowerCase()}</span>
              </p>
            )}
          </div>
        )}

        <nav aria-label="Primary" className="flex flex-col gap-0.5 px-3">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-deck text-star' : 'text-dust hover:bg-hull hover:text-star'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-limb transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  <Icon className={isActive ? 'text-limb' : 'text-faint group-hover:text-dust'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {profile && delay && (
          <div className="mt-auto border-t border-rule px-5 py-5">
            <div className="flex items-center gap-2 text-xs text-dust">
              <IconSignal width={16} height={16} className="text-limb" />
              Signal delay to Earth
            </div>
            <p className="readout mt-1.5 text-xl text-star">{delay.value}</p>
            <p className="text-xs text-faint">
              {delay.note}, one way. Works fully offline.
            </p>
          </div>
        )}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-rule bg-void/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <BrandMark size={24} />
          <span className="w-wide text-[0.9375rem] font-semibold">AetherHealth</span>
        </div>
        {profile && (
          <p className="text-right text-xs text-dust">
            Day {profile.missionDay}
            <span className="text-faint"> / </span>
            {ENVIRONMENT_LABEL[profile.environment]}
          </p>
        )}
      </header>

      <main id="main" className="min-w-0 px-4 pb-28 pt-6 sm:px-8 lg:px-10 lg:pb-14 lg:pt-9">
        <div className="mx-auto max-w-[1180px]">
          <Outlet />
        </div>
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-rule bg-[#0C1729]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2.5 text-[0.625rem] font-medium transition-colors ${
                isActive ? 'text-limb' : 'text-faint'
              }`
            }
          >
            <Icon width={20} height={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
