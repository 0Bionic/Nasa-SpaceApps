import type { HealthIndicatorId, Severity } from '@/domain/types';
import { SEVERITY_COLOR, scalePosition, scaleSegments } from './vitals';

/** Threshold bands with a marker at the current value. */
export function BandScale({
  id,
  value,
  severity,
  height = 6,
  showTicks = false,
}: {
  id: HealthIndicatorId;
  value: number | null;
  severity: Severity;
  height?: number;
  showTicks?: boolean;
}) {
  const segments = scaleSegments(id);
  const pos = value == null ? null : scalePosition(id, value);

  return (
    <div className="relative" style={{ paddingTop: 4, paddingBottom: showTicks ? 0 : 4 }}>
      <div className="relative flex overflow-hidden rounded-sm" style={{ height }}>
        {segments.map((s, i) => (
          <span
            key={i}
            className="absolute inset-y-0"
            style={{
              left: `${s.from * 100}%`,
              width: `${(s.to - s.from) * 100}%`,
              background: SEVERITY_COLOR[s.severity],
              opacity: s.severity === 'green' ? 0.42 : 0.2,
            }}
          />
        ))}
      </div>
      {pos != null && (
        <span
          className="absolute top-0 -ml-[4px]"
          style={{ left: `${pos * 100}%` }}
          aria-hidden="true"
        >
          <span
            className="block h-0 w-0 border-x-[4px] border-t-[4px] border-x-transparent"
            style={{ borderTopColor: SEVERITY_COLOR[severity] }}
          />
          <span
            className="mx-auto block w-[2px]"
            style={{ height: height + 2, background: SEVERITY_COLOR[severity] }}
          />
        </span>
      )}
      {showTicks && (
        <div className="mt-1 flex justify-between text-2xs text-faint" aria-hidden="true">
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <span key={t} className="h-1.5 w-px bg-rule-strong" />
          ))}
        </div>
      )}
    </div>
  );
}

export type { Severity };
