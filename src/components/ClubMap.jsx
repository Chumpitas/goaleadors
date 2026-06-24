import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { MAP_BG, BUILDING_IMAGES } from '../game/clubMapImages.js';

const BUILDINGS = [
  {
    id: 'stadium',
    label: 'Stadion',
    icon: '🏟️',
    desc: 'Srce tvog kluba',
    tab: null,
    size: 'lg',
    pos: { row: 2, col: 2 },
    alwaysBuilt: true,
  },
  {
    id: 'myteam',
    label: 'Svlačionica',
    icon: '👥',
    desc: 'Postavljanje tima i formacije',
    tab: 'myteam',
    size: 'md',
    pos: { row: 1, col: 1 },
  },
  {
    id: 'match',
    label: 'Teren',
    icon: '⚽',
    desc: 'Igraj mečeve i osvoji lopte',
    tab: 'match',
    size: 'md',
    pos: { row: 1, col: 3 },
  },
  {
    id: 'train',
    label: 'Trening centar',
    icon: '💪',
    desc: 'Razvijaj igrače treningom',
    tab: 'train',
    size: 'sm',
    pos: { row: 1, col: 2 },
    unlock: 'liga_1',
  },
  {
    id: 'academy',
    label: 'Akademija',
    icon: '🎓',
    desc: 'Razvijaj mlade talente',
    tab: 'academy',
    size: 'md',
    pos: { row: 3, col: 1 },
    unlock: 'liga_5',
  },
  {
    id: 'medical',
    label: 'Medicinski blok',
    icon: '⚕️',
    desc: 'Liječi i oporavi igrače',
    tab: 'medical',
    size: 'sm',
    pos: { row: 3, col: 3 },
    unlock: 'liga_1',
  },
  {
    id: 'scout',
    label: 'Skautski office',
    icon: '🔭',
    desc: 'Pronađi skrivene talente',
    tab: 'scout',
    size: 'sm',
    pos: { row: 3, col: 2 },
    unlock: 'liga_5',
  },
  {
    id: 'sponsors',
    label: 'Sponzorski ured',
    icon: '💼',
    desc: 'Pregovaraj sa sponzorima',
    tab: 'sponsors',
    size: 'sm',
    pos: { row: 2, col: 1 },
    unlock: 'liga_5',
  },
  {
    id: 'market',
    label: 'Tržnica',
    icon: '🏪',
    desc: 'Kupuj i prodaj igrače',
    tab: 'market',
    size: 'sm',
    pos: { row: 2, col: 3 },
    unlock: 'liga_1',
  },
];

function isUnlocked(building, level, seasons) {
  if (building.alwaysBuilt) return true;
  if (!building.unlock) return true;
  if (building.unlock === 'liga_1') return level >= 1 || seasons >= 1;
  if (building.unlock === 'liga_5') return level >= 2 || seasons >= 3;
  return false;
}

export default function ClubMap({ onNavigate }) {
  const club = useGameStore((s) => s.club);
  const managerStats = useGameStore((s) => s.managerStats);
  const [selected, setSelected] = useState(null);

  const level = managerStats?.currentLeagueLevel ?? 1;
  const seasons = managerStats?.totalSeasons ?? 0;

  const handleTap = (b) => {
    if (!isUnlocked(b, level, seasons)) {
      setSelected(b);
      return;
    }
    setSelected(b);
  };

  const handleGo = () => {
    if (selected?.tab) onNavigate(selected.tab);
    setSelected(null);
  };

  return (
    <div className="clubmap">
      {/* Header */}
      <div className="clubmap__header">
        <h1 className="clubmap__title">{club?.name}</h1>
        <p className="clubmap__sub">{club?.stadiumName} · {(club?.stadiumCap ?? 0).toLocaleString('sr')} mjesta</p>
      </div>

      {/* Izometrijska mapa */}
      <div className="clubmap__iso" style={{ backgroundImage: `url(${MAP_BG})` }}>
        <div className="clubmap__grid">
          {BUILDINGS.map((b) => {
            const built = isUnlocked(b, level, seasons);
            const isSelected = selected?.id === b.id;
            const img = BUILDING_IMAGES[b.id];
            return (
              <button
                key={b.id}
                className={[
                  'clubmap__tile',
                  `clubmap__tile--${b.size}`,
                  b.id === 'stadium' ? 'clubmap__tile--stadium' : '',
                  !built ? 'clubmap__tile--locked' : '',
                  isSelected ? 'clubmap__tile--selected' : '',
                ].join(' ')}
                style={{
                  gridRow: b.pos.row,
                  gridColumn: b.pos.col,
                }}
                onClick={() => handleTap(b)}
              >
                {built && img ? (
                  <img src={img} alt={b.label} className="clubmap__tile-img" />
                ) : (
                  <span className="clubmap__tile-icon">{built ? b.icon : '🔒'}</span>
                )}
                <span className="clubmap__tile-label">{b.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom drawer za odabrani objekat */}
      {selected && (
        <div className="clubmap__drawer">
          <div className="clubmap__drawer-inner">
            <span className="clubmap__drawer-icon">
              {isUnlocked(selected, level, seasons) ? selected.icon : '🔒'}
            </span>
            <div className="clubmap__drawer-info">
              <strong>{selected.label}</strong>
              <span>
                {isUnlocked(selected, level, seasons)
                  ? selected.desc
                  : 'Otključaj napredovanjem u ligi'}
              </span>
            </div>
            <div className="clubmap__drawer-actions">
              {isUnlocked(selected, level, seasons) && selected.tab && (
                <button className="clubmap__btn-go" onClick={handleGo}>
                  Uđi →
                </button>
              )}
              <button className="clubmap__btn-close" onClick={() => setSelected(null)}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
