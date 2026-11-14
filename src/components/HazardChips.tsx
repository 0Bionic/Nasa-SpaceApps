import { HAZARDS } from '@/domain/hazards';
import type { HazardId } from '@/domain/types';

export function HazardChips({ hazards }: { hazards: HazardId[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {hazards.map((id) => (
        <span
          key={id}
          title={HAZARDS[id].description}
          className="rounded-md border border-teal-glow/30 bg-teal-glow/10 px-2 py-0.5 text-[11px] font-medium text-teal-soft"
        >
          {HAZARDS[id].shortName}
        </span>
      ))}
    </div>
  );
}
