import { useGameStore } from '../store/useGameStore.js';
import { BUILDING_IMAGES } from '../game/clubMapImages.js';

/* =========================================================================
   Izometrijski grid od kockica. Mreža i građevine dijele isti koordinatni
   sistem pa se savršeno poklapaju.
   iso(c, r) → [x, y] u SVG jedinicama.
   ========================================================================= */
// Pravi izometrijski odnos 2:1 (široke pljosnate kockice). Veliki grid 30×30 —
// prikazuje se samo prozor u njegovu sredinu, pa kockice prekrivaju cijeli ekran.
const COLS = 30;
const ROWS = 30;
const WC = 32; // pola širine kockice
const HC = 16; // pola visine kockice (WC = 2·HC → klasična izometrija)

function iso(c, r) {
  return [(c - r) * WC, (c + r) * HC];
}

// Stadion zauzima veliki centralni blok 6×4 (centar grida), ostale građevine 2×2.
const STADIUM = { id: 'stadium', label: 'Stadion', tab: null, c0: 12, r0: 13, cw: 6, ch: 4 };

const BUILDINGS = [
  { id: 'train',    label: 'Trening',     tab: 'train',    c0: 10, r0: 10, unlock: 'liga_1' },
  { id: 'myteam',   label: 'Svlačionica', tab: 'myteam',   c0: 10, r0: 14 },
  { id: 'match',    label: 'Teren',       tab: 'match',    c0: 14, r0: 10 },
  { id: 'sponsors', label: 'Sponzori',    tab: 'sponsors', c0: 12, r0: 17, unlock: 'liga_5' },
  { id: 'market',   label: 'Tržnica',     tab: 'market',   c0: 18, r0: 13, unlock: 'liga_1' },
  { id: 'academy',  label: 'Akademija',   tab: 'academy',  c0: 15, r0: 19, unlock: 'liga_5' },
  { id: 'scout',    label: 'Skaut',       tab: 'scout',    c0: 19, r0: 19, unlock: 'liga_5' },
  { id: 'medical',  label: 'Medicinski',  tab: 'medical',  c0: 19, r0: 15, unlock: 'liga_1' },
];

function isUnlocked(b, level, seasons) {
  if (b.id === 'stadium') return true;
  if (!b.unlock) return true;
  if (b.unlock === 'liga_1') return level >= 1 || seasons >= 1;
  if (b.unlock === 'liga_5') return level >= 2 || seasons >= 3;
  return false;
}

// Diamond kockica (jedna ćelija mreže) kao SVG points string.
function cellPoints(c, r) {
  const p = [iso(c, r), iso(c + 1, r), iso(c + 1, r + 1), iso(c, r + 1)];
  return p.map(([x, y]) => `${x},${y}`).join(' ');
}

// Blok N×M ćelija kao diamond (za isticanje stadionskog polja).
function blockPoints(c0, r0, cw, ch) {
  const p = [iso(c0, r0), iso(c0 + cw, r0), iso(c0 + cw, r0 + ch), iso(c0, r0 + ch)];
  return p.map(([x, y]) => `${x},${y}`).join(' ');
}

export default function ClubMap({ onNavigate }) {
  const club = useGameStore((s) => s.club);
  const managerStats = useGameStore((s) => s.managerStats);
  const level = managerStats?.currentLeagueLevel ?? 1;
  const seasons = managerStats?.totalSeasons ?? 0;

  const handleTap = (b) => {
    if (!isUnlocked(b, level, seasons)) return;
    if (b.tab) onNavigate(b.tab);
  };

  // Prozor u sredinu velikog grida (centar = stadion na iso(15,15) = [0, 480]).
  // Aspekt prozora ~ portretni ekran → kockice prekrivaju cijeli ekran bez praznih ivica.
  const vb = { x: -190, y: 110, w: 380, h: 745 };

  // Ground ćelije.
  const cells = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      cells.push({ c, r, key: `${c}-${r}`, alt: (c + r) % 2 === 0 });
    }
  }

  // Renderuj jednu građevinu (sortirano po dubini izvan ove funkcije).
  const renderBuilding = (b, span) => {
    const built = isUnlocked(b, level, seasons);
    const img = BUILDING_IMAGES[b.id];
    const cw = span?.cw ?? 2;
    const ch = span?.ch ?? 2;
    const [cx, cy] = iso(b.c0 + cw / 2, b.r0 + ch / 2);
    // Širina slike ~ širina dijagonale bloka.
    const blockW = (cw + ch) * WC;
    const w = blockW * (b.id === 'stadium' ? 1.05 : 1.15);
    const h = w; // kvadratne slike
    const x = cx - w / 2;
    const y = cy - h * 0.74; // baza sjedi oko centra polja

    return (
      <g
        key={b.id}
        className={`isob${built ? '' : ' isob--locked'}`}
        onClick={() => handleTap(b)}
        style={{ cursor: built && b.tab ? 'pointer' : 'default' }}
      >
        <image
          href={img}
          x={x}
          y={y}
          width={w}
          height={h}
          preserveAspectRatio="xMidYMid meet"
          opacity={built ? 1 : 0.5}
          style={{ filter: built ? 'drop-shadow(0 6px 10px rgba(0,0,0,.55))' : 'grayscale(.7)' }}
        />
        {!built && (
          <text x={cx} y={cy - h * 0.18} textAnchor="middle" fontSize="26">🔒</text>
        )}
        {/* Label */}
        <g transform={`translate(${cx}, ${cy + (b.id === 'stadium' ? 6 : 10)})`}>
          <rect
            x={-b.label.length * 4.2 - 8}
            y={-9}
            width={b.label.length * 8.4 + 16}
            height={18}
            rx={9}
            fill="rgba(6,22,32,.82)"
            stroke={b.id === 'stadium' ? '#f6c61a' : 'rgba(246,198,26,.4)'}
            strokeWidth="1"
          />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill={b.id === 'stadium' ? '#f6c61a' : '#fff'}
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            {b.label}
          </text>
        </g>
      </g>
    );
  };

  // Sortiraj sve (uklj. stadion) po dubini: gornje prvo, donje preko njih.
  const all = [
    { ...STADIUM, cw: STADIUM.cw, ch: STADIUM.ch },
    ...BUILDINGS.map((b) => ({ ...b, cw: 2, ch: 2 })),
  ];
  const ordered = all.sort(
    (a, b) => (a.c0 + a.cw / 2 + a.r0 + a.ch / 2) - (b.c0 + b.cw / 2 + b.r0 + b.ch / 2),
  );

  return (
    <div className="clubmap3">
      <div className="clubmap3__header">
        <h1 className="clubmap3__title">{club?.name}</h1>
        <p className="clubmap3__sub">
          {club?.stadiumName} · {(club?.stadiumCap ?? 0).toLocaleString('sr')} mjesta
        </p>
      </div>

      <svg
        className="clubmap3__svg"
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Ground mreža */}
        <g className="clubmap3__ground">
          {cells.map((cell) => (
            <polygon
              key={cell.key}
              points={cellPoints(cell.c, cell.r)}
              fill={cell.alt ? '#143726' : '#10301f'}
              stroke="rgba(246,198,26,.10)"
              strokeWidth="0.6"
            />
          ))}
          {/* Istaknuto stadionsko polje */}
          <polygon
            points={blockPoints(STADIUM.c0, STADIUM.r0, STADIUM.cw, STADIUM.ch)}
            fill="rgba(246,198,26,.08)"
            stroke="rgba(246,198,26,.45)"
            strokeWidth="1.4"
            strokeDasharray="4 3"
          />
        </g>

        {/* Sve građevine, sortirane po dubini (uklj. stadion) */}
        {ordered.map((b) => renderBuilding(b, { cw: b.cw, ch: b.ch }))}
      </svg>
    </div>
  );
}
