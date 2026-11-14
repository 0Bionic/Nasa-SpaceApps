import type { Severity } from '@/domain/types';

const STYLES: Record<Severity, string> = {
  green: 'bg-status-green/20 text-status-green border-status-green/40',
  yellow: 'bg-status-yellow/20 text-status-yellow border-status-yellow/40',
  amber: 'bg-status-amber/20 text-status-amber border-status-amber/40',
  red: 'bg-status-red/20 text-status-red border-status-red/40',
};

const LABELS: Record<Severity, string> = {
  green: 'Optimal',
  yellow: 'Caution',
  amber: 'Warning',
  red: 'Critical',
};

export function SeverityBadge({
  severity,
  size = 'md',
}: {
  severity: Severity;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${STYLES[severity]} ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      } ${severity === 'red' ? 'animate-pulse-critical' : ''}`}
    >
      {LABELS[severity]}
    </span>
  );
}

export function severityColor(severity: Severity): string {
  const map: Record<Severity, string> = {
    green: '#22c55e',
    yellow: '#eab308',
    amber: '#f59e0b',
    red: '#ef4444',
  };
  return map[severity];
}
