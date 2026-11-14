import type { TriageResult } from '@/domain/types';
import { HazardChips } from './HazardChips';
import { SeverityBadge } from './SeverityBadge';

export function AlertCard({ result }: { result: TriageResult }) {
  if (result.severity === 'green') return null;

  return (
    <article className="panel animate-fade-up space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-sm tracking-wide text-white">{result.summary}</h3>
          <p className="mt-1 text-sm text-slate-300">{result.why}</p>
        </div>
        <SeverityBadge severity={result.severity} />
      </div>
      <HazardChips hazards={result.hazards} />
      <ul className="space-y-2">
        {result.actions.map((action) => (
          <li
            key={action.id}
            className="rounded-xl border border-white/10 bg-space-950/50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                Tier {action.tier}
              </span>
              <span className="text-sm font-semibold text-slate-100">{action.title}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{action.description}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}
