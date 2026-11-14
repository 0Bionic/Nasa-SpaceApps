import { useId, useState } from 'react';
import { INDICATORS } from '@/domain/indicators';
import type { TriageResult } from '@/domain/types';
import { SeverityGlyph } from './SeverityBadge';
import { SEVERITY_COLOR, SEVERITY_LABEL, formatValue } from './vitals';
import { IconChevron } from './Icons';

const TIER_NAME: Record<number, string> = {
  1: 'Do it yourself',
  2: 'With the crew medical officer',
  3: 'Escalate to ground',
};

/** One out-of-band reading. Collapsed it is a single line; expanded it shows why and what to do. */
export function AlertCard({
  result,
  defaultOpen = false,
}: {
  result: TriageResult;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  if (result.severity === 'green') return null;

  const def = INDICATORS[result.indicatorId];
  const color = SEVERITY_COLOR[result.severity];

  return (
    <article
      className="relative overflow-hidden rounded-lg border border-rule bg-hull transition-colors"
      style={open ? { borderColor: `${color}66` } : undefined}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} aria-hidden="true" />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 py-3 pl-4 pr-3 text-left"
      >
        <SeverityGlyph severity={result.severity} size={10} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-star">{def.label}</span>
          <span className="block text-xs text-dust">
            {SEVERITY_LABEL[result.severity]}, {result.actions.length} step
            {result.actions.length === 1 ? '' : 's'} to take
          </span>
        </span>
        <span className="readout text-right text-lg leading-none" style={{ color }}>
          {formatValue(result.indicatorId, result.value)}
          <span className="ml-1 text-xs font-normal text-dust">{def.unit}</span>
        </span>
        <IconChevron
          width={16}
          height={16}
          className={`shrink-0 text-faint transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      <div
        id={panelId}
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-3 pb-4 pl-4 pr-4">
            <p className="text-sm leading-relaxed text-dust">{result.why}</p>
            <ol className="space-y-2">
              {[...result.actions].sort((a, b) => a.tier - b.tier).map((action) => (
                <li key={action.id} className="flex gap-3 rounded-md bg-void/60 px-3 py-2.5">
                  <span
                    className="readout mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs text-star"
                    style={{ borderColor: action.tier === 3 ? '#FF5C6188' : '#33496A' }}
                    title={TIER_NAME[action.tier]}
                  >
                    {action.tier}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-star">{action.title}</span>
                    <span className="block text-xs text-faint">{TIER_NAME[action.tier]}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-dust">{action.description}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </article>
  );
}
