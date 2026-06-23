import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';
import CardView from './CardView.jsx';
import { ACADEMY_LEVELS, DOMESTIC_RATE } from '../game/academy.js';

export default function AcademyPanel() {
  const club = useGameStore((s) => s.club);
  const runAcademy = useGameStore((s) => s.runAcademy);
  const [level, setLevel] = useState(1);
  const [batch, setBatch] = useState(null);

  const cfg = ACADEMY_LEVELS[level];

  return (
    <div className="academy">
      <p className="academy__intro">
        Omladinska akademija (§10.3) · {Math.round(DOMESTIC_RATE * 100)}% domaćih
        {club ? ` (${club.country})` : ' (osnuj klub za domaći bias)'} · karte iz aktivne edicije.
      </p>

      <div className="academy__levels">
        {Object.keys(ACADEMY_LEVELS).map((lvl) => (
          <button
            key={lvl}
            className={`chip ${Number(lvl) === level ? 'is-active' : ''}`}
            onClick={() => setLevel(Number(lvl))}
          >
            Nivo {lvl}
          </button>
        ))}
      </div>

      <p className="academy__desc">
        {cfg.cards} karata/sezona · OVR {cfg.ovr[0]}–{cfg.ovr[1]}
        {cfg.guaranteedRare ? ' · garantovana Rare' : cfg.epicChance ? ' · šansa za Epic' : cfg.rareChance ? ' · šansa za Rare' : ''}
      </p>

      <button className="academy__run" onClick={() => setBatch(runAcademy(level))}>
        Generiši omladince
      </button>

      {batch && (
        <motion.div className="app__grid academy__grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {batch.map((card, i) => (
            <motion.div key={i} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}>
              <CardView card={card} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
