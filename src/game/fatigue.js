// Umor karata + Medicinski centar (§10.6, §10.7).

export const ENERGY_MAX = 100;

/** Meč troši 15% base + do 5% za punih 90 min (§10.6). */
export const MATCH_BASE_COST = 15;
export const MATCH_FULL_BONUS = 5;

/** Bazni dnevni oporavak (§10.6). */
export const BASE_DAILY_RECOVERY = 20;

/** Ispod ovog praga karta dobija stat penal; ispod MIN_PLAY ne može igrati (§10.6). */
export const LOW_ENERGY_THRESHOLD = 30;
export const LOW_ENERGY_PENALTY = 0.1; // -10% na sve statove
export const MIN_PLAY_ENERGY = 10;

/** Dodatni oporavak po nivou medicinskog centra (§10.7), u procentnim poenima. */
export const MEDICAL_RECOVERY_BONUS = Object.freeze({ 1: 10, 2: 20, 3: 30 });

/** Hitno liječenje (na puno) po sedmici, po nivou (§10.7). */
export const EMERGENCY_HEALS_PER_WEEK = Object.freeze({ 1: 0, 2: 1, 3: 2 });

const clampEnergy = (e) => Math.max(0, Math.min(ENERGY_MAX, e));

/** Energetski trošak meča za odigrane minute (default 90). */
export function matchEnergyCost(minutes = 90) {
  const ratio = Math.max(0, Math.min(1, minutes / 90));
  return MATCH_BASE_COST + MATCH_FULL_BONUS * ratio;
}

/** Primijeni umor meča na energiju karte. */
export function applyMatchFatigue(energy, minutes = 90) {
  return clampEnergy(energy - matchEnergyCost(minutes));
}

/** Ukupan dnevni oporavak (baza + medicinski centar). */
export function dailyRecovery(medicalLevel = 0) {
  return BASE_DAILY_RECOVERY + (MEDICAL_RECOVERY_BONUS[medicalLevel] ?? 0);
}

/** Oporavi energiju kroz N dana. */
export function recover(energy, medicalLevel = 0, days = 1) {
  return clampEnergy(energy + dailyRecovery(medicalLevel) * days);
}

/** Da li karta može igrati (energija ≥ 10%). */
export function canPlay(energy) {
  return energy >= MIN_PLAY_ENERGY;
}

/** Stat multiplikator zbog umora: -10% ispod 30% energije (§10.6). */
export function lowEnergyPenaltyMultiplier(energy) {
  return energy < LOW_ENERGY_THRESHOLD ? 1 - LOW_ENERGY_PENALTY : 1;
}

/** Broj hitnih liječenja po sedmici za nivo. */
export function emergencyHealsPerWeek(medicalLevel) {
  return EMERGENCY_HEALS_PER_WEEK[medicalLevel] ?? 0;
}

/** Status energije za UI/roster. */
export function energyStatus(energy) {
  if (!canPlay(energy)) return 'iscrpljena'; // ne može igrati
  if (energy < LOW_ENERGY_THRESHOLD) return 'umorna'; // -10% statovima
  return 'spremna';
}
