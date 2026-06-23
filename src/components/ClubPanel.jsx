import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import ClubOnboarding from './ClubOnboarding.jsx';
import CrestSVG from './CrestSVG.jsx';
import JerseySVG from './JerseySVG.jsx';

/** Tab "Klub": onboarding ako nema kluba, inače prikaz identiteta (§9). */
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
    <div className="club">
      <div className="club__identity">
        <CrestSVG crest={club.crest} name={club.name} size={150} />
        <JerseySVG kit={club.kit} size={130} />
      </div>
      <h2 className="club__name">{club.name}</h2>
      <p className="club__meta">{club.city}, {club.country}</p>
      <dl className="club__facts">
        <div><dt>Stadion</dt><dd>{club.stadiumName}</dd></div>
        <div><dt>Kapacitet</dt><dd>{club.stadiumCap.toLocaleString('sr')}</dd></div>
      </dl>
      <div className="club__actions">
        <button className="onb__next" onClick={() => setEditing(true)}>Izmijeni identitet</button>
        <button className="club__cancel" onClick={resetClub}>Osnuj novi</button>
      </div>
    </div>
  );
}
