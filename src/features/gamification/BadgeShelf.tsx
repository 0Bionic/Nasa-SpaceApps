import { BADGES } from '@/domain/badges';
import type { UnlockedBadge } from '@/domain/types';

/** Badges as embroidered-style mission patches: earned ones are stitched, locked ones are outlines. */
export function BadgeShelf({ badges }: { badges: UnlockedBadge[] }) {
  const unlocked = new Set(badges.map((b) => b.badgeId));
  const count = BADGES.filter((b) => unlocked.has(b.id)).length;

  return (
    <section aria-labelledby="badges-title">
      <div className="flex items-baseline justify-between">
        <h2 id="badges-title" className="h-section">
          Patches
        </h2>
        <p className="text-sm text-dust">
          {count} of {BADGES.length} earned
        </p>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6">
        {BADGES.map((badge) => {
          const on = unlocked.has(badge.id);
          return (
            <li key={badge.id} className="flex flex-col items-center text-center">
              <span
                className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full text-[1.625rem] ${
                  on ? 'bg-deck text-limb' : 'text-faint'
                }`}
                style={{
                  boxShadow: on
                    ? 'inset 0 0 0 2px #7FB2FF, inset 0 0 0 5px #16253B, inset 0 0 0 6px #33496A'
                    : 'inset 0 0 0 1px #33496A',
                }}
                aria-hidden="true"
              >
                {on && (
                  <span className="absolute inset-[9px] rounded-full border border-dashed border-limb/35" />
                )}
                {badge.icon}
              </span>
              <p className={`mt-2.5 text-sm font-semibold ${on ? 'text-star' : 'text-dust'}`}>{badge.name}</p>
              <p className="mt-0.5 max-w-[22ch] text-xs leading-snug text-faint">{badge.description}</p>
              <span className="sr-only">{on ? 'Earned' : 'Not earned yet'}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
