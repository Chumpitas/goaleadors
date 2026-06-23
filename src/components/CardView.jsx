import { motion } from 'framer-motion';
import { rarityById } from '../game/constants.js';
import { attributesForPosition } from '../game/cards.js';

const ATTR_LABELS = {
  shooting: 'SHO',
  passing: 'PAS',
  tackling: 'TAC',
  pace: 'PAC',
  reflexes: 'REF',
  positioning: 'POS',
};

/** A Panini-style player card rendering attributes, OVERALL and abilities. */
export default function CardView({ card }) {
  const rarity = rarityById(card.rarity);
  const attrKeys = attributesForPosition(card.position);

  return (
    <motion.div
      className="card"
      style={{ '--rarity': rarity.hex }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <header className="card__top">
        <div className="card__overall">{card.overall}</div>
        <div className="card__meta">
          <span className="card__pos">{card.position}</span>
          {card.nationality && <span className="card__nat">{card.nationality}</span>}
        </div>
      </header>

      <h3 className="card__name">{card.name}</h3>
      <div className="card__rarity">{card.isTalent ? `★ Talent · ${card.potential}` : rarity.label}</div>

      <ul className="card__attrs">
        {attrKeys.map((key) => (
          <li key={key}>
            <span className="card__attr-label">{ATTR_LABELS[key] ?? key}</span>
            <span className="card__attr-val">{card.attributes[key]}</span>
          </li>
        ))}
      </ul>

      {card.abilities.length > 0 && (
        <ul className="card__abilities">
          {card.abilities.map((a) => (
            <li key={a.id} title={a.base}>
              {a.name}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
