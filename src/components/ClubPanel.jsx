import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import ClubOnboarding from './ClubOnboarding.jsx';
import CrestSVG from './CrestSVG.jsx';
import JerseySVG from './JerseySVG.jsx';

export default function ClubPanel() {
  const club = useGameStore((s) => s.club);
  const resetClub = useGameStore((s) => s.resetClub);
  const [editing, setEditing] = useState(false);

  if (!club || editing) {
    return (
      <div>
        {editing && <p className="club__editing">Izmjena kluba</p>}
        <ClubOnboarding initial={editing ? club : undefined} onDone={() => setEditing(false)} />
        {editing && <button className="club__cancel" onClick={() => setEditing(false)}>Otkaži</button>}
      </div>
    );
  }

  return (
    <div className="club2">
      {/* Hero */}
      <div className="club2__hero">
        <div className="club2__visuals">
          <div className="club2__crest-wrap">
            <CrestSVG crest={club.crest} name={club.name} size={130} />
          </div>
          <div className="club2__jersey-wrap">
            <JerseySVG kit={club.kit} size={110} />
          </div>
        </div>
        <h1 className="club2__name">{club.name}</h1>
        <p className="club2__location">📍 {club.city}, {club.country}</p>
      </div>

      {/* Stats */}
      <div className="club2__stats">
        <div className="club2__stat">
          <span className="club2__stat-label">Stadion</span>
          <span className="club2__stat-value">{club.stadiumName}</span>
        </div>
        <div className="club2__stat-divider" />
        <div className="club2__stat">
          <span className="club2__stat-label">Kapacitet</span>
          <span className="club2__stat-value">{club.stadiumCap.toLocaleString('sr')}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="club2__actions">
        <button className="club2__btn-primary" onClick={() => setEditing(true)}>
          ✏️ Izmijeni identitet
        </button>
        <button className="club2__btn-ghost" onClick={resetClub}>
          🔄 Osnuj novi klub
        </button>
      </div>
    </div>
  );
}
