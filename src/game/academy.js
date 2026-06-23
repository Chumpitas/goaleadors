// Akademija (Youth Academy, §10.3) — generiše domaće omladinske karte iz aktivne edicije.
import { createCard, attributesForPosition } from './cards.js';
import { computeOverall } from './overall.js';
import { POSITIONS } from './constants.js';
import { INDIVIDUAL_ABILITIES, AURA_ABILITIES, SITUATIONAL_ABILITIES } from './abilities.js';
import { randInt, pick } from './rng.js';

/** Udio domaćih igrača (§10.3: 85–90% domaći). */
export const DOMESTIC_RATE = 0.875;

const FOREIGN_NATIONS = ['Srbija', 'Hrvatska', 'Bosna', 'Španija', 'Engleska', 'Italija', 'Njemačka', 'Francuska'];
const FIRST = ['Marko', 'Luka', 'Stefan', 'Ivan', 'Nikola', 'Aleksa', 'Filip', 'Petar', 'Vuk', 'Lazar'];
const LAST = ['Vidić', 'Pavić', 'Kovač', 'Jurić', 'Babić', 'Marić', 'Novak', 'Ilić', 'Perić', 'Tomić'];

/**
 * Nivoi akademije (§10.3): broj karata/sezona, raritet pravila i OVR raspon.
 * `rareChance`/`epicChance` su vjerovatnoće po karti; `guaranteedRare` osigurava bar jednu.
 */
export const ACADEMY_LEVELS = Object.freeze({
  1: { cards: 2, ovr: [55, 65], rareChance: 0, epicChance: 0, guaranteedRare: false },
  2: { cards: 3, ovr: [60, 70], rareChance: 0, epicChance: 0, guaranteedRare: false },
  3: { cards: 3, ovr: [60, 75], rareChance: 0.35, epicChance: 0, guaranteedRare: false },
  4: { cards: 4, ovr: [65, 82], rareChance: 0.5, epicChance: 0, guaranteedRare: true },
  5: { cards: 5, ovr: [70, 90], rareChance: 0.5, epicChance: 0.2, guaranteedRare: false },
});

const POS_LIST = [POSITIONS.GK, POSITIONS.DEF, POSITIONS.MID, POSITIONS.ATT];

function nationality(country, rng) {
  if (country && rng() < DOMESTIC_RATE) return country;
  const foreign = FOREIGN_NATIONS.filter((n) => n !== country);
  return pick(rng, foreign);
}

function abilitiesFor(position, rarity, rng) {
  const ind = INDIVIDUAL_ABILITIES.filter((a) => a.positions.includes('any') || a.positions.includes(position));
  if (rarity === 'rare') return ind.length ? [pick(rng, ind).id] : [];
  if (rarity === 'epic') {
    const ids = [];
    if (ind.length) ids.push(pick(rng, ind).id);
    ids.push(pick(rng, [...AURA_ABILITIES, ...SITUATIONAL_ABILITIES]).id);
    return [...new Set(ids)];
  }
  return []; // common
}

/** Napravi jednu omladinsku kartu ciljanog OVR-a (pomak svih atributa do cilja). */
function makeYouthCard(position, rarity, ovrBand, country, editionCode, rng) {
  const keys = attributesForPosition(position);
  const target = randInt(rng, ovrBand[0], ovrBand[1]);

  // Kreni od atributa oko cilja, pa pomakni sve da OVR pogodi cilj (težine sumiraju 1.0).
  const attrs = {};
  for (const k of keys) attrs[k] = clamp(target + randInt(rng, -8, 8), 1, 100);
  const probe = computeOverall({ position, attributes: attrs });
  const shift = target - probe;
  for (const k of keys) attrs[k] = clamp(attrs[k] + shift, 1, 100);

  return createCard({
    name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
    position,
    rarity,
    nationality: nationality(country, rng),
    editionId: editionCode,
    attributes: attrs,
    abilities: abilitiesFor(position, rarity, rng),
  });
}

function rollRarity(cfg, rng) {
  if (cfg.epicChance && rng() < cfg.epicChance) return 'epic';
  if (cfg.rareChance && rng() < cfg.rareChance) return 'rare';
  return 'common';
}

/**
 * Generiši omladinske karte za zadati nivo akademije (§10.3).
 * @param {number} level - 1..5
 * @param {object} opts
 * @param {string} [opts.country] - država kluba (za domaći bias)
 * @param {string} [opts.editionCode='foundations'] - aktivna edicija
 * @param {() => number} [opts.rng]
 * @returns {object[]} karte
 */
export function generateYouth(level, { country, editionCode = 'foundations', rng = Math.random } = {}) {
  const cfg = ACADEMY_LEVELS[level];
  if (!cfg) throw new Error(`Nepoznat nivo akademije: ${level}`);

  const cards = [];
  for (let i = 0; i < cfg.cards; i++) {
    const position = pick(rng, POS_LIST);
    let rarity = rollRarity(cfg, rng);
    // Garantovana Rare: posljednja karta postaje Rare ako nijedna nije.
    if (cfg.guaranteedRare && i === cfg.cards - 1 && !cards.some((c) => c.rarity !== 'common')) {
      rarity = 'rare';
    }
    cards.push(makeYouthCard(position, rarity, cfg.ovr, country, editionCode, rng));
  }
  return cards;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
