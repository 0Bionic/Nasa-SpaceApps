import { BADGES } from '@/domain/badges';
import type { UnlockedBadge } from '@/domain/types';

export function BadgeShelf({ badges }: { badges: UnlockedBadge[] }) {
  const unlocked = new Set(badges.map((b) => b.badgeId));

  return (
    <section>
      <h2 className="font-display mb-3 text-lg text-white">Badges</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((badge) => {
          const on = unlocked.has(badge.id);
          return (
            <article
              key={badge.id}
              className={`panel p-4 ${on ? 'border-teal-glow/30' : 'opacity-45'}`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-space-800 text-xl text-teal-glow">
                  {badge.icon}
                </span>
                <div>
                  <p className="font-semibold text-slate-100">{badge.name}</p>
                  <p className="text-xs text-slate-400">{badge.description}</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">
                {on ? 'Unlocked' : 'Locked'}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
