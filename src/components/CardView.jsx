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

const RARITY_BG = {
  common:    'linear-gradient(160deg, #1e2128 0%, #2a2d35 100%)',
  rare:      'linear-gradient(160deg, #1c1600 0%, #2e2400 100%)',
  epic:      'linear-gradient(160deg, #120b22 0%, #1e1035 100%)',
  legendary: 'linear-gradient(160deg, #1c0505 0%, #300a0a 100%)',
};

export default function CardView({ card, onClick, small = false }) {
  const rarity = rarityById(card.rarity);
  const attrKeys = attributesForPosition(card.position);
  const initials = card.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const bg = RARITY_BG[card.rarity] || RARITY_BG.common;

  return (
    <motion.div
      className={`card${small ? ' card--small' : ''}`}
      style={{ '--rarity': rarity.hex, background: bg }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onClick={onClick}
    >
      {/* Top row */}
      <div className="card__top">
        <div className="card__overall">{card.overall}</div>
        <div className="card__pos">{card.position}</div>
        {card.nationality && <div className="card__nat">{card.nationality}</div>}
      </div>

      {/* Avatar */}
      <div className="card__avatar" style={{ background: `color-mix(in srgb, ${rarity.hex} 22%, #111)` }}>
        {initials}
      </div>

      {/* Name */}
      <div className="card__name">{card.name}</div>
      <div className="card__rarity">{card.isTalent ? `★ Talent ${card.potential}` : rarity.label}</div>

      {/* Attributes */}
      <ul className="card__attrs">
        {attrKeys.map((key) => (
          <li key={key}>
            <span className="card__attr-label">{ATTR_LABELS[key] ?? key}</span>
            <span className="card__attr-val">{card.attributes[key]}</span>
          </li>
        ))}
      </ul>

      {/* Abilities */}
      {card.abilities?.length > 0 && (
        <ul className="card__abilities">
          {card.abilities.map((a) => (
            <li key={a.id} title={a.base}>⚡ {a.name}</li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
