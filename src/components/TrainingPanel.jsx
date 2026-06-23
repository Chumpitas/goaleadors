import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import CardView from './CardView.jsx';
import { focusOptions, MAX_TRAINING_BOOST, TRAINING_COST_KOVANICE } from '../game/training.js';

const ATTR_LABEL = { shooting: 'SHO', passing: 'PAS', tackling: 'TAC', pace: 'PAC', reflexes: 'REF', positioning: 'POS' };

export default function TrainingPanel() {
  const collection = useGameStore((s) => s.collection);
  const kovanice = useGameStore((s) => s.kovanice);
  const trainCardAt = useGameStore((s) => s.trainCardAt);
  const [focus, setFocus] = useState({});
  const [msg, setMsg] = useState('');

  if (!collection.length) {
    return <p className="train__empty">Nemaš karata. Osnuj klub (Klub tab) ili otvori kesicu (Kesice tab).</p>;
  }

  const train = (i, card) => {
    const f = focus[i] || focusOptions(card.position)[0];
    const res = trainCardAt(i, f);
    setMsg(res.ok ? `${card.name}: +${res.applied} ${ATTR_LABEL[f]}${res.capped ? ' (max)' : ''}` : `${card.name}: ${res.reason}`);
  };

  return (
    <div className="train">
      <div className="train__bar">
        <span>🪙 Kovanice: <strong>{kovanice.toLocaleString('sr')}</strong></span>
        <span>Trening: <strong>{TRAINING_COST_KOVANICE.toLocaleString('sr')}</strong> 🪙 / sesija</span>
      </div>
      {msg && <p className="train__msg">{msg}</p>}

      <div className="app__grid">
        {collection.map((card, i) => {
          const boost = card.trainingBoost ?? 0;
          const maxed = boost >= MAX_TRAINING_BOOST;
          return (
            <div key={i} className="train__cell">
              <CardView card={card} />
              <div className="train__ctl">
                <div className="train__meter">Boost {boost}/{MAX_TRAINING_BOOST}</div>
                <select
                  value={focus[i] || focusOptions(card.position)[0]}
                  onChange={(e) => setFocus((s) => ({ ...s, [i]: e.target.value }))}
                  disabled={maxed}
                >
                  {focusOptions(card.position).map((a) => (
                    <option key={a} value={a}>{ATTR_LABEL[a]}</option>
                  ))}
                </select>
                <button
                  className="train__btn"
                  disabled={maxed || kovanice < TRAINING_COST_KOVANICE}
                  onClick={() => train(i, card)}
                >
                  {maxed ? 'Max' : 'Treniraj'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
