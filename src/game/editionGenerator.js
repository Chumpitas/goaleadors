// Procedurally generate an edition's card pool (§4.4) so packs can yield real cards.
// Deterministic given a seed — same edition code always produces the same 110 cards.

import { EDITION_POOL, POSITIONS } from './constants.js';
import { createCard } from './cards.js';
import {
  INDIVIDUAL_ABILITIES,
  AURA_ABILITIES,
  SITUATIONAL_ABILITIES,
  KONTRA_ABILITIES,
} from './abilities.js';
import { mulberry32, hashSeed, randInt, pick } from './rng.js';

const NATIONALITIES = ['Srbija', 'Hrvatska', 'Bosna', 'Španija', 'Engleska', 'Italija', 'Njemačka', 'Francuska'];
const FIRST = ['Marko', 'Luka', 'Stefan', 'Ivan', 'Nikola', 'Aleksa', 'Filip', 'Petar', 'Vuk', 'Lazar', 'Davor', 'Goran'];
const LAST = ['Vidić', 'Pavić', 'Kovač', 'Jurić', 'Babić', 'Đorđević', 'Marić', 'Novak', 'Horvat', 'Ilić', 'Perić', 'Tomić'];

/** Attribute value range per rarity (before any boost). */
const STAT_RANGE = {
  common: [45, 68],
  rare: [58, 78],
  epic: [68, 86],
  legendary: [80, 94],
};

const ATTR_BY_POSITION = {
  [POSITIONS.GK]: ['reflexes', 'positioning', 'passing', 'pace'],
  [POSITIONS.DEF]: ['shooting', 'passing', 'tackling', 'pace'],
  [POSITIONS.MID]: ['shooting', 'passing', 'tackling', 'pace'],
  [POSITIONS.ATT]: ['shooting', 'passing', 'tackling', 'pace'],
};

/** The attribute that should skew high for a given position (drives a believable OVERALL). */
const KEY_ATTR = {
  [POSITIONS.GK]: 'reflexes',
  [POSITIONS.DEF]: 'tackling',
  [POSITIONS.MID]: 'passing',
  [POSITIONS.ATT]: 'shooting',
};

function genAttributes(rng, position, rarity) {
  const [lo, hi] = STAT_RANGE[rarity];
  const attrs = {};
  for (const key of ATTR_BY_POSITION[position]) {
    attrs[key] = randInt(rng, lo, hi);
  }
  // Push the key attribute toward the top of the range.
  const key = KEY_ATTR[position];
  attrs[key] = Math.min(100, Math.max(attrs[key], randInt(rng, Math.floor((lo + hi) / 2), hi) + 6));
  return attrs;
}

function individualFor(position) {
  return INDIVIDUAL_ABILITIES.filter(
    (a) => a.positions.includes('any') || a.positions.includes(position)
  );
}

function genAbilities(rng, position, rarity) {
  const ids = [];
  const ind = individualFor(position);
  const auraOrSit = [...AURA_ABILITIES, ...SITUATIONAL_ABILITIES];

  switch (rarity) {
    case 'rare':
      if (ind.length) ids.push(pick(rng, ind).id);
      break;
    case 'epic':
      if (ind.length) ids.push(pick(rng, ind).id);
      ids.push(pick(rng, auraOrSit).id);
      break;
    case 'legendary':
      ids.push(pick(rng, auraOrSit).id);
      ids.push(pick(rng, KONTRA_ABILITIES).id);
      break;
    default:
      break; // common: none
  }
  // de-dup just in case
  return [...new Set(ids)];
}

/**
 * Generate a full edition pool: 110 unique cards matching §4.4 rarity/position counts.
 * @param {string} editionCode - e.g. 'foundations'
 * @returns {object[]} array of cards (from createCard)
 */
export function generateEdition(editionCode = 'foundations') {
  const rng = mulberry32(hashSeed(editionCode));
  const { byRarity, byPosition } = EDITION_POOL;

  // Build a flat list of position slots honoring the per-position counts.
  const positionSlots = [];
  for (const [pos, count] of Object.entries(byPosition)) {
    for (let i = 0; i < count; i++) positionSlots.push(pos);
  }
  // Shuffle position slots so rarities aren't clustered by position.
  for (let i = positionSlots.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [positionSlots[i], positionSlots[j]] = [positionSlots[j], positionSlots[i]];
  }

  // Build a flat list of rarity slots honoring the per-rarity counts.
  const raritySlots = [];
  for (const [rarity, count] of Object.entries(byRarity)) {
    for (let i = 0; i < count; i++) raritySlots.push(rarity);
  }

  const cards = [];
  for (let i = 0; i < EDITION_POOL.total; i++) {
    const position = positionSlots[i];
    const rarity = raritySlots[i];
    const card = createCard({
      name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
      position,
      rarity,
      nationality: pick(rng, NATIONALITIES),
      editionId: editionCode,
      attributes: genAttributes(rng, position, rarity),
      abilities: genAbilities(rng, position, rarity),
    });
    cards.push(card);
  }
  return cards;
}

/**
 * Map drawn rarities (from openPack) to concrete cards picked at random from the pool.
 * @param {object[]} pool - edition pool from generateEdition
 * @param {string[]} rarities - rarity ids, one per card slot
 * @param {() => number} rng
 */
export function drawCards(pool, rarities, rng = Math.random) {
  const byRarity = pool.reduce((acc, c) => {
    (acc[c.rarity] ||= []).push(c);
    return acc;
  }, {});
  return rarities.map((rarity) => {
    const candidates = byRarity[rarity] || pool;
    return candidates[Math.floor(rng() * candidates.length)];
  });
}
