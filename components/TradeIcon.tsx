import type { Trade } from '@/lib/types';

/** Verfblik met een kwast erin. */
export function PaintCanIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Verfblik met kwast">
      <defs>
        <linearGradient id="pc-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8d86a3" />
          <stop offset=".45" stopColor="#f6f3fb" />
          <stop offset="1" stopColor="#7d7694" />
        </linearGradient>
        <linearGradient id="pc-label" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="pc-handle" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="1" stopColor="#e07a1f" />
        </linearGradient>
      </defs>

      {/* binnenkant blik */}
      <ellipse cx="32" cy="30" rx="20" ry="6" fill="#1e293b" />

      {/* kwast, schuin in het blik */}
      <g transform="rotate(24 32 31)">
        <rect x="28.5" y="0" width="7" height="17" rx="3.5" fill="url(#pc-handle)" />
        <rect x="27" y="16" width="10" height="6" rx="1.2" fill="#d9d4e6" />
        <rect x="27" y="17.5" width="10" height="1.2" fill="#9f98b5" />
        <path d="M27 22 h10 v9 q-5 3 -10 0 z" fill="#2b1838" />
      </g>

      {/* verfoppervlak (bedekt de onderkant van de kwast) */}
      <ellipse cx="32" cy="31" rx="18.5" ry="4.8" fill="#f97316" />
      <ellipse cx="27" cy="30" rx="6" ry="1.4" fill="#fdba74" opacity=".7" />

      {/* rand */}
      <ellipse cx="32" cy="30" rx="20" ry="6" fill="none" stroke="#e9e5f2" strokeWidth="2.4" />

      {/* blik */}
      <path d="M12 30 A20 6 0 0 0 52 30 L52 54 A20 6 0 0 1 12 54 Z" fill="url(#pc-body)" />
      <path d="M12 39 A20 6 0 0 0 52 39 L52 48 A20 6 0 0 1 12 48 Z" fill="url(#pc-label)" />
      <path d="M12 54 A20 6 0 0 0 52 54" fill="none" stroke="#6b6482" strokeWidth="1.5" />

      {/* druppels over de rand */}
      <path d="M17 33.5 q0 7 2.6 7 q2.4 0 2.4 -4.8 v-1.2 z" fill="#f97316" />
      <path d="M38 35.6 q0 4.5 2 4.5 q2 0 2 -3.4 v-1.6 z" fill="#f97316" />
    </svg>
  );
}

export default function TradeIcon({ trade, size = 48 }: { trade: Trade; size?: number }) {
  if (trade.svgIcon === 'paintcan') return <PaintCanIcon size={size} />;
  return <span style={{ fontSize: size * 0.85, lineHeight: 1 }}>{trade.icon}</span>;
}
