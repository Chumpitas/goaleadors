// Scout mreža (§10.5) — ciljana potraga karata kroz vremenske misije.
import { POSITIONS } from './constants.js';
import { rarityById } from './constants.js';
import { LOPTE_COSTS } from './currency.js';

const HOUR_MS = 3600 * 1000;

/** Trajanje misije po raritetu fokusa (§10.5). */
export const SCOUT_DURATION_HOURS = Object.freeze({ common: 4, rare: 12, epic: 48, legendary: 168 });

/** Broj istovremenih skauta po nivou mreže (§10.5: nivo 1→1, 3→3, 5→5). */
export const SCOUT_SLOTS_BY_LEVEL = Object.freeze({ 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 });

/** Od nivoa 5 skaut može tražiti i specifičan special ability (§10.5). */
export const ABILITY_SEARCH_LEVEL = 5;

export function scoutSlots(level) {
  return SCOUT_SLOTS_BY_LEVEL[level] ?? 1;
}

export function missionDurationMs(rarityFocus) {
  const h = SCOUT_DURATION_HOURS[rarityFocus];
  if (!h) throw new Error(`Nepoznat raritet fokus: ${rarityFocus}`);
  return h * HOUR_MS;
}

/**
 * Pokreni scout misiju.
 * @param {object} params - { position, rarityFocus, minOverall?, nationality?, ability? }
 * @param {object} opts - { level, now? }
 * @returns {object} misija
 */
export function startMission(params, { level = 1, now = Date.now() } = {}) {
  if (!Object.values(POSITIONS).includes(params.position)) {
    throw new Error(`Nevažeća pozicija: ${params.position}`);
  }
  if (!rarityById(params.rarityFocus)) {
    throw new Error(`Nevažeći raritet fokus: ${params.rarityFocus}`);
  }
  if (params.ability && level < ABILITY_SEARCH_LEVEL) {
    throw new Error(`Traženje ability-ja zahtijeva nivo ${ABILITY_SEARCH_LEVEL}+`);
  }
  const min = params.minOverall ?? 0;
  if (min < 0 || min > 100) throw new Error('minOverall mora biti 0–100');

  const duration = missionDurationMs(params.rarityFocus);
  return {
    id: `scout-${now}-${Math.floor(Math.random() * 1e6)}`,
    params: { ...params, minOverall: min },
    level,
    startedAt: now,
    durationMs: duration,
    finishesAt: now + duration,
  };
}

export function isComplete(mission, now = Date.now()) {
  return now >= mission.finishesAt;
}

export function remainingMs(mission, now = Date.now()) {
  return Math.max(0, mission.finishesAt - now);
}

/** Cijena ubrzanja u Lopticama: preostali sati × stopa (§6.4 speedScoutHour). */
export function speedUpCost(mission, now = Date.now()) {
  const hours = Math.ceil(remainingMs(mission, now) / HOUR_MS);
  return Math.max(0, hours) * LOPTE_COSTS.speedScoutHour;
}

/**
 * Razriješi završenu misiju u kartu iz poola prema parametrima.
 * Ublažava ograničenja redom ako nema kandidata. Viši nivo → bolji rezultati.
 * @returns {object|null} izabrana karta
 */
export function resolveMission(mission, pool, rng = Math.random) {
  const p = mission.params;
  const base = pool.filter((c) => c.position === p.position);

  // Lanac filtera od najstrožeg ka najblažem.
  const filters = [
    (c) => c.rarity === p.rarityFocus && c.overall >= p.minOverall && matchNat(c, p) && matchAbility(c, p),
    (c) => c.rarity === p.rarityFocus && c.overall >= p.minOverall && matchNat(c, p),
    (c) => c.rarity === p.rarityFocus && c.overall >= p.minOverall,
    (c) => c.rarity === p.rarityFocus,
    () => true,
  ];

  let candidates = [];
  for (const f of filters) {
    candidates = base.filter(f);
    if (candidates.length) break;
  }
  if (!candidates.length) candidates = pool.slice();

  // Bolji rezultati na višem nivou: suzi prozor ka vrhu po OVR-u.
  const sorted = [...candidates].sort((a, b) => b.overall - a.overall);
  const window = Math.max(1, Math.round(sorted.length * (1 - (mission.level - 1) * 0.18)));
  return sorted[Math.floor(rng() * Math.min(window, sorted.length))];
}

function matchNat(card, params) {
  return !params.nationality || card.nationality === params.nationality;
}

function matchAbility(card, params) {
  if (!params.ability) return true;
  return (card.abilities || []).some((a) => a.id === params.ability);
}
