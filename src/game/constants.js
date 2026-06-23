// Goaleadors — core card-system constants.
// Source of truth: docs/GOALEADORS_SPEC.md (sections 2.x, 4.x).

/** The four pitch positions (§2.3). */
export const POSITIONS = Object.freeze({
  GK: 'GK',
  DEF: 'DEF',
  MID: 'MID',
  ATT: 'ATT',
});

/** Outfield attributes (§2.1). Stored on a 0–100 scale. */
export const OUTFIELD_ATTRIBUTES = Object.freeze([
  'shooting',
  'passing',
  'tackling',
  'pace',
]);

/** Goalkeeper attributes (§2.1). */
export const GK_ATTRIBUTES = Object.freeze([
  'reflexes',
  'positioning',
  'passing',
  'pace',
]);

/**
 * Rarity definitions (§2.5).
 * `pullChance` is the per-card probability in a Zlatna (Gold) pack (§5.2).
 * `abilitySlots` is the number of special abilities the card carries (§2.6).
 */
export const RARITIES = Object.freeze({
  COMMON: {
    id: 'common',
    label: 'Common',
    color: 'Siva', // gray
    hex: '#9aa0a6',
    abilitySlots: 0,
    boostedStats: false,
    pullChance: 0.6,
  },
  RARE: {
    id: 'rare',
    label: 'Rare',
    color: 'Zlatna', // gold
    hex: '#e0a01e',
    abilitySlots: 1,
    boostedStats: false,
    pullChance: 0.3,
  },
  EPIC: {
    id: 'epic',
    label: 'Epic',
    color: 'Ljubičasta', // purple
    hex: '#8b3fd1',
    abilitySlots: 2,
    boostedStats: false,
    pullChance: 0.09,
  },
  LEGENDARY: {
    id: 'legendary',
    label: 'Legendary',
    color: 'Crvena', // red
    hex: '#d63a3a',
    abilitySlots: 2,
    boostedStats: true, // "2 + boosted stats" (§2.5)
    pullChance: 0.01,
  },
});

/** Lookup rarity definition by its id. */
export function rarityById(id) {
  return Object.values(RARITIES).find((r) => r.id === id) || null;
}

/** Card-pool composition for one edition (§4.4): 110 unique cards. */
export const EDITION_POOL = Object.freeze({
  byRarity: { common: 60, rare: 30, epic: 15, legendary: 5 },
  byPosition: { GK: 10, DEF: 30, MID: 35, ATT: 35 },
  total: 110,
});

/** Edition themes that shape the meta (§4.3). */
export const EDITION_THEMES = Object.freeze([
  'Foundations',
  'Speed',
  'Titans',
  'Maestros',
  'Dark Horse',
]);
