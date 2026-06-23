import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { FORMATIONS } from '../game/tactics.js';

const FORMATION_LIST = Object.keys(FORMATIONS);

// Build slot list from formation string e.g. '4-3-3' → [{pos:'GK'}, {pos:'DEF'}×4, ...]
function buildSlots(formationKey) {
  const f = FORMATIONS[formationKey];
  const slots = [{ pos: 'GK', label: 'GK' }];
  for (let i = 0; i < f.def; i++) slots.push({ pos: 'DEF', label: `DEF ${i + 1}` });
  for (let i = 0; i < f.mid; i++) slots.push({ pos: 'MID', label: `MID ${i + 1}` });
  for (let i = 0; i < f.att; i++) slots.push({ pos: 'ATT', label: `ATT ${i + 1}` });
  return slots;
}

// Pitch visual — rows by position line
function PitchView({ slots, lineup, onSlotClick }) {
  const rows = ['GK', 'DEF', 'MID', 'ATT'];
  return (
    <div className="myteam__pitch">
      <div className="myteam__pitch-inner">
        {rows.map((pos) => {
          const posSlots = slots.map((s, i) => ({ ...s, idx: i })).filter((s) => s.pos === pos);
          return (
            <div key={pos} className="myteam__row">
              {posSlots.map((s) => {
                const card = lineup[s.idx];
                return (
                  <button
                    key={s.idx}
                    className={`myteam__slot${card ? ' is-filled' : ''}`}
                    onClick={() => onSlotClick(s.idx, s.pos)}
                  >
                    {card ? (
                      <>
                        <span className="myteam__slot-ovr">{card.overall}</span>
                        <span className="myteam__slot-name">{card.name.split(' ').pop()}</span>
                      </>
                    ) : (
                      <span className="myteam__slot-pos">{s.pos}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Card picker modal/drawer
function CardPicker({ pos, collection, usedIds, onPick, onClose }) {
  const eligible = collection
    .map((c, i) => ({ ...c, collIdx: i }))
    .filter((c) => c.position === pos && !usedIds.has(c.collIdx))
    .sort((a, b) => b.overall - a.overall);

  return (
    <div className="myteam__picker-overlay" onClick={onClose}>
      <div className="myteam__picker" onClick={(e) => e.stopPropagation()}>
        <div className="myteam__picker-header">
          <strong>Odaberi {pos}</strong>
          <button onClick={onClose}>✕</button>
        </div>
        {eligible.length === 0 && <p className="myteam__picker-empty">Nema dostupnih {pos} karata.</p>}
        <ul className="myteam__picker-list">
          {eligible.map((c) => (
            <li key={c.collIdx} className="myteam__picker-card" onClick={() => onPick(c.collIdx)}>
              <span className="myteam__picker-ovr" style={{ color: `var(--rarity-${c.rarity})` }}>{c.overall}</span>
              <span className="myteam__picker-name">{c.name}</span>
              <span className="myteam__picker-pos">{c.position}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function MyTeamPanel() {
  const collection = useGameStore((s) => s.collection);
  const formation = useGameStore((s) => s.formation || '4-3-3');
  const lineup = useGameStore((s) => s.lineup || {});
  const setFormation = useGameStore((s) => s.setFormation);
  const setLineup = useGameStore((s) => s.setLineup);

  const [picker, setPicker] = useState(null); // { slotIdx, pos }

  const slots = buildSlots(formation);

  // Resolve lineup: slotIdx → card object
  const resolvedLineup = {};
  Object.entries(lineup).forEach(([slotIdx, collIdx]) => {
    if (collection[collIdx]) resolvedLineup[slotIdx] = collection[collIdx];
  });

  const usedCollIdxs = new Set(Object.values(lineup));

  function handleSlotClick(slotIdx, pos) {
    // If slot filled — clear it
    if (lineup[slotIdx] !== undefined) {
      const next = { ...lineup };
      delete next[slotIdx];
      setLineup(next);
    } else {
      setPicker({ slotIdx, pos });
    }
  }

  function handlePick(collIdx) {
    setLineup({ ...lineup, [picker.slotIdx]: collIdx });
    setPicker(null);
  }

  const filledCount = Object.keys(lineup).length;

  // Bench: cards not in lineup
  const benchCards = collection
    .map((c, i) => ({ ...c, collIdx: i }))
    .filter((c) => !usedCollIdxs.has(c.collIdx))
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 7);

  return (
    <div className="myteam">
      <div className="myteam__header">
        <div className="myteam__formation-pick">
          {FORMATION_LIST.map((f) => (
            <button
              key={f}
              className={`myteam__f-btn${formation === f ? ' is-active' : ''}`}
              onClick={() => setFormation(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="myteam__status">
          {filledCount}/11 igrača · <span className={filledCount >= 11 ? 'myteam__ok' : 'myteam__warn'}>{filledCount >= 11 ? '✅ Postava kompletna' : '⚠️ Klikni slot za dodavanje'}</span>
        </div>
      </div>

      <PitchView slots={slots} lineup={resolvedLineup} onSlotClick={handleSlotClick} />

      {benchCards.length > 0 && (
        <div className="myteam__bench">
          <h4>Klupa</h4>
          <div className="myteam__bench-list">
            {benchCards.map((c) => (
              <div key={c.collIdx} className="myteam__bench-card">
                <span className="myteam__bench-ovr">{c.overall}</span>
                <span className="myteam__bench-name">{c.name}</span>
                <span className="myteam__bench-pos">{c.position}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {picker && (
        <CardPicker
          pos={picker.pos}
          collection={collection}
          usedIds={usedCollIdxs}
          onPick={handlePick}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}
