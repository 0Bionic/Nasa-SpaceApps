import type { Severity } from '@/domain/types';
import { SEVERITY_COLOR, SEVERITY_LABEL } from './vitals';

/**
 * Status tag. Severity is carried by a distinct glyph shape as well as
 * color, so it stays readable for color-blind crew and in poor lighting.
 */
export function SeverityBadge({
  severity,
  size = 'md',
}: {
  severity: Severity;
  size?: 'sm' | 'md';
}) {
  const color = SEVERITY_COLOR[severity];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold ${
        size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-1 text-xs'
      }`}
      style={{
        color,
        borderColor: `${color}55`,
        background: `${color}14`,
      }}
    >
      <SeverityGlyph severity={severity} size={size === 'sm' ? 8 : 9} />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export function SeverityGlyph({ severity, size = 9 }: { severity: Severity; size?: number }) {
  const c = SEVERITY_COLOR[severity];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={severity === 'red' ? 'animate-blink' : undefined}
    >
      {severity === 'green' && <circle cx="5" cy="5" r="4" fill={c} />}
      {severity === 'yellow' && <rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke={c} strokeWidth="2" />}
      {severity === 'amber' && <path d="M5 0.8 9.4 9H0.6Z" fill={c} />}
      {severity === 'red' && <path d="M5 0 10 5 5 10 0 5Z" fill={c} />}
    </svg>
  );
}

export { SEVERITY_COLOR };
export function severityColor(severity: Severity): string {
  return SEVERITY_COLOR[severity];
}
