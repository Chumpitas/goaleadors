import { useId } from 'react';
import { shieldPath, fontFamily, validateCrest, initials } from '../game/cosmetics.js';

/**
 * Renderuj grb iz konfiguracije (§9.2).
 * props: crest (config), name (za inicijale/natpis), size
 */
export default function CrestSVG({ crest, name = '', size = 160 }) {
  const cfg = validateCrest(crest);
  const clipId = useId();
  const path = shieldPath(cfg.shape);

  const label = cfg.text || initials(name);

  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" role="img" aria-label="Grb kluba">
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {cfg.background === 'solid' && <rect x="0" y="0" width="100" height="120" fill={cfg.color1} />}
        {cfg.background === 'split-h' && (
          <>
            <rect x="0" y="0" width="100" height="60" fill={cfg.color1} />
            <rect x="0" y="60" width="100" height="60" fill={cfg.color2} />
          </>
        )}
        {cfg.background === 'split-v' && (
          <>
            <rect x="0" y="0" width="50" height="120" fill={cfg.color1} />
            <rect x="50" y="0" width="50" height="120" fill={cfg.color2} />
          </>
        )}
      </g>

      {label && (
        <text
          x="50"
          y="30"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fontFamily={fontFamily(cfg.font)}
          fill={cfg.symbolColor}
        >
          {label}
        </text>
      )}

      <text x="50" y="72" textAnchor="middle" fontSize="40" fill={cfg.symbolColor}>
        {cfg.symbol}
      </text>

      <path d={path} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2.5" />
    </svg>
  );
}
