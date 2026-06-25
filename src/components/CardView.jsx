import { motion } from 'framer-motion';
import { rarityById } from '../game/constants.js';
import { attributesForPosition } from '../game/cards.js';
import { useGameStore } from '../store/useGameStore.js';

const ATTR_LABELS = {
  shooting:    'SHOOTING',
  passing:     'PASSING',
  tackling:    'TACKLING',
  pace:        'PACE',
  reflexes:    'REFLEXES',
  positioning: 'POSITNG',
};

const GAME_START = new Date('2026-01-01');
function gameDayToDate(day) {
  const d = new Date(GAME_START);
  d.setDate(d.getDate() + day - 1);
  return d.toLocaleDateString('sr-Latn', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

const NAT_FLAGS = {
  'Srbija':   '🇷🇸',
  'Hrvatska': '🇭🇷',
  'Bosna':    '🇧🇦',
  'Brazil':   '🇧🇷',
  'Belgija':  '🇧🇪',
};

const RARITY_COLORS = {
  common:    '#9aa0a6',
  rare:      '#e0a01e',
  epic:      '#8b3fd1',
  legendary: '#d63a3a',
};

export default function CardView({ card, onClick, small = false }) {
  const rarity = rarityById(card.rarity);
  const attrKeys = attributesForPosition(card.position);
  const rarityColor = RARITY_COLORS[card.rarity] || RARITY_COLORS.common;
  const flag = NAT_FLAGS[card.nationality] ?? '🏳️';

  const editionSchedule = useGameStore((s) => s.editionSchedule);
  const edition = card.editionId ? editionSchedule.find((e) => e.code === card.editionId) : null;
  const expDate = edition ? gameDayToDate(edition.retireDay) : null;
  const editionLabel = edition ? edition.theme.toUpperCase() + ' EDITION' : null;

  return (
    <motion.div
      className={`card2${small ? ' card2--small' : ''}`}
      style={{ '--rc': rarityColor }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      onClick={onClick}
    >
      {/* Name banner */}
      <div className="card2__namebar">
        <span className="card2__name">{card.name}</span>
      </div>

      {/* Flag + Position */}
      <div className="card2__toprow">
        <span className="card2__flag">{flag}</span>
        <span className="card2__pos">{card.position}</span>
      </div>

      {/* Player image or initials placeholder */}
      <div className="card2__img">
        {card.image
          ? <img src={card.image} alt={card.name} />
          : <span className="card2__initials">
              {card.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
        }
      </div>

      {/* Stats panel */}
      <div className="card2__panel">
        {/* Overall */}
        <div className="card2__overall-row">
          <span className="card2__nat-code">{card.nationality?.slice(0, 3).toUpperCase() ?? '---'}</span>
          <span className="card2__overall">{card.overall}</span>
          <span className="card2__rarity-label">{rarity.label.toUpperCase()}</span>
        </div>

        {/* Attributes */}
        <div className="card2__attrs">
          {attrKeys.map((key) => (
            <div key={key} className="card2__attr">
              <span className="card2__attr-label">{ATTR_LABELS[key] ?? key}</span>
              <span className="card2__attr-val">{card.attributes[key]}</span>
            </div>
          ))}
        </div>

        {/* Abilities */}
        {card.abilities?.length > 0 && (
          <div className="card2__abilities">
            {card.abilities.map((a) => (
              <span key={a.id} className="card2__ability">{a.name.toUpperCase()}</span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="card2__footer">
          <span>GOALEADORS</span>
          {editionLabel && <span>· {editionLabel}</span>}
          {expDate && <span>· EXP. {expDate}</span>}
        </div>
      </div>
    </motion.div>
  );
}
