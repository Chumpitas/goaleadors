import { useId } from 'react';
import { fontFamily, validateKit } from '../game/cosmetics.js';

// Silueta dresa u viewBox-u "0 0 100 120".
const JERSEY_PATH =
  'M35,16 Q50,24 65,16 L78,22 L92,42 L78,52 L70,45 L70,108 L30,108 L30,45 L22,52 L8,42 L22,22 Z';

/** Renderuj dres iz konfiguracije (§9.3). */
export default function JerseySVG({ kit, size = 150 }) {
  const cfg = validateKit(kit);
  const clipId = useId();

  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" role="img" aria-label="Dres kluba">
      <defs>
        <clipPath id={clipId}>
          <path d={JERSEY_PATH} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="120" fill={cfg.primary} />
        <Pattern design={cfg.design} secondary={cfg.secondary} />
      </g>

      {/* sponzor + broj */}
      {cfg.sponsor && (
        <text
          x="50"
          y="70"
          textAnchor="middle"
          fontSize="8"
          fontFamily={fontFamily(cfg.font)}
          fill="#fff"
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.3"
        >
          {cfg.sponsor}
        </text>
      )}
      <text x="50" y="98" textAnchor="middle" fontSize="20" fontWeight="800" fontFamily={fontFamily(cfg.font)} fill="#fff" opacity="0.85">
        10
      </text>

      <path d={JERSEY_PATH} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" />
    </svg>
  );
}

function Pattern({ design, secondary }) {
  switch (design) {
    case 'stripes': // vertikalne pruge
      return range(0, 100, 16).map((x) => <rect key={x} x={x} y="0" width="8" height="120" fill={secondary} />);
    case 'hoops': // horizontalne pruge
      return range(0, 120, 18).map((y) => <rect key={y} x="0" y={y} width="100" height="9" fill={secondary} />);
    case 'halves':
      return <rect x="50" y="0" width="50" height="120" fill={secondary} />;
    case 'diagonal':
      return <polygon points="0,0 100,0 0,120" fill={secondary} />;
    case 'sash':
      return <polygon points="0,30 70,120 100,120 0,55" fill={secondary} />;
    case 'checkers':
      return range(0, 100, 16).flatMap((x) =>
        range(0, 120, 16).map((y) =>
          (x / 16 + y / 16) % 2 === 0 ? <rect key={`${x}-${y}`} x={x} y={y} width="16" height="16" fill={secondary} /> : null
        )
      );
    case 'sleeves':
      return (
        <>
          <path d="M35,16 L22,22 L8,42 L22,52 L30,45 L30,30 Z" fill={secondary} />
          <path d="M65,16 L78,22 L92,42 L78,52 L70,45 L70,30 Z" fill={secondary} />
        </>
      );
    case 'pinstripe':
      return range(0, 100, 8).map((x) => <rect key={x} x={x} y="0" width="2" height="120" fill={secondary} />);
    case 'collar':
      return <path d="M35,16 Q50,24 65,16 L62,24 Q50,30 38,24 Z" fill={secondary} />;
    case 'solid':
    default:
      return null;
  }
}

function range(start, end, step) {
  const out = [];
  for (let v = start; v < end; v += step) out.push(v);
  return out;
}
