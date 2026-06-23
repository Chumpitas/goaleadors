import { AnimatePresence, motion } from 'framer-motion';
import { PACKS, PITY_THRESHOLD } from '../game/packs.js';
import { useGameStore } from '../store/useGameStore.js';
import CardView from './CardView.jsx';

export default function PackOpening() {
  const pity = useGameStore((s) => s.pity);
  const lastOpening = useGameStore((s) => s.lastOpening);
  const openAndCollect = useGameStore((s) => s.openAndCollect);
  const clearOpening = useGameStore((s) => s.clearOpening);
  const collectionSize = useGameStore((s) => s.collection.length);

  return (
    <div className="packs">
      <div className="packs__bar">
        <span>
          Kolekcija: <strong>{collectionSize}</strong>
        </span>
        <span>
          Pity: <strong>{pity}</strong> / {PITY_THRESHOLD}
        </span>
      </div>

      <div className="packs__shelf">
        {Object.values(PACKS).map((pack) => (
          <button
            key={pack.code}
            className="pack-btn"
            onClick={() => openAndCollect(pack.code)}
          >
            <span className="pack-btn__name">{pack.name}</span>
            <span className="pack-btn__meta">
              {pack.cards} karata · {Object.entries(pack.guarantee).map(([r, n]) => `min ${n} ${r}`).join(', ')}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lastOpening && (
          <motion.div
            className="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={clearOpening}
          >
            <motion.div
              className="reveal__panel"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>
                {lastOpening.pack.name} kesica
                {lastOpening.pityApplied && <span className="reveal__pity"> · PITY Legendary!</span>}
              </h2>
              <div className="reveal__cards">
                {lastOpening.cards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 18 }}
                  >
                    <CardView card={card} />
                  </motion.div>
                ))}
              </div>
              <button className="reveal__close" onClick={clearOpening}>
                Zatvori
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
