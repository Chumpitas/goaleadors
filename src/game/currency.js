// Valutni sistem (§6): Lopte (premium) i Kovanice (free).
import { randInt } from './rng.js';

export const CURRENCIES = Object.freeze({
  LOPTE: 'lopte', // premium, kupuje se pravim novcem
  KOVANICE: 'kovanice', // free, zarađuje se igranjem
});

/** Zarada Kovanica po izvoru (§6.2). Rasponi se rolaju nasumično. */
export const KOVANICE_REWARDS = Object.freeze({
  win: [500, 2000],
  draw: [200, 800],
  loss: [50, 100],
  leagueWin: [25000, 25000],
  clWin: [100000, 100000],
  dailyLogin: [100, 300],
  dailyChallenge: [500, 1500],
  sponsor: [2000, 2000],
});

/** Roll nagrade u Kovanicama za zadati izvor. */
export function rollKovanice(source, rng = Math.random) {
  const range = KOVANICE_REWARDS[source];
  if (!range) throw new Error(`Nepoznat izvor nagrade: ${source}`);
  return randInt(rng, range[0], range[1]);
}

/** Nagrada za ishod meča ('win'|'draw'|'loss'). */
export function matchReward(outcome, rng = Math.random) {
  return rollKovanice(outcome, rng);
}

/** Paketi Loptica za kupovinu pravim novcem (§6.3). `lopte` = base + bonus. */
export const LOPTE_BUNDLES = Object.freeze([
  { id: 'starter', base: 100, bonus: 0, eur: 0.99 },
  { id: 'small', base: 300, bonus: 0, eur: 2.99 },
  { id: 'medium', base: 700, bonus: 50, eur: 6.99 },
  { id: 'large', base: 1500, bonus: 150, eur: 14.99 },
  { id: 'xl', base: 3500, bonus: 500, eur: 29.99 },
  { id: 'mega', base: 8000, bonus: 1500, eur: 59.99 },
]);

export function bundleLopte(bundle) {
  return bundle.base + bundle.bonus;
}

/** Cijene u Lopticama za razne stavke (§6.4). */
export const LOPTE_COSTS = Object.freeze({
  speedBuildHour: 10,
  speedScoutHour: 8,
  veteranToken: 300,
  legendaryStadium: 2000,
  legendaryCrest: 500,
  legendaryKit: 300,
  seasonPass: 400,
});

/** Da li balans pokriva trošak. */
export function canAfford(balance, amount) {
  return balance >= amount;
}

/**
 * Primijeni transakciju na balanse. Vraća novi snapshot + zapis za ledger.
 * @param {{lopte:number, kovanice:number}} balances
 * @param {string} currency - CURRENCIES.*
 * @param {number} amount - predznak: + kredit, - debit
 * @param {string} reason
 */
export function applyTransaction(balances, currency, amount, reason) {
  if (currency !== CURRENCIES.LOPTE && currency !== CURRENCIES.KOVANICE) {
    throw new Error(`Nepoznata valuta: ${currency}`);
  }
  const next = balances[currency] + amount;
  if (next < 0) {
    return { ok: false, balances, entry: null };
  }
  return {
    ok: true,
    balances: { ...balances, [currency]: next },
    entry: { currency, amount, reason, at: Date.now() },
  };
}
