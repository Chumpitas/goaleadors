// Trening centar (§10.4) — aktivni i pasivni razvoj karata.
import { OUTFIELD_ATTRIBUTES, GK_ATTRIBUTES } from './constants.js';
import { computeOverall } from './overall.js';
import { attributesForPosition } from './cards.js';
import { randInt } from './rng.js';

/** Pasivni boost svim kartama po nivou trening centra (§10.4). */
export const PASSIVE_BOOST_BY_LEVEL = Object.freeze({ 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 });

/** Aktivni trening: +3–5 na fokus stat nakon jedne sezone (§10.4). */
export const ACTIVE_BOOST_RANGE = Object.freeze([3, 5]);

/** Maksimalni ukupni boost po karti (§10.4). */
export const MAX_TRAINING_BOOST = 10;

/** Cijena jednog aktivnog treninga u Kovanicama (§6.2 "treniranje karata"). */
export const TRAINING_COST_KOVANICE = 1500;

/** Validni fokus atributi za poziciju karte. */
export function focusOptions(position) {
  return position === 'GK' ? GK_ATTRIBUTES : OUTFIELD_ATTRIBUTES;
}

/**
 * Aktivni trening: pojačaj jedan stat karte za rolovani iznos (3–5),
 * uz poštovanje max ukupnog boosta (+10) i granice atributa (100).
 *
 * @returns {{ card: object, applied: number, totalBoost: number, capped: boolean }}
 */
export function trainCard(card, focusAttr, rng = Math.random) {
  if (!focusOptions(card.position).includes(focusAttr)) {
    throw new Error(`Nevažeći fokus '${focusAttr}' za poziciju ${card.position}`);
  }

  const totalBoost = card.trainingBoost ?? 0;
  const remaining = MAX_TRAINING_BOOST - totalBoost;
  if (remaining <= 0) {
    return { card, applied: 0, totalBoost, capped: true };
  }

  const rolled = randInt(rng, ACTIVE_BOOST_RANGE[0], ACTIVE_BOOST_RANGE[1]);
  const current = card.attributes[focusAttr] ?? 0;
  const byCap = Math.min(rolled, remaining); // ukupni boost cap
  const applied = Math.min(byCap, 100 - current); // granica atributa

  const next = {
    ...card,
    attributes: { ...card.attributes, [focusAttr]: current + applied },
    trainingBoost: totalBoost + applied,
  };
  next.overall = computeOverall(next);

  return { card: next, applied, totalBoost: next.trainingBoost, capped: next.trainingBoost >= MAX_TRAINING_BOOST };
}

/**
 * Pasivni boost: dodaj +N svim važećim atributima karte (privremeni prikaz tima).
 * Ne broji se u trainingBoost cap (pasivno je efekat objekta, ne trajni stat).
 */
export function applyPassiveBoost(card, level) {
  const boost = PASSIVE_BOOST_BY_LEVEL[level] ?? 0;
  if (!boost) return card;
  const keys = attributesForPosition(card.position);
  const attributes = { ...card.attributes };
  for (const k of keys) attributes[k] = Math.min(100, (attributes[k] ?? 0) + boost);
  const next = { ...card, attributes };
  next.overall = computeOverall(next);
  return next;
}
