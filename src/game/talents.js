// Scout talenti (SCOUT_SYSTEM_UPDATE) — mladi talenti, posebna kategorija van kesica.
// Razlike od edicijskih karata: traju 5 sezona, rastu kroz trening, razvijaju
// abilities kroz napredak, nestaju nakon 48h ako se ne potpišu, nisu tradable.
import { INDIVIDUAL_ABILITIES, AURA_ABILITIES, SITUATIONAL_ABILITIES, KONTRA_ABILITIES, abilityById } from './abilities.js';
import { randInt, pick } from './rng.js';

const HOUR_MS = 3600 * 1000;

export const REGIONS = ['europe', 'south_america', 'africa', 'asia'];

/** Tipovi potencijala — trajanje misije, šansa uspjeha, start OVR, maksimalni plafon, cijena. */
export const POTENTIAL_TYPES = Object.freeze({
  fast: { id: 'fast', duration: 6 * HOUR_MS, successChance: 0.8, startOVRRange: [50, 60], maxOVRCeiling: 78, cost: 1000 },
  standard: { id: 'standard', duration: 12 * HOUR_MS, successChance: 0.65, startOVRRange: [45, 58], maxOVRCeiling: 85, cost: 2500 },
  high: { id: 'high', duration: 24 * HOUR_MS, successChance: 0.4, startOVRRange: [43, 55], maxOVRCeiling: 92, cost: 5000 },
  exceptional: { id: 'exceptional', duration: 72 * HOUR_MS, successChance: 0.15, startOVRRange: [42, 52], maxOVRCeiling: 99, cost: 12000 },
});

/** Cijena potpisa talenta po potencijalu (Kovanice). */
export const SIGNING_COSTS = Object.freeze({ fast: 800, standard: 1500, high: 3000, exceptional: 8000 });

/** Rast OVR-a po sezoni ovisno o trening statusu. */
export const GROWTH_RATES = Object.freeze({ no_training: 2, training: 5, focus: 8 });

/** Proporcionalni rast statova po poziciji. */
export const POSITION_WEIGHTS = Object.freeze({
  ATT: { shooting: 0.5, passing: 0.2, tackling: 0.05, pace: 0.25 },
  MID: { shooting: 0.25, passing: 0.4, tackling: 0.15, pace: 0.2 },
  DEF: { shooting: 0.1, passing: 0.2, tackling: 0.45, pace: 0.25 },
  GK: { shooting: 0.0, passing: 0.15, tackling: 0.0, pace: 0.05 },
});

/** Milestoni za otključavanje abilities kroz rast OVR-a. */
export const ABILITY_MILESTONES = Object.freeze([
  { ovrThreshold: 65, category: 'individual', chance: 1.0 },
  { ovrThreshold: 75, category: 'individual', chance: 0.6 },
  { ovrThreshold: 85, category: 'aura_or_situational', chance: 0.3 },
  { ovrThreshold: 90, category: 'counter', chance: 0.1 },
]);

/** Broj trening slotova za talente po nivou trening centra. */
export const TALENT_TRAINING_SLOTS = Object.freeze({ 1: 0, 2: 0, 3: 1, 4: 2, 5: 3 });
export const MAX_TALENTS_PER_CLUB = 5;
export const TALENT_AVAILABILITY_WINDOW = 48 * HOUR_MS;
export const TALENT_LIFESPAN_SEASONS = 5;

const NATIONS = {
  europe: ['Srbija', 'Hrvatska', 'Bosna', 'Španija', 'Engleska', 'Italija', 'Njemačka', 'Francuska'],
  south_america: ['Brazil', 'Argentina', 'Urugvaj', 'Kolumbija', 'Čile'],
  africa: ['Nigerija', 'Senegal', 'Gana', 'Maroko', 'Egipat'],
  asia: ['Japan', 'Koreja', 'Iran', 'Australija', 'Saudijska Arabija'],
};
const FIRST = ['Marko', 'Luka', 'Adem', 'Diego', 'Kenji', 'Kwame', 'Stefan', 'Mateo', 'Yuki', 'Omar'];
const LAST = ['Vidić', 'Silva', 'Diallo', 'Tanaka', 'Okafor', 'Pérez', 'Kovač', 'Santos', 'Mbaye', 'Khan'];

export function trainingSlotsForLevel(level) {
  return TALENT_TRAINING_SLOTS[level] ?? 0;
}

export function signingCost(potential) {
  const c = SIGNING_COSTS[potential];
  if (c == null) throw new Error(`Nepoznat potencijal: ${potential}`);
  return c;
}

export function ceilingFor(potential) {
  return POTENTIAL_TYPES[potential].maxOVRCeiling;
}

const clampStat = (n) => Math.max(1, Math.min(99, Math.round(n)));

/**
 * Generiši novi talent iz parametara misije.
 * @param {object} params - { position, potentialType, region }
 */
export function generateTalent(params, rng = Math.random, now = Date.now()) {
  const pot = POTENTIAL_TYPES[params.potentialType];
  if (!pot) throw new Error(`Nepoznat potencijal: ${params.potentialType}`);

  const region = params.region && params.region !== 'any' ? params.region : pick(rng, REGIONS);
  const overall = randInt(rng, pot.startOVRRange[0], pot.startOVRRange[1]);

  return {
    id: `talent-${now}-${Math.floor(rng() * 1e6)}`,
    name: `${pick(rng, FIRST)} ${pick(rng, LAST)}`,
    nationality: pick(rng, NATIONS[region]),
    position: params.position,
    region,
    potential: params.potentialType,
    overall,
    shooting: clampStat(overall + randInt(rng, -4, 4)),
    passing: clampStat(overall + randInt(rng, -4, 4)),
    tackling: clampStat(overall + randInt(rng, -4, 4)),
    pace: clampStat(overall + randInt(rng, -4, 4)),
    seasonsRemaining: TALENT_LIFESPAN_SEASONS,
    trainingSlot: null, // null | 1 (standard) | 2 (focus)
    abilities: [],
    discoveredAt: now,
    signedAt: null,
    availableUntil: now + TALENT_AVAILABILITY_WINDOW,
    status: 'available', // available | signed | expired | released
  };
}

function growthForSlot(slot) {
  if (slot === 2) return GROWTH_RATES.focus;
  if (slot === 1) return GROWTH_RATES.training;
  return GROWTH_RATES.no_training;
}

function pickRandomAbility(category, position, rng) {
  let poolList;
  if (category === 'individual') {
    poolList = INDIVIDUAL_ABILITIES.filter((a) => a.positions.includes('any') || a.positions.includes(position));
  } else if (category === 'aura_or_situational') {
    poolList = [...AURA_ABILITIES, ...SITUATIONAL_ABILITIES];
  } else {
    poolList = KONTRA_ABILITIES;
  }
  return poolList.length ? pick(rng, poolList).id : null;
}

/**
 * Provjeri da li je pređen ability milestone i (možda) otključaj ability.
 * @returns {string|null} id otključanog ability-ja
 */
export function checkAbilityMilestone(previousOVR, newOVR, position, rng = Math.random) {
  for (const m of ABILITY_MILESTONES) {
    if (previousOVR < m.ovrThreshold && newOVR >= m.ovrThreshold) {
      if (rng() < m.chance) return pickRandomAbility(m.category, position, rng);
    }
  }
  return null;
}

/**
 * Primijeni sezonski rast: OVR + statovi (do plafona), odbroji sezonu i (možda)
 * otključaj novi ability.
 * @returns {{ talent: object, unlockedAbility: string|null }}
 */
export function applySeasonalGrowth(talent, rng = Math.random) {
  const growth = growthForSlot(talent.trainingSlot);
  const ceiling = ceilingFor(talent.potential);
  const previousOVR = talent.overall;
  const newOVR = Math.min(ceiling, talent.overall + growth);
  const w = POSITION_WEIGHTS[talent.position];

  const unlockedAbility = checkAbilityMilestone(previousOVR, newOVR, talent.position, rng);
  const abilities = unlockedAbility && !talent.abilities.includes(unlockedAbility)
    ? [...talent.abilities, unlockedAbility]
    : talent.abilities;

  return {
    talent: {
      ...talent,
      overall: newOVR,
      seasonsRemaining: talent.seasonsRemaining - 1,
      shooting: clampStat(talent.shooting + growth * w.shooting),
      passing: clampStat(talent.passing + growth * w.passing),
      tackling: clampStat(talent.tackling + growth * w.tackling),
      pace: clampStat(talent.pace + growth * w.pace),
      abilities,
    },
    unlockedAbility,
  };
}

/** Da li je dostupni talent istekao (48h prozor). */
export function isExpired(talent, now = Date.now()) {
  return talent.status === 'available' && talent.availableUntil < now;
}

/** Mapiranje potencijala na raritet (radi boje/tiera pri prikazu). */
const POTENTIAL_TO_RARITY = { fast: 'common', standard: 'rare', high: 'epic', exceptional: 'legendary' };
export function potentialToRarity(potential) {
  return POTENTIAL_TO_RARITY[potential] || 'common';
}

/**
 * Adapter: pretvori talent u "kartu" kompatibilnu s match engine-om i CardView-om.
 * GK talent (čiji su statovi SHO/PAS/TAC/PAC po spec interfejsu) mapira se na
 * GK atribute: REFLEXES/POSITIONING iz `overall`, plus PASSING/PACE talenta.
 */
export function talentToCard(talent) {
  const isGK = talent.position === 'GK';
  const attributes = isGK
    ? { reflexes: talent.overall, positioning: talent.overall, passing: talent.passing, pace: talent.pace }
    : { shooting: talent.shooting, passing: talent.passing, tackling: talent.tackling, pace: talent.pace };

  return {
    name: talent.name,
    position: talent.position,
    nationality: talent.nationality,
    rarity: potentialToRarity(talent.potential),
    attributes,
    abilities: (talent.abilities || []).map(abilityById).filter(Boolean),
    overall: talent.overall,
    energy: talent.energy ?? 100,
    editionId: null,
    isTalent: true,
    potential: talent.potential,
    talentId: talent.id,
  };
}
