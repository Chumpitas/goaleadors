// Rivalstva (§14.2) — derby mečevi, nivoi i statistika.

export const MAX_RIVALRIES = 3;

/** Nivoi rivalstva po ukupnom broju međusobnih mečeva (§14.2). */
export const RIVALRY_LEVELS = Object.freeze([
  { name: 'Mlado rivalstvo', min: 0, max: 10, bonusPct: 50 },
  { name: 'Pravo rivalstvo', min: 11, max: 25, bonusPct: 75 },
  { name: 'Vječno rivalstvo', min: 26, max: 50, bonusPct: 100 },
  { name: 'Legendarno rivalstvo', min: 51, max: Infinity, bonusPct: 150 },
]);

export function rivalryLevel(played) {
  return RIVALRY_LEVELS.find((l) => played >= l.min && played <= l.max) || RIVALRY_LEVELS[0];
}

/** Derby bonus na Kovanice (%) prema nivou rivalstva. */
export function derbyBonusPct(played) {
  return rivalryLevel(played).bonusPct;
}

/** Napravi novo rivalstvo. */
export function createRivalry(opponent) {
  return {
    id: `rival-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    opponent,
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    biggestWin: null, // gol razlika
    worstLoss: null, // gol razlika
    currentStreak: 0, // + niz pobjeda, - niz poraza
  };
}

/**
 * Primijeni rezultat derbija na statistiku rivalstva.
 * @param {object} rivalry
 * @param {{ scoreFor:number, scoreAgainst:number }} result
 */
export function applyDerbyResult(rivalry, { scoreFor, scoreAgainst }) {
  const r = { ...rivalry, played: rivalry.played + 1 };
  const diff = scoreFor - scoreAgainst;
  if (diff > 0) {
    r.wins += 1;
    r.currentStreak = rivalry.currentStreak >= 0 ? rivalry.currentStreak + 1 : 1;
    r.biggestWin = Math.max(rivalry.biggestWin ?? 0, diff);
  } else if (diff < 0) {
    r.losses += 1;
    r.currentStreak = rivalry.currentStreak <= 0 ? rivalry.currentStreak - 1 : -1;
    r.worstLoss = Math.max(rivalry.worstLoss ?? 0, -diff);
  } else {
    r.draws += 1;
    r.currentStreak = 0;
  }
  return r;
}

/** Čitljiv opis trenutnog niza. */
export function streakLabel(streak) {
  if (streak > 0) return `${streak} pobjeda u nizu`;
  if (streak < 0) return `${-streak} poraza u nizu`;
  return 'bez niza';
}
