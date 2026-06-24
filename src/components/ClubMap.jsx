import { useGameStore } from '../store/useGameStore.js';
import { MAP_BG, BUILDING_IMAGES } from '../game/clubMapImages.js';

// Pozicije su u % kontejnera — izometrijski 3×3 grid: stadion u centru, 8 oko njega.
// top/left = centar građevine; w = širina u % (kvadratne slike, visina = širina).
const BUILDINGS = [
  { id: 'stadium',  label: 'Stadion',     tab: null,       top: 47, left: 50, w: 36, z: 47 },
  { id: 'train',    label: 'Trening',     tab: 'train',    top: 25, left: 50, w: 23, z: 25, unlock: 'liga_1' },
  { id: 'myteam',   label: 'Svlačionica', tab: 'myteam',   top: 35, left: 27, w: 23, z: 35 },
  { id: 'match',    label: 'Teren',       tab: 'match',    top: 35, left: 73, w: 23, z: 35 },
  { id: 'sponsors', label: 'Sponzori',    tab: 'sponsors', top: 50, left: 15, w: 22, z: 50, unlock: 'liga_5' },
  { id: 'market',   label: 'Tržnica',     tab: 'market',   top: 50, left: 85, w: 22, z: 50, unlock: 'liga_1' },
  { id: 'academy',  label: 'Akademija',   tab: 'academy',  top: 64, left: 27, w: 23, z: 64, unlock: 'liga_5' },
  { id: 'medical',  label: 'Medicinski',  tab: 'medical',  top: 64, left: 73, w: 23, z: 64, unlock: 'liga_1' },
  { id: 'scout',    label: 'Skaut',       tab: 'scout',    top: 74, left: 50, w: 23, z: 74, unlock: 'liga_5' },
];

function isUnlocked(building, level, seasons) {
  if (building.id === 'stadium') return true;
  if (!building.unlock) return true;
  if (building.unlock === 'liga_1') return level >= 1 || seasons >= 1;
  if (building.unlock === 'liga_5') return level >= 2 || seasons >= 3;
  return false;
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

  return (
    <div className="clubmap2" style={{ backgroundImage: `url(${MAP_BG})` }}>
      {/* Naslov */}
      <div className="clubmap2__header">
        <h1 className="clubmap2__title">{club?.name}</h1>
        <p className="clubmap2__sub">
          {club?.stadiumName} · {(club?.stadiumCap ?? 0).toLocaleString('sr')} mjesta
        </p>
      </div>

      {/* Građevine */}
      <div className="clubmap2__field">
        {BUILDINGS.map((b) => {
          const built = isUnlocked(b, level, seasons);
          const img = BUILDING_IMAGES[b.id];
          return (
            <button
              key={b.id}
              className={[
                'clubmap2__building',
                b.id === 'stadium' ? 'clubmap2__building--stadium' : '',
                !built ? 'clubmap2__building--locked' : '',
              ].join(' ')}
              style={{
                top: `${b.top}%`,
                left: `${b.left}%`,
                width: `${b.w}%`,
                zIndex: b.z,
              }}
              onClick={() => handleTap(b)}
              disabled={!built}
            >
              <img src={img} alt={b.label} className="clubmap2__building-img" />
              {!built && <span className="clubmap2__lock">🔒</span>}
              <span className="clubmap2__building-label">{b.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
