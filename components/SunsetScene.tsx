/** Decoratieve zonsondergang: gestreepte zon, skyline, palmbomen en neon-raster. */

// vaste "willekeurige" skyline zodat server en client hetzelfde renderen
const buildings = [
  [0, 70, 110], [62, 46, 160], [104, 80, 90], [180, 38, 210], [214, 64, 130], [274, 90, 70], [360, 50, 180],
  [406, 72, 120], [474, 40, 240], [510, 86, 100], [592, 56, 150], [880, 60, 140], [936, 44, 220], [976, 90, 95],
  [1062, 52, 175], [1110, 76, 115], [1182, 40, 250], [1218, 70, 130], [1284, 54, 190], [1334, 106, 85],
];

function Palm({ x, y, scale = 1, flip = false }: { x: number; y: number; scale?: number; flip?: boolean }) {
  const leaves = [-28, 4, 34, 150, 182, 212, 92];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`} className="palm">
      <path d="M0 0 C 6 -90, 22 -190, 64 -300" fill="none" strokeWidth="13" strokeLinecap="round" />
      {[40, 90, 140, 190, 240].map((yy, i) => (
        <path key={i} d={`M${yy / 9 - 7} ${-yy} l14 -4`} strokeWidth="3" fill="none" className="palm-ring" />
      ))}
      <g transform="translate(64 -300)">
        {leaves.map((r) => (
          <path key={r} transform={`rotate(${r})`} d="M0 0 C 40 -34, 100 -30, 150 18 C 104 -6, 50 -8, 0 0 Z" />
        ))}
        <circle r="9" />
      </g>
    </g>
  );
}

export default function SunsetScene() {
  return (
    <svg className="scene" viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset=".45" stopColor="#fb923c" />
          <stop offset="1" stopColor="#c2410c" />
        </linearGradient>
        <mask id="sunStripes">
          <rect x="0" y="0" width="1440" height="640" fill="#fff" />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x="0" y={318 + i * 22} width="1440" height={3 + i * 1.6} fill="#000" />
          ))}
        </mask>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#0b1220" />
        </linearGradient>
        <linearGradient id="city" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2a44" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      <circle cx="720" cy="380" r="210" fill="url(#sun)" mask="url(#sunStripes)" className="sun" />

      <g fill="url(#city)">
        {buildings.map(([x, w, h], i) => (
          <rect key={i} x={x} y={520 - h} width={w} height={h + 2} />
        ))}
      </g>
      <g className="windows">
        {buildings.map(([x, w, h], i) =>
          Array.from({ length: Math.floor(h / 34) }, (_, j) => (
            <rect key={`${i}-${j}`} x={x + 8 + ((i + j) % 3) * (w / 4)} y={520 - h + 14 + j * 30} width="6" height="9" />
          )),
        )}
      </g>

      <rect x="0" y="518" width="1440" height="122" fill="url(#water)" />
      <g className="reflect">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={720 - (170 - i * 26)} y={532 + i * 15} width={(170 - i * 26) * 2} height="4" rx="2" />
        ))}
      </g>

      <Palm x={110} y={640} scale={1.25} />
      <Palm x={250} y={640} scale={0.85} flip />
      <Palm x={1330} y={640} scale={1.3} flip />
      <Palm x={1200} y={640} scale={0.8} />
    </svg>
  );
}
