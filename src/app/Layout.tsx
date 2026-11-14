import { NavLink, Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { SeverityBadge } from '@/components/SeverityBadge';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/checkin', label: 'Check-in' },
  { to: '/trends', label: 'Trends' },
  { to: '/guidance', label: 'Guidance' },
  { to: '/routines', label: 'Routines' },
  { to: '/profile', label: 'Profile' },
];

export function Layout() {
  const profile = useAppStore((s) => s.profile);
  const latest = useAppStore((s) => s.latest);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-display text-2xl tracking-[0.08em] text-teal-glow sm:text-3xl">
            AetherHealth
          </p>
          <p className="text-sm text-slate-400">
            Astronaut health monitoring · offline · mission-ready
          </p>
        </div>
        {profile && (
          <div className="panel flex flex-wrap items-center gap-4 px-4 py-2.5 text-sm">
            <div>
              <p className="font-semibold text-slate-100">{profile.name}</p>
              <p className="text-xs text-slate-400">
                Day {profile.missionDay} · {profile.environment.replace('_', ' ')}
              </p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-xs text-slate-300">
              <span className="text-teal-soft">{profile.xp} XP</span>
              <span className="mx-2 text-white/20">|</span>
              <span>{profile.streak}d streak</span>
            </div>
            {latest && <SeverityBadge severity={latest.overallSeverity} size="sm" />}
          </div>
        )}
      </header>

      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-space-900/50 p-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-teal-glow/20 text-teal-soft'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
