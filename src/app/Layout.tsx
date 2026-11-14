import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { MedicalDisclaimer } from '@/components/Disclaimer';
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
      <rect x="2" y="2" width="28" height="28" rx="2" fill="#0B3D91" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="#FFFFFF"
        style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'IBM Plex Sans, sans-serif' }}
      >
        AH
      </text>
    </svg>
  );
}

export function Layout() {
  const profile = useAppStore((s) => s.profile);
  const latest = useAppStore((s) => s.latest);
  const delay = profile ? EARTH_DELAY[profile.environment] : null;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-limb px-3 py-2 text-void focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-screen flex-col border-r border-rule bg-hull lg:flex">
        <div className="flex items-center gap-2.5 border-b border-rule px-4 py-4">
          <BrandMark />
          <span className="text-sm font-semibold">AetherHealth</span>
        </div>

        {profile && (
          <div className="border-b border-rule px-4 py-3">
            <p className="truncate text-sm font-medium text-star">{profile.name}</p>
            <p className="mt-0.5 truncate text-xs text-dust">{profile.role}</p>
            {latest && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-dust">
                <SeverityGlyph severity={latest.overallSeverity} />
                <span>{SEVERITY_LABEL[latest.overallSeverity]}</span>
              </p>
            )}
          </div>
        )}

        <nav aria-label="Primary" className="flex flex-col gap-0.5 p-2">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-deck text-star' : 'text-dust hover:bg-void hover:text-star'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={isActive ? 'text-limb' : 'text-faint'} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {profile && delay && (
          <div className="mt-auto border-t border-rule px-4 py-4">
            <div className="flex items-center gap-2 text-xs text-dust">
              <IconSignal width={16} height={16} />
              Earth delay
            </div>
            <p className="readout mt-1 text-lg text-star">{delay.value}</p>
            <p className="text-xs text-faint">{delay.note} · offline capable</p>
          </div>
        )}
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-rule bg-void px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <BrandMark size={24} />
          <span className="text-sm font-semibold">AetherHealth</span>
        </div>
        {profile && (
          <p className="text-right text-xs text-dust">
            Day {profile.missionDay}
            <span className="text-faint"> / </span>
            {ENVIRONMENT_LABEL[profile.environment]}
          </p>
        )}
      </header>

      <main id="main" className="min-w-0 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
        <div className="mx-auto max-w-[1100px] space-y-5">
          <Outlet />
          <footer className="border-t border-rule pt-3">
            <MedicalDisclaimer compact />
          </footer>
        </div>
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-rule bg-hull pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-2 text-[0.625rem] font-medium ${
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
