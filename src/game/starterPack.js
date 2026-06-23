// Starter pack po registraciji (§7) — besplatno.
import { pick } from './rng.js';

/**
 * Sastav starter postave (§7), po poziciji/raritetu.
 *
 * NAPOMENA o spec-u: §7 je interno nekonzistentan. Raspored po pozicijama
 * (GK×2, DEF×6, MID×6, ATT×5) daje 13 Common, 5 Rare, 1 Epic = 19 karata,
 * dok sumarna linija tvrdi "19 Common, 5 Rare, 1 Epic = 25". Pratimo detaljni
 * raspored po pozicijama (4 interno konzistentne linije) -> 19 karata.
 */
export const STARTER_COMPOSITION = Object.freeze([
  { position: 'GK', common: 2, rare: 0, epic: 0 },
  { position: 'DEF', common: 4, rare: 2, epic: 0 },
  { position: 'MID', common: 4, rare: 2, epic: 0 },
  { position: 'ATT', common: 3, rare: 1, epic: 1 },
]);

/** Ostali starter benefiti (§7). */
export const STARTER_BONUS = Object.freeze({
  kovanice: 500,
  packs: ['zlatna'], // 1 Zlatna kesica za otvaranje
  stadiumCap: 2000, // starter stadion
});

/** Izvuci jednu kartu zadate pozicije i rariteta iz poola. */
function drawOne(pool, position, rarity, rng) {
  const candidates = pool.filter((c) => c.position === position && c.rarity === rarity);
  if (!candidates.length) return null;
  return pick(rng, candidates);
}

/**
 * Generiši 25 starter karata iz edition poola prema STARTER_COMPOSITION.
 * @returns {object[]} karte (mogu se ponavljati definicije ako je pool malen)
 */
export function grantStarterCards(pool, rng = Math.random) {
  const cards = [];
  for (const row of STARTER_COMPOSITION) {
    for (const [rarity, count] of [['common', row.common], ['rare', row.rare], ['epic', row.epic]]) {
      for (let i = 0; i < count; i++) {
        const card = drawOne(pool, row.position, rarity, rng);
        if (card) cards.push(card);
      }
    }
  }
  return cards;
}

/** Ukupan broj karata u starter packu (radi provjere = 25). */
export function starterCardCount() {
  return STARTER_COMPOSITION.reduce((s, r) => s + r.common + r.rare + r.epic, 0);
}
