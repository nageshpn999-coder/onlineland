import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

/** OnlineLand mark: a surveyed plot divided into four, one share highlighted. */
export function LogoMark(props: IconProps) {
  return (
    <svg width={32} height={32} viewBox="0 0 32 32" aria-hidden {...props}>
      <path d="M4 6 L27 3 L29 27 L5 29 Z" fill="#fff" stroke="#1456C8" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M15.5 4.5 L17 28 M4.5 17.5 L28 15" stroke="#1456C8" strokeWidth="1.6" />
      <path d="M16.3 15.8 L28 15 L29 27 L17 28 Z" fill="#0F6B3F" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 19.5 5.6 16A8 8 0 1 1 8.3 18.6Z" />
      <path d="M9 9.5c.3 2.2 2.3 4.4 4.8 5l1.2-1.3 1.8.8c-.2 1-1 1.7-2 1.7-3.3 0-6.5-3.1-6.5-6.4 0-1 .7-1.8 1.7-2l.8 1.8Z" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function AreaIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7 19 4l1 13-15 3Z" />
      <path d="M4 7v3M19 4v3M20 17h-3M5 20v-3" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

/* Category icons — drawn in the same line weight as a survey sketch. */
export const CATEGORY_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  agricultural: (p) => (
    <svg {...base} {...p}>
      <path d="M3 19c3-4 6-6 9-6s6 2 9 6" />
      <path d="M3 15c3-3 6-4.5 9-4.5s6 1.5 9 4.5" />
      <path d="M12 10.5V4m0 2.5c-1.5-1.5-3-1.5-3-1.5s0 1.8 3 3m0-1.5c1.5-1.5 3-1.5 3-1.5s0 1.8-3 3" />
    </svg>
  ),
  'open-plot': (p) => (
    <svg {...base} {...p}>
      <path d="M3 6h18v12H3z" />
      <path d="M9 6v12M15 6v12M3 12h18" strokeDasharray="2 2" />
    </svg>
  ),
  flat: (p) => (
    <svg {...base} {...p}>
      <path d="M6 21V4h12v17M3 21h18" />
      <path d="M9 7h1.5M13.5 7H15M9 10.5h1.5M13.5 10.5H15M9 14h1.5M13.5 14H15M11 21v-3h2v3" />
    </svg>
  ),
  apartment: (p) => (
    <svg {...base} {...p}>
      <path d="M3 21V9l5-2v14M8 21V5l8-2v18M16 21V10l5 1.5V21M2 21h20" />
      <path d="M11 8h2M11 11h2M11 14h2" />
    </svg>
  ),
  villa: (p) => (
    <svg {...base} {...p}>
      <path d="M3 11 12 4l9 7M5 9.5V20h14V9.5M2 20h20" />
      <path d="M10 20v-5h4v5" />
    </svg>
  ),
  'luxury-home': (p) => (
    <svg {...base} {...p}>
      <path d="M3 12 9 7l6 5M5 10.5V20h8v-8.5M13 12l4-3.5 4 3.5V20h-8M2 20h20" />
      <path d="M17 4.5l.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.7-1.4.7.3-1.5-1.1-1 1.5-.2Z" />
    </svg>
  ),
  commercial: (p) => (
    <svg {...base} {...p}>
      <path d="M4 9h16v11H4zM3 9l2-5h14l2 5M2 20h20" />
      <path d="M8 20v-6h4v6M15 13h2" />
    </svg>
  ),
  farmhouse: (p) => (
    <svg {...base} {...p}>
      <path d="M3 12l6-5 6 5M5 10.5V20h8v-9.5M2 20h20" />
      <circle cx="18.5" cy="10" r="3" />
      <path d="M18.5 13v7" />
    </svg>
  ),
  rental: (p) => (
    <svg {...base} {...p}>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M18 12v3M15.5 12v2" />
    </svg>
  ),
};

/* Service icons */
export const SERVICE_ICONS = {
  consult: (p: IconProps) => (
    <svg {...base} {...p}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5.5 5.5M8 10.5h5M10.5 8v5" />
    </svg>
  ),
  docs: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 13l2 2 4-4" />
    </svg>
  ),
  visit: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10Z" />
      <path d="M9.5 10.5 11.3 12l3.2-3.2" />
    </svg>
  ),
  sell: (p: IconProps) => (
    <svg {...base} {...p}>
      <path d="M3 13 11 5h7l3 3v7l-8 8Z" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  ),
};
