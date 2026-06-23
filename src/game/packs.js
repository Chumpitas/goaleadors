// Kesice (packs) — definitions, pull odds, guarantees and pity (§5).
//
// Only the Zlatna pull odds are pinned by the spec (§5.2):
//   Common 60% / Rare 30% / Epic 9% / Legendary 1%.
// Odds for the other packs are reasonable, clearly-marked defaults that respect
// each pack's stated guarantee (§5.1); tune them once design pins them down.

import { RARITIES } from './constants.js';

/** Rarity ordering, weakest → strongest. Used for guarantee upgrades. */
export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

/** Pull odds pinned by §5.2 (Zlatna kesica). */
export const ZLATNA_ODDS = Object.freeze({ common: 0.6, rare: 0.3, epic: 0.09, legendary: 0.01 });

/**
 * Pack catalog (§5.1).
 *  - `cards`        : number of cards per pack
 *  - `guarantee`    : minimum count per rarity that must appear
 *  - `odds`         : rarity weights for random slots (need not sum to exactly 1)
 *  - `pityEligible` : whether the 50-pack pity guarantee can trigger here (§5.3)
 *  - prices in Lopte / Kovanice (null = not purchasable with that currency)
 */
export const PACKS = Object.freeze({
  srebrna: {
    code: 'srebrna',
    name: 'Srebrna',
    cards: 5,
    guarantee: { common: 3 },
    odds: { common: 0.78, rare: 0.19, epic: 0.027, legendary: 0.003 }, // default, not spec-pinned
    pityEligible: false,
    priceLopte: 50,
    priceKovanice: 2000,
  },
  zlatna: {
    code: 'zlatna',
    name: 'Zlatna',
    cards: 5,
    guarantee: { rare: 1 },
    odds: { ...ZLATNA_ODDS }, // §5.2
    pityEligible: false,
    priceLopte: 150,
    priceKovanice: 6000,
  },
  dijamantska: {
    code: 'dijamantska',
    name: 'Dijamantska',
    cards: 8,
    guarantee: { epic: 1 },
    odds: { common: 0.45, rare: 0.35, epic: 0.16, legendary: 0.04 }, // default, not spec-pinned
    pityEligible: true,
    priceLopte: 400,
    priceKovanice: 18000,
  },
  elite: {
    code: 'elite',
    name: 'Elite',
    cards: 5,
    guarantee: { legendary: 1 },
    odds: { common: 0.3, rare: 0.4, epic: 0.22, legendary: 0.08 }, // default, not spec-pinned
    pityEligible: true,
    priceLopte: 1200,
    priceKovanice: null, // "Nije dostupna" za Kovanice (§5.1)
  },
});

/** Pity threshold: packs opened without a Legendary before pity kicks in (§5.3). */
export const PITY_THRESHOLD = 50;

export function packByCode(code) {
  return PACKS[code] || null;
}

/** Weighted random rarity pick. */
function pickRarity(odds, rng) {
  const total = Object.values(odds).reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (const rarity of RARITY_ORDER) {
    const w = odds[rarity] ?? 0;
    if (roll < w) return rarity;
    roll -= w;
  }
  return RARITY_ORDER[0]; // numerical fallback
}

/**
 * Quality-floor guarantee: ensure at least `min` cards are `rarity` OR BETTER
 * (e.g. "min 1 Rare" is satisfied by an Epic). Upgrades the weakest below-target
 * slots so we never downgrade a lucky pull.
 */
function ensureQualityFloor(rarities, rarity, min) {
  const targetRank = RARITY_ORDER.indexOf(rarity);
  const count = () => rarities.filter((r) => RARITY_ORDER.indexOf(r) >= targetRank).length;
  while (count() < min) {
    let weakestIdx = -1;
    let weakestRank = Infinity;
    for (let i = 0; i < rarities.length; i++) {
      const rank = RARITY_ORDER.indexOf(rarities[i]);
      if (rank < targetRank && rank < weakestRank) {
        weakestRank = rank;
        weakestIdx = i;
      }
    }
    if (weakestIdx === -1) break;
    rarities[weakestIdx] = rarity;
  }
}

/**
 * Exact-count floor: ensure at least `min` cards are EXACTLY `rarity`. Used for a
 * guarantee on the lowest tier (Srebrna "min 3 Common"), which can only be met by
 * downgrading the strongest surplus slots.
 */
function ensureExactFloor(rarities, rarity, min) {
  const count = () => rarities.filter((r) => r === rarity).length;
  while (count() < min) {
    let strongestIdx = -1;
    let strongestRank = -1;
    for (let i = 0; i < rarities.length; i++) {
      if (rarities[i] === rarity) continue;
      const rank = RARITY_ORDER.indexOf(rarities[i]);
      if (rank > strongestRank) {
        strongestRank = rank;
        strongestIdx = i;
      }
    }
    if (strongestIdx === -1) break;
    rarities[strongestIdx] = rarity;
  }
}

/**
 * Apply a guarantee. A floor on the lowest tier is an exact-count floor (downgrade);
 * a floor on any higher tier is a quality floor (upgrade, "or better").
 */
function enforceMinimum(rarities, rarity, min) {
  if (rarity === RARITY_ORDER[0]) ensureExactFloor(rarities, rarity, min);
  else ensureQualityFloor(rarities, rarity, min);
}

/**
 * Open a pack: resolve the rarity of each card, applying guarantees and pity.
 *
 * @param {string} packCode
 * @param {object} [opts]
 * @param {() => number} [opts.rng]  - injectable RNG (default Math.random) for tests
 * @param {number} [opts.pity]       - packs opened without a Legendary so far
 * @returns {{ pack: object, rarities: string[], pulledLegendary: boolean, pity: number, pityApplied: boolean }}
 */
export function openPack(packCode, { rng = Math.random, pity = 0 } = {}) {
  const pack = packByCode(packCode);
  if (!pack) throw new Error(`Unknown pack: ${packCode}`);

  const rarities = Array.from({ length: pack.cards }, () => pickRarity(pack.odds, rng));

  // §5.3 pity: at/after the threshold, the next pity-eligible pack guarantees a Legendary.
  const pityApplied = pack.pityEligible && pity >= PITY_THRESHOLD;
  if (pityApplied) enforceMinimum(rarities, 'legendary', 1);

  // §5.1 per-pack guarantees.
  for (const [rarity, min] of Object.entries(pack.guarantee)) {
    enforceMinimum(rarities, rarity, min);
  }

  const pulledLegendary = rarities.includes('legendary');
  // Counter resets on any Legendary, otherwise increments by this pack.
  const nextPity = pulledLegendary ? 0 : pity + 1;

  return { pack, rarities, pulledLegendary, pity: nextPity, pityApplied };
}

/** Convenience: rarity metadata (label/color) for a drawn rarity id. */
export function rarityMeta(rarityId) {
  return Object.values(RARITIES).find((r) => r.id === rarityId);
}
