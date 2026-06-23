// Trade tržište (§5.4) — transfer listing, kupovina, 5% trade fee (sink),
// te poseban Legacy tržište za penzionisane (kolekcionarske) karte.
import { randInt, pick } from './rng.js';

/** Trade fee koji ide u igru kao valuta sink (§5.4). */
export const TRADE_FEE_PCT = 5;

/** Neto prihod prodavca nakon fee-a. */
export function netProceeds(price) {
  return Math.floor(price * (1 - TRADE_FEE_PCT / 100));
}

export function feeAmount(price) {
  return price - netProceeds(price);
}

const BASE_PRICE = { common: 200, rare: 800, epic: 2500, legendary: 8000 };

/** Preporučena cijena karte prema raritetu i OVERALL-u. */
export function suggestedPrice(card) {
  const base = BASE_PRICE[card.rarity] ?? 200;
  return Math.max(50, Math.round((base * card.overall) / 70));
}

/** Generiši AI listinge sa tržišta (karte za kupovinu). */
export function generateMarketListings(pool, n, rng = Math.random, { legacy = false } = {}) {
  const out = [];
  const used = new Set();
  for (let i = 0; i < n && pool.length; i++) {
    let card;
    let guard = 0;
    do {
      card = pick(rng, pool);
      guard += 1;
    } while (used.has(card) && guard < 20);
    used.add(card);
    const sp = suggestedPrice(card);
    const price = Math.max(50, Math.round((sp * (0.85 + rng() * 0.4)) / 10) * 10); // ±, zaokruženo na 10
    out.push({ id: `lst-${Date.now()}-${i}-${randInt(rng, 0, 1e6)}`, card, price, legacy });
  }
  return out;
}
