import { useId, useState } from 'react';
import { INDICATORS } from '@/domain/indicators';
import type { TriageResult } from '@/domain/types';
import { SeverityGlyph } from './SeverityBadge';
import { SEVERITY_COLOR, SEVERITY_LABEL, formatValue } from './vitals';
import { IconChevron } from './Icons';

const TIER_NAME: Record<number, string> = {
  1: 'Self',
  2: 'CMO',
  3: 'Ground',
};

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
      className="relative overflow-hidden rounded border border-rule bg-hull"
      style={open ? { borderColor: `${color}66` } : undefined}
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} aria-hidden="true" />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-3 py-2.5 pl-4 pr-3 text-left"
      >
        <SeverityGlyph severity={result.severity} size={10} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-star">{def.label}</span>
          <span className="block text-xs text-dust">
            {SEVERITY_LABEL[result.severity]} · {result.actions.length} action
            {result.actions.length === 1 ? '' : 's'}
          </span>
        </span>
        <span className="readout text-right text-base leading-none" style={{ color }}>
          {formatValue(result.indicatorId, result.value)}
          <span className="ml-1 text-xs font-normal text-dust">{def.unit}</span>
        </span>
        <IconChevron
          width={16}
          height={16}
          className={`shrink-0 text-faint ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div id={panelId} className="space-y-3 border-t border-rule px-4 py-3">
          <p className="text-sm text-dust">{result.why}</p>
          <ol className="space-y-2">
            {[...result.actions]
              .sort((a, b) => a.tier - b.tier)
              .map((action) => (
                <li key={action.id} className="flex gap-3 border border-rule bg-void px-3 py-2">
                  <span
                    className="readout mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs text-star"
                    style={{ borderColor: action.tier === 3 ? '#FC3D2188' : '#2A5AA0' }}
                    title={TIER_NAME[action.tier]}
                  >
                    {action.tier}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-star">{action.title}</span>
                    <span className="block text-xs text-faint">{TIER_NAME[action.tier]}</span>
                    <span className="mt-1 block text-sm text-dust">{action.description}</span>
                  </span>
                </li>
              ))}
          </ol>
        </div>
      )}
    </article>
  );
}
