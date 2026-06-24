import { useGameStore } from '../store/useGameStore.js';
import { BUILDING_IMAGES } from '../game/clubMapImages.js';

/* =========================================================================
   Izometrijski grid od kockica. Mreža i građevine dijele isti koordinatni
   sistem pa se savršeno poklapaju.
   iso(c, r) → [x, y] u SVG jedinicama.
   ========================================================================= */
// Pravi izometrijski odnos 2:1 (široke pljosnate kockice). Veliki grid 50×50 —
// prikazuje se samo prozor u njegovu sredinu (sitnije kockice → sve stane centrirano).
const COLS = 50;
const ROWS = 50;
const WC = 32; // pola širine kockice
const HC = 16; // pola visine kockice (WC = 2·HC → klasična izometrija)

function iso(c, r) {
  return [(c - r) * WC, (c + r) * HC];
}

// Stadion: centralni blok 4×6. (+10,+10 pomak jer je grid sad 50×50, centar (25,25).)
const STADIUM = { id: 'stadium', label: 'Stadion', tab: null, c0: 23, r0: 21, cw: 4, ch: 6 };

// Pozicije (privremene — korisnik ponovo označava na novom sitnijem gridu).
const BUILDINGS = [
  { id: 'train',    label: 'Trening',     tab: 'train',    c0: 16, r0: 14, unlock: 'liga_1' },
  { id: 'myteam',   label: 'Svlačionica', tab: 'myteam',   c0: 15, r0: 17 },
  { id: 'match',    label: 'Teren',       tab: 'match',    c0: 20, r0: 17 },
  { id: 'sponsors', label: 'Sponzori',    tab: 'sponsors', c0: 18, r0: 21, unlock: 'liga_5' },
  { id: 'market',   label: 'Tržnica',     tab: 'market',   c0: 27, r0: 30, unlock: 'liga_1' },
  { id: 'academy',  label: 'Akademija',   tab: 'academy',  c0: 32, r0: 29, unlock: 'liga_5' },
  { id: 'medical',  label: 'Medicinski',  tab: 'medical',  c0: 31, r0: 33, unlock: 'liga_1' },
  { id: 'scout',    label: 'Skaut',       tab: 'scout',    c0: 35, r0: 33, unlock: 'liga_5' },
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

  // Prozor u sredinu velikog grida (centar = iso(25,25) = [0, 800]).
  // Aspekt prozora ~ portretni ekran → sitnije kockice prekrivaju cijeli ekran.
  const vb = { x: -285, y: 242, w: 570, h: 1117 };

  // Ground ćelije — renderuj samo one u/oko prozora (culling radi performansi).
  const cells = [];
  const m = 60; // margina
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const [cx, cy] = iso(c + 0.5, r + 0.5);
      if (cx < vb.x - m || cx > vb.x + vb.w + m || cy < vb.y - m || cy > vb.y + vb.h + m) continue;
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
    const isStadium = b.id === 'stadium';
    const blockDiagW = (cw + ch) * WC; // širina dijagonale bloka (px)
    const blockHalfH = ((cw + ch) * HC) / 2; // pola visine dijamanta bloka

    let w, h, x, y;
    if (isStadium) {
      // Stadion: 2:3 (4:6) slika. Širina ~ dijagonala bloka; baza sjeda na dno bloka.
      w = blockDiagW * 1.08;
      h = w * 1.5; // 2:3 portrait
      x = cx - w / 2;
      y = cy + blockHalfH + 30 - h; // dno slike sjeda u grid
    } else {
      // Ostale: kvadratne 1:1, baza oko centra polja.
      w = blockDiagW * 1.15;
      h = w;
      x = cx - w / 2;
      y = cy - h * 0.74;
    }

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
        </g>

        {/* Sve građevine, sortirane po dubini (uklj. stadion) */}
        {ordered.map((b) => renderBuilding(b, { cw: b.cw, ch: b.ch }))}
      </svg>
    </div>
  );
}
