import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

function Base({ children, ...rest }: P) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconStatus = (p: P) => (
  <Base {...p}>
    <circle cx="10" cy="4.2" r="2" />
    <path d="M10 6.8v5.4M6 8.6l4 1.2 4-1.2M10 12.2l-2.6 5M10 12.2l2.6 5" />
  </Base>
);
export const IconCheckIn = (p: P) => (
  <Base {...p}>
    <path d="M2 10.5h3.2l1.8-4.5 3 9 2.2-6 1.3 1.5H18" />
  </Base>
);
export const IconTrends = (p: P) => (
  <Base {...p}>
    <path d="M3 3v14h14" />
    <path d="M6 13l3.2-3.6 2.6 2.2L16.5 6" />
  </Base>
);
export const IconGuidance = (p: P) => (
  <Base {...p}>
    <path d="M4 3.5h8.5L16 7v9.5H4z" />
    <path d="M7 9h6M7 12h6M7 6h3" />
  </Base>
);
export const IconRoutines = (p: P) => (
  <Base {...p}>
    <circle cx="10" cy="10" r="7" />
    <path d="M10 5.8V10l2.8 1.8" />
  </Base>
);
export const IconCrew = (p: P) => (
  <Base {...p}>
    <circle cx="10" cy="7" r="3.2" />
    <path d="M3.8 17c.8-3.2 3.3-5 6.2-5s5.4 1.8 6.2 5" />
  </Base>
);
export const IconExport = (p: P) => (
  <Base {...p}>
    <path d="M10 12.5V3M6.5 6.2 10 2.8l3.5 3.4M4 11v5.5h12V11" />
  </Base>
);
export const IconClose = (p: P) => (
  <Base {...p}>
    <path d="M5 5l10 10M15 5L5 15" />
  </Base>
);
export const IconChevron = (p: P) => (
  <Base {...p}>
    <path d="M7.5 5l5 5-5 5" />
  </Base>
);
export const IconSignal = (p: P) => (
  <Base {...p}>
    <path d="M10 17V10" />
    <circle cx="10" cy="8.5" r="1.4" />
    <path d="M6.6 5.2a5 5 0 0 0 0 6.6M13.4 5.2a5 5 0 0 1 0 6.6M4.2 2.8a8.4 8.4 0 0 0 0 11.4M15.8 2.8a8.4 8.4 0 0 1 0 11.4" />
  </Base>
);
export const IconGlobe = (p: P) => (
  <Base {...p}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="M2.5 10h15M10 2.5c2.2 2.1 3.2 4.6 3.2 7.5S12.2 15.4 10 17.5C7.8 15.4 6.8 12.9 6.8 10S7.8 4.6 10 2.5z" />
  </Base>
);
export const IconSensor = (p: P) => (
  <Base {...p}>
    <rect x="6" y="3" width="8" height="14" rx="3" />
    <path d="M8.5 10h1l.7-1.6.9 3.2.6-1.6h.8" />
  </Base>
);
export const IconCheck = (p: P) => (
  <Base {...p}>
    <path d="M4.5 10.5l3.5 3.5 7.5-8" />
  </Base>
);
