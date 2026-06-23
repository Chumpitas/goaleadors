import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';

const FORMATIONS_SLOTS = {
  '4-3-3': [
    { pos: 'GK', row: 5 },
    { pos: 'LB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'RB', row: 4 },
    { pos: 'MID', row: 3 }, { pos: 'MID', row: 3 }, { pos: 'MID', row: 3 },
    { pos: 'LW', row: 2 }, { pos: 'ATT', row: 2 }, { pos: 'RW', row: 2 },
  ],
  '4-4-2': [
    { pos: 'GK', row: 5 },
    { pos: 'LB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'RB', row: 4 },
    { pos: 'LW', row: 3 }, { pos: 'MID', row: 3 }, { pos: 'MID', row: 3 }, { pos: 'RW', row: 3 },
    { pos: 'ATT', row: 2 }, { pos: 'ATT', row: 2 },
  ],
  '3-5-2': [
    { pos: 'GK', row: 5 },
    { pos: 'CB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'CB', row: 4 },
    { pos: 'LW', row: 3 }, { pos: 'MID', row: 3 }, { pos: 'MID', row: 3 }, { pos: 'MID', row: 3 }, { pos: 'RW', row: 3 },
    { pos: 'ATT', row: 2 }, { pos: 'ATT', row: 2 },
  ],
  '4-2-3-1': [
    { pos: 'GK', row: 5 },
    { pos: 'LB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'RB', row: 4 },
    { pos: 'MID', row: 3 }, { pos: 'MID', row: 3 },
    { pos: 'LW', row: 2 }, { pos: 'MID', row: 2 }, { pos: 'RW', row: 2 },
    { pos: 'ATT', row: 1 },
  ],
  '5-3-2': [
    { pos: 'GK', row: 5 },
    { pos: 'LB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'CB', row: 4 }, { pos: 'RB', row: 4 },
    { pos: 'MID', row: 3 }, { pos: 'MID', row: 3 }, { pos: 'MID', row: 3 },
    { pos: 'ATT', row: 2 }, { pos: 'ATT', row: 2 },
  ],
};

const FORMATION_OPTS = Object.keys(FORMATIONS_SLOTS);

// Loose position matching: any card can go anywhere but highlight if position matches
function posMatch(cardPos, slotPos) {
  if (!cardPos) return false;
  const c = cardPos.toUpperCase();
  const s = slotPos.toUpperCase();
  if (c === s) return true;
  // GK is strict
  if (s === 'GK') return c === 'GK';
  if (c === 'GK') return false;
  return true;
}

export default function MyTeamPanel() {
  const collection = useGameStore((s) => s.collection);
  const lineup = useGameStore((s) => s.lineup);
  const formation = useGameStore((s) => s.formation);
  const setLineup = useGameStore((s) => s.setLineup);
  const setFormation = useGameStore((s) => s.setFormation);

  const [pickerSlot, setPickerSlot] = useState(null);

  const slots = FORMATIONS_SLOTS[formation] || FORMATIONS_SLOTS['4-3-3'];

  // Group slots by row for pitch rendering
  const rows = {};
  slots.forEach((slot, idx) => {
    if (!rows[slot.row]) rows[slot.row] = [];
    rows[slot.row].push({ ...slot, idx });
  });
  const rowKeys = Object.keys(rows).sort((a, b) => Number(b) - Number(a));

  const assignedIndices = new Set(Object.values(lineup).map(Number));

  function assignCard(slotIdx, collIdx) {
    const next = { ...lineup };
    // Remove card from any other slot it might be in
    for (const [k, v] of Object.entries(next)) {
      if (Number(v) === collIdx) delete next[k];
    }
    if (collIdx === null) {
      delete next[slotIdx];
    } else {
      next[slotIdx] = collIdx;
    }
    setLineup(next);
    setPickerSlot(null);
  }

  const bench = collection
    .map((c, i) => ({ card: c, i }))
    .filter(({ i }) => !assignedIndices.has(i))
    .slice(0, 7);

  return (
    <div className="myteam">
      <div className="myteam__controls">
        <label>
          Formacija
          <select value={formation} onChange={(e) => setFormation(e.target.value)}>
            {FORMATION_OPTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <span className="myteam__count">
          {Object.keys(lineup).length}/11 igrača raspoređeno
        </span>
      </div>

      {/* Pitch */}
      <div className="myteam__pitch">
        {rowKeys.map((row) => (
          <div key={row} className="myteam__row">
            {rows[row].map(({ pos, idx }) => {
              const collIdx = lineup[idx] ?? null;
              const card = collIdx !== null ? collection[collIdx] : null;
              const isOpen = pickerSlot === idx;

              return (
                <div key={idx} className="myteam__slot" onClick={() => setPickerSlot(isOpen ? null : idx)}>
                  <div className="myteam__slot-pos">{pos}</div>
                  {card ? (
                    <>
                      <div className="myteam__slot-name">{card.name.split(' ').pop()}</div>
                      <div className="myteam__slot-ovr">{card.overall}</div>
                      <button className="myteam__slot-remove" onClick={(e) => { e.stopPropagation(); assignCard(idx, null); }}>✕</button>
                    </>
                  ) : (
                    <div className="myteam__slot-empty">+</div>
                  )}

                  {isOpen && (
                    <div className="myteam__picker" onClick={(e) => e.stopPropagation()}>
                      {collection.length === 0 && <div className="myteam__picker-empty">Nema karata</div>}
                      {collection
                        .map((c, i) => ({ c, i }))
                        .sort((a, b) => {
                          const am = posMatch(a.c.position, pos) ? 1 : 0;
                          const bm = posMatch(b.c.position, pos) ? 1 : 0;
                          if (bm !== am) return bm - am;
                          return b.c.overall - a.c.overall;
                        })
                        .map(({ c, i }) => (
                          <div
                            key={i}
                            className={`myteam__picker-item${assignedIndices.has(i) && lineup[idx] !== i ? ' is-used' : ''}${posMatch(c.position, pos) ? ' is-match' : ''}`}
                            onClick={() => assignCard(idx, i)}
                          >
                            <span className="myteam__picker-pos">{c.position}</span>
                            <span className="myteam__picker-name">{c.name}</span>
                            <span className="myteam__picker-ovr">{c.overall}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bench */}
      {bench.length > 0 && (
        <div className="myteam__bench">
          <h3>Klupa</h3>
          <div className="myteam__bench-list">
            {bench.map(({ card, i }) => (
              <div key={i} className="myteam__bench-card">
                <span className="myteam__bench-pos">{card.position}</span>
                <span className="myteam__bench-name">{card.name}</span>
                <span className="myteam__bench-ovr">{card.overall}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
