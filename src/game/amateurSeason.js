// Amaterska sezona (§8.1): 30 dana, dnevni mečevi protiv sličnog ELO,
// AI klubovi popunjavaju mjesta, top 20% napreduje u profesionalnu ligu.

import {
  STARTING_ELO,
  SEASON_DAYS,
  PROMOTION_TOP_PCT,
  updateElo,
  expectedScore,
  matchmakeBySimilarElo,
  eloFromOverall,
} from './elo.js';
import { randInt, pick } from './rng.js';

const AI_PREFIX = ['FC', 'NK', 'SK', 'AC', 'Atletico', 'Real', 'Dinamo', 'Partizan', 'Sloga', 'Mladost'];
const AI_CITY = ['Beograd', 'Zagreb', 'Sarajevo', 'Novi Sad', 'Split', 'Niš', 'Banja Luka', 'Mostar', 'Rijeka', 'Subotica', 'Tuzla', 'Podgorica'];

/** Vjerovatnoća remija u amaterskom meču (fudbalski realno). */
export const DEFAULT_DRAW_PROB = 0.26;

/**
 * Razriješi meč po ELO-u. Prva strana je domaćin.
 * @returns {'home'|'away'|'draw'}
 */
export function resolveByElo(eloHome, eloAway, rng = Math.random, drawProb = DEFAULT_DRAW_PROB) {
  const e = expectedScore(eloHome, eloAway);
  const pHome = e * (1 - drawProb);
  const roll = rng();
  if (roll < pHome) return 'home';
  if (roll < pHome + drawProb) return 'draw';
  return 'away';
}

/** Napravi N AI klubova s ELO-om u zadanom rasponu. */
export function generateAIClubs(n, { rng, eloRange = [900, 1100] } = {}) {
  const r = rng || Math.random;
  const clubs = [];
  for (let i = 0; i < n; i++) {
    clubs.push({
      id: `ai-${i}`,
      name: `${pick(r, AI_PREFIX)} ${pick(r, AI_CITY)}`,
      elo: randInt(r, eloRange[0], eloRange[1]),
      isAI: true,
    });
  }
  return clubs;
}

/** Klub igrača iz postave: ELO se izvodi iz prosječnog OVERALL-a. */
export function playerClubFromLineup(name, lineup, { base = STARTING_ELO } = {}) {
  const avg = lineup.length ? lineup.reduce((s, c) => s + c.overall, 0) / lineup.length : 65;
  return { id: 'player', name, elo: eloFromOverall(avg, base), isAI: false, isPlayer: true, lineup };
}

function freshRecord(club) {
  return { ...club, w: 0, d: 0, l: 0, points: 0, played: 0, eloStart: club.elo };
}

function applyOutcome(club, outcome) {
  if (outcome === 'win') {
    club.w += 1;
    club.points += 3;
  } else if (outcome === 'draw') {
    club.d += 1;
    club.points += 1;
  } else {
    club.l += 1;
  }
  club.played += 1;
  club.elo = updateElo(club.elo, outcome);
}

/**
 * Odigraj cijelu amatersku sezonu.
 * @param {object} opts
 * @param {object[]} opts.clubs - klubovi (player + AI), svaki s `elo`
 * @param {number} [opts.days=30]
 * @param {() => number} [opts.rng]
 * @param {(home, away, rng) => 'home'|'away'|'draw'} [opts.resolver] - default ELO
 * @returns {{ table: object[], promotedCount: number, days: number }}
 */
export function runAmateurSeason({ clubs, days = SEASON_DAYS, rng = Math.random, resolver } = {}) {
  if (!clubs || clubs.length < 2) throw new Error('Potrebna su barem 2 kluba.');
  const resolve = resolver || ((h, a, r) => resolveByElo(h.elo, a.elo, r));
  const table = clubs.map(freshRecord);

  for (let day = 0; day < days; day++) {
    const pairs = matchmakeBySimilarElo(table, rng);
    for (const [home, away] of pairs) {
      const result = resolve(home, away, rng);
      if (result === 'home') {
        applyOutcome(home, 'win');
        applyOutcome(away, 'loss');
      } else if (result === 'away') {
        applyOutcome(home, 'loss');
        applyOutcome(away, 'win');
      } else {
        applyOutcome(home, 'draw');
        applyOutcome(away, 'draw');
      }
    }
  }

  // Rangiranje za napredovanje: po ELO, pa po bodovima (§8.1).
  table.sort((a, b) => b.elo - a.elo || b.points - a.points);
  const promotedCount = Math.ceil(table.length * PROMOTION_TOP_PCT);
  table.forEach((c, i) => {
    c.rank = i + 1;
    c.promoted = i < promotedCount;
  });

  return { table, promotedCount, days };
}
