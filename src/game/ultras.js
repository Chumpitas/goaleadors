// Ultra grupe (§14.1) — zajednice igrača, poeni, nivoi i sedmični izazovi.

export const ULTRA_ROLES = Object.freeze(['Capo', 'Lieutenant', 'Member']);

/** Kapacitet i otključavanja po nivou grupe (§14.1). */
export const ULTRA_LEVELS = Object.freeze({
  1: { capacity: 5, unlock: 'Chat, osnovni izazovi' },
  2: { capacity: 10, unlock: 'Ultra leaderboard' },
  3: { capacity: 15, unlock: 'Ekskluzivna kosmetika' },
  4: { capacity: 20, unlock: 'Ultra europska takmičenja' },
  5: { capacity: 30, unlock: 'Legendarni Ultra grb' },
});

/** Ultra poeni po akciji člana (§14.1). */
export const ULTRA_POINTS = Object.freeze({ win: 10, leagueWin: 500, promotion: 200 });

/** Pragovi poena za nivo grupe. */
export const ULTRA_LEVEL_THRESHOLDS = Object.freeze([0, 1000, 3000, 6000, 10000]);

/** Sedmični grupni izazovi (§14.1). */
export const WEEKLY_ULTRA_CHALLENGES = Object.freeze([
  { id: 'wins50', desc: '50 pobjeda ove sedmice', reward: { pack: 'zlatna' } },
  { id: 'leaguewin', desc: 'Neko osvoji ligu', reward: { pack: 'dijamantska' } },
]);

export function ultraLevelFromPoints(points) {
  let level = 1;
  for (let i = 0; i < ULTRA_LEVEL_THRESHOLDS.length; i++) {
    if (points >= ULTRA_LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return Math.min(level, 5);
}

export function groupCapacity(level) {
  return ULTRA_LEVELS[level]?.capacity ?? 5;
}

export function groupUnlock(level) {
  return ULTRA_LEVELS[level]?.unlock ?? '';
}

export function ultraPointsFor(source) {
  return ULTRA_POINTS[source] ?? 0;
}
