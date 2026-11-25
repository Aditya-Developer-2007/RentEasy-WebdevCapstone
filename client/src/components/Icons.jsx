const svgDefaults = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function SearchIcon({ size = 18, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function HeartIcon({ size = 18, filled = false, className = '' }) {
  return (
    <svg
      {...svgDefaults}
      width={size}
      height={size}
      fill={filled ? 'currentColor' : 'none'}
      className={className}
    >
      <path d="M12 20.5s-7-4.5-9.2-8.5C1.1 8.8 2.9 5 6.6 5c2.1 0 3.7 1.1 5.4 3 1.7-1.9 3.3-3 5.4-3 3.7 0 5.5 3.8 3.8 7-2.2 4-9.2 8.5-9.2 8.5Z" />
    </svg>
  );
}

export function BedIcon({ size = 16, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <path d="M3 7v11M3 14h18v4M21 14v-3a2 2 0 0 0-2-2H9v5" />
      <circle cx="6.5" cy="10.5" r="1.5" />
    </svg>
  );
}

export function BathIcon({ size = 16, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z" />
      <path d="M6 12V6a2 2 0 0 1 2-2h1" />
      <path d="M7 19v2M17 19v2" />
    </svg>
  );
}

export function AreaIcon({ size = 16, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M4 10h6v10M10 4v6h10" />
    </svg>
  );
}

export function MapPinIcon({ size = 15, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <path d="M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function FilterIcon({ size = 16, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function MenuIcon({ size = 20, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ size = 20, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 16, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function CalendarIcon({ size = 16, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

export function CheckIcon({ size = 16, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <path d="M5 12.5 9.5 17 19 7" />
    </svg>
  );
}

export function AlertCircleIcon({ size = 16, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

export function BuildingIcon({ size = 18, className = '' }) {
  return (
    <svg {...svgDefaults} width={size} height={size} className={className}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 11h4v10M2 21h20" />
      <path d="M8 7h4M8 11h4M8 15h4" />
    </svg>
  );
}
