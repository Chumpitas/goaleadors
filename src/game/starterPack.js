// Starter pack po registraciji (§7) — besplatno.
import { pick } from './rng.js';
import { createCard } from './cards.js';

const CDN = 'https://d8j0ntlcm91z4.cloudfront.net/user_2zCFsJmlhH6t01iCupOrbjaSRvW';

/** Garantovane karte koje svaki igrač dobija u starter packu. */
export const GUARANTEED_CARDS = [
  Object.assign(createCard({
    name: 'Carlos Eduardo Ferreira',
    position: 'ATT',
    rarity: 'rare',
    nationality: 'Brazil',
    editionId: 'foundations',
    attributes: { shooting: 60, passing: 62, tackling: 64, pace: 47 },
    abilities: ['veteran_presence'],
  }), { image: `${CDN}/hf_20260625_010348_3f3e9c6e-ae64-43a9-ad3e-ac9970038edd.png` }),
];

/**
 * Sastav starter postave (§7), po poziciji/raritetu.
 *
 * NAPOMENA o spec-u: §7 je interno nekonzistentan (raspored po pozicijama = 19,
 * sumarno "25"). Po odluci vlasnika dodato je +1 Common po poziciji u odnosu na
 * raspored po pozicijama -> ukupno 17 Common, 5 Rare, 1 Epic = 23 karte.
 */
export const STARTER_COMPOSITION = Object.freeze([
  { position: 'GK', common: 3, rare: 0, epic: 0 },
  { position: 'DEF', common: 5, rare: 2, epic: 0 },
  { position: 'MID', common: 5, rare: 2, epic: 0 },
  { position: 'ATT', common: 4, rare: 1, epic: 1 },
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
  const cards = [...GUARANTEED_CARDS];
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
