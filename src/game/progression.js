// Dnevni progression loop (§12) — izazovi, streak, sezonski pass.
import { pick } from './rng.js';

/** Streak nagrade (§12.3). */
export const STREAK_REWARDS = Object.freeze({
  3: { pack: 'srebrna', label: 'Mala bonus kesica' },
  7: { pack: 'zlatna', label: 'Zlatna kesica' },
  30: { pack: 'dijamantska', cosmetic: true, label: 'Dijamantska kesica + kosmetika' },
});

export function streakReward(day) {
  return STREAK_REWARDS[day] || null;
}

/** Dnevni izazovi (§12.2). Nagrada: { kovanice?, pack?, cardRarity? }. */
export const DAILY_CHALLENGES = Object.freeze([
  { id: 'win3', desc: 'Pobijedi s 3+ gola razlike', reward: { kovanice: 800 } },
  { id: 'nat3', desc: 'Odigraj s 3 igrača iste nacionalnosti', reward: { pack: 'srebrna' } },
  { id: 'subs2', desc: 'Izvedi 2 izmjene tokom meča', reward: { kovanice: 400 } },
  { id: 'upset', desc: 'Pobijedi protivnika višeg overall ratinga', reward: { kovanice: 1200, cardRarity: 'rare' } },
]);

/** Izaberi `n` različitih dnevnih izazova (§12.1: 1–2 dnevno). */
export function dailyChallengeSet(rng = Math.random, n = 2) {
  const pool = [...DAILY_CHALLENGES];
  const out = [];
  while (out.length < n && pool.length) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out.map((c) => ({ ...c, done: false }));
}

/**
 * Sezonski pass — 4 sedmice, free + premium track (§12.4).
 * Nagrade: { kovanice?, pack?, count?, cardRarity? }.
 */
export const SEASON_PASS_WEEKS = Object.freeze([
  { week: 1, free: { pack: 'srebrna', count: 2 }, premium: { pack: 'zlatna', count: 2, cardRarity: 'rare' } },
  { week: 2, free: { kovanice: 3000 }, premium: { pack: 'dijamantska', kovanice: 5000 } },
  { week: 3, free: { pack: 'srebrna' }, premium: { pack: 'zlatna', cardRarity: 'epic' } },
  { week: 4, free: { kovanice: 5000 }, premium: { pack: 'elite', cardRarity: 'legendary' } },
]);

/** Cijena premium passa u Lopticama (§6.4). */
export const PREMIUM_PASS_COST_LOPTE = 400;

/** Čitljiv opis nagrade. */
export function describeReward(r = {}) {
  const parts = [];
  if (r.kovanice) parts.push(`${r.kovanice.toLocaleString('sr')} 🪙`);
  if (r.lopte) parts.push(`${r.lopte} ⚽`);
  if (r.pack) parts.push(`${r.count && r.count > 1 ? `${r.count}× ` : ''}${r.pack} kesica`);
  if (r.cardRarity) parts.push(`${r.cardRarity} karta`);
  if (r.cosmetic) parts.push('kosmetika');
  return parts.join(' + ') || '—';
}
