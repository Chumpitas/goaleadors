// Amaterska faza — ELO sistem (§8.1).
// Svaki klub počinje ovdje; svaki dan dobija protivnika sličnog ELO ratinga.

/** Flat promjene ELO ratinga po ishodu (§8.1). */
export const ELO_DELTAS = Object.freeze({ win: 25, draw: 5, loss: -15 });

/** Početni ELO za novi klub. */
export const STARTING_ELO = 1000;

/** Procenat (top %) koji na kraju sezone napreduje u profesionalnu ligu (§8.1). */
export const PROMOTION_TOP_PCT = 0.2;

/** Trajanje amaterske sezone u danima (§8.1). */
export const SEASON_DAYS = 30;

/** Primijeni ishod na ELO; ne pada ispod 0. */
export function updateElo(elo, outcome) {
  const delta = ELO_DELTAS[outcome];
  if (delta === undefined) throw new Error(`Nepoznat ishod: ${outcome}`);
  return Math.max(0, elo + delta);
}

/** Očekivani rezultat (logistička kriva, baza 400) — vjerovatnoća da A pobijedi B. */
export function expectedScore(eloA, eloB) {
  return 1 / (1 + 10 ** ((eloB - eloA) / 400));
}

/** Ishod iz golova za zadanu stranu ('home'|'away'). */
export function outcomeFromScore(homeGoals, awayGoals, side) {
  if (homeGoals === awayGoals) return 'draw';
  const homeWon = homeGoals > awayGoals;
  const sideWon = side === 'home' ? homeWon : !homeWon;
  return sideWon ? 'win' : 'loss';
}

/**
 * Upari klubove protivnicima sličnog ELO ratinga (§8.1).
 * Sortira po ELO i pari susjedne; lagana nasumičnost razbija remi-grupe.
 * @returns {Array<[club, club]>} parovi (neparni klub tog dana pauzira)
 */
export function matchmakeBySimilarElo(clubs, rng = Math.random) {
  const sorted = [...clubs].sort((a, b) => b.elo - a.elo || rng() - 0.5);
  const pairs = [];
  for (let i = 0; i + 1 < sorted.length; i += 2) {
    pairs.push([sorted[i], sorted[i + 1]]);
  }
  return pairs;
}

/** Procijeni ELO iz prosječnog OVERALL-a postave (gruba mapa za seeding klubova). */
export function eloFromOverall(avgOverall, base = STARTING_ELO) {
  return Math.round(base + (avgOverall - 65) * 15);
}
