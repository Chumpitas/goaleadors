// Card model + helpers (§2.x).
import { POSITIONS, OUTFIELD_ATTRIBUTES, GK_ATTRIBUTES, rarityById } from './constants.js';
import { computeOverall } from './overall.js';
import { abilityById } from './abilities.js';

/** Which attribute keys are valid for a given position. */
export function attributesForPosition(position) {
  return position === POSITIONS.GK ? GK_ATTRIBUTES : OUTFIELD_ATTRIBUTES;
}

export function isGoalkeeper(card) {
  return card.position === POSITIONS.GK;
}

/**
 * Build a card object. Fills missing attributes with 0 and computes OVERALL.
 * @param {object} input
 * @param {string} input.name
 * @param {string} input.position - one of POSITIONS
 * @param {string} input.rarity   - rarity id (common|rare|epic|legendary)
 * @param {string} [input.nationality]
 * @param {object} input.attributes - 0–100 values keyed by attribute
 * @param {string[]} [input.abilities] - ability ids
 * @param {string} [input.editionId]
 */
export function createCard(input) {
  const rarity = rarityById(input.rarity);
  if (!rarity) throw new Error(`Unknown rarity: ${input.rarity}`);
  if (!Object.values(POSITIONS).includes(input.position)) {
    throw new Error(`Unknown position: ${input.position}`);
  }

  const validKeys = attributesForPosition(input.position);
  const attributes = {};
  for (const key of validKeys) {
    attributes[key] = clamp(input.attributes?.[key] ?? 0, 0, 100);
  }

  const abilities = (input.abilities || [])
    .map(abilityById)
    .filter(Boolean);

  if (abilities.length > rarity.abilitySlots) {
    throw new Error(
      `${rarity.label} card allows ${rarity.abilitySlots} ability slot(s), got ${abilities.length}`
    );
  }

  const card = {
    name: input.name,
    position: input.position,
    rarity: rarity.id,
    nationality: input.nationality ?? null,
    editionId: input.editionId ?? null,
    attributes,
    abilities,
  };
  card.overall = computeOverall(card);
  return card;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
