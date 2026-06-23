// Scout mreža (SCOUT_SYSTEM_UPDATE) — misije koje pronalaze mlade TALENTE.
// Više NE traži edicijske karte (stari, pogrešan dizajn koji kvari kesica-ekonomiju).
import { POTENTIAL_TYPES, generateTalent } from './talents.js';
import { POSITIONS } from './constants.js';

/** Nivoi scout mreže (SCOUT_SYSTEM_UPDATE). */
export const SCOUT_NETWORK_LEVELS = Object.freeze({
  1: { maxConcurrentScouts: 1, availablePotentialTypes: ['fast', 'standard'], durationMultiplier: 1.0, bonusTalentChance: 0, regionTargeting: false },
  2: { maxConcurrentScouts: 2, availablePotentialTypes: ['fast', 'standard'], durationMultiplier: 0.85, bonusTalentChance: 0, regionTargeting: false },
  3: { maxConcurrentScouts: 3, availablePotentialTypes: ['fast', 'standard', 'high'], durationMultiplier: 0.75, bonusTalentChance: 0, regionTargeting: false },
  4: { maxConcurrentScouts: 4, availablePotentialTypes: ['fast', 'standard', 'high'], durationMultiplier: 0.65, bonusTalentChance: 0.15, regionTargeting: false },
  5: { maxConcurrentScouts: 5, availablePotentialTypes: ['fast', 'standard', 'high', 'exceptional'], durationMultiplier: 0.55, bonusTalentChance: 0.25, regionTargeting: true },
});

export function networkLevel(level) {
  const n = SCOUT_NETWORK_LEVELS[level];
  if (!n) throw new Error(`Nepoznat nivo scout mreže: ${level}`);
  return n;
}

export function maxConcurrentScouts(level) {
  return networkLevel(level).maxConcurrentScouts;
}

export function availablePotentials(level) {
  return networkLevel(level).availablePotentialTypes;
}

export function regionTargetingAllowed(level) {
  return networkLevel(level).regionTargeting;
}

/** Trajanje misije za tip potencijala uz multiplikator nivoa mreže. */
export function missionDurationMs(potentialType, level) {
  const pot = POTENTIAL_TYPES[potentialType];
  if (!pot) throw new Error(`Nepoznat potencijal: ${potentialType}`);
  return Math.round(pot.duration * networkLevel(level).durationMultiplier);
}

export function missionCost(potentialType) {
  const pot = POTENTIAL_TYPES[potentialType];
  if (!pot) throw new Error(`Nepoznat potencijal: ${potentialType}`);
  return pot.cost;
}

/**
 * Pokreni scout misiju za talenta.
 * @param {object} params - { position, potentialType, region? }
 * @param {object} opts - { level, now? }
 */
export function startMission(params, { level = 1, now = Date.now() } = {}) {
  const net = networkLevel(level);
  if (!Object.values(POSITIONS).includes(params.position)) {
    throw new Error(`Nevažeća pozicija: ${params.position}`);
  }
  if (!net.availablePotentialTypes.includes(params.potentialType)) {
    throw new Error(`Potencijal '${params.potentialType}' nije dostupan na nivou ${level}`);
  }
  if (params.region && params.region !== 'any' && !net.regionTargeting) {
    throw new Error(`Ciljanje regije zahtijeva nivo 5`);
  }
  const duration = missionDurationMs(params.potentialType, level);
  return {
    id: `scout-${now}-${Math.floor(Math.random() * 1e6)}`,
    position: params.position,
    region: params.region || 'any',
    potentialType: params.potentialType,
    level,
    startedAt: now,
    completesAt: now + duration,
    status: 'active',
  };
}

export function isComplete(mission, now = Date.now()) {
  return now >= mission.completesAt;
}

export function remainingMs(mission, now = Date.now()) {
  return Math.max(0, mission.completesAt - now);
}

/**
 * Razriješi završenu misiju: roll uspjeha, pa generiši talent(e).
 * Viši nivoi imaju šansu za bonus (2. talent).
 * @returns {{ success: boolean, talents: object[] }}
 */
export function resolveMission(mission, rng = Math.random, now = Date.now()) {
  const pot = POTENTIAL_TYPES[mission.potentialType];
  if (rng() >= pot.successChance) {
    return { success: false, talents: [] };
  }
  const talents = [generateTalent(mission, rng, now)];
  const bonusChance = networkLevel(mission.level).bonusTalentChance;
  if (bonusChance && rng() < bonusChance) {
    talents.push(generateTalent(mission, rng, now));
  }
  return { success: true, talents };
}
