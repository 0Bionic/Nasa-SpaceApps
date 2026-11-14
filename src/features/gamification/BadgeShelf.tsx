import { BADGES } from '@/domain/badges';
import type { UnlockedBadge } from '@/domain/types';

export function BadgeShelf({ badges }: { badges: UnlockedBadge[] }) {
  const unlocked = new Set(badges.map((b) => b.badgeId));
  const count = BADGES.filter((b) => unlocked.has(b.id)).length;

  return (
    <section aria-labelledby="badges-title">
      <div className="flex items-baseline justify-between">
        <h2 id="badges-title" className="h-section">
          Badges
        </h2>
        <p className="text-sm text-dust">
          {count}/{BADGES.length}
        </p>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {BADGES.map((badge) => {
          const on = unlocked.has(badge.id);
          return (
            <li
              key={badge.id}
              className={`flex items-start gap-3 border px-3 py-2.5 ${
                on ? 'border-rule bg-deck' : 'border-rule/60 bg-void text-faint'
              }`}
            >
              <span className="text-lg leading-none" aria-hidden="true">
                {badge.icon}
              </span>
              <span>
                <span className={`block text-sm font-medium ${on ? 'text-star' : 'text-dust'}`}>
                  {badge.name}
                </span>
                <span className="mt-0.5 block text-xs text-faint">{badge.description}</span>
                <span className="sr-only">{on ? 'Earned' : 'Locked'}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
