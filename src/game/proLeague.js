// Profesionalne lige + evropska takmičenja (§8.2–8.4).
import { expectedScore, eloFromOverall } from './elo.js';
import { generateAIClubs } from './amateurSeason.js';

export const LEAGUE_SIZE = 16;

/** Klasifikacija na kraju sezone (§8.3, §8.4). */
export const PROMOTION_SPOTS = 2; // 1–2 napreduju
export const RELEGATION_SPOTS = 2; // 15–16 ispadaju
export const EURO_SPOTS = Object.freeze({ cl: [1, 2], el: [3, 4], conf: [5, 6] }); // rangovi

/** Poisson uzorak (Knuth) za broj golova. */
function samplePoisson(lambda, rng) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= rng();
  } while (p > L);
  return k - 1;
}

/** Očekivani golovi tima ovisno o ELO razlici. */
function expectedGoals(eloFor, eloAgainst) {
  const e = expectedScore(eloFor, eloAgainst); // 0..1
  return Math.max(0.2, 0.4 + e * 2.2); // ~0.6–2.6
}

/** Simuliraj rezultat meča (golovi) prema ELO-u. */
export function simulateScore(eloHome, eloAway, rng = Math.random) {
  const home = samplePoisson(expectedGoals(eloHome + 40, eloAway), rng); // mali domaći faktor
  const away = samplePoisson(expectedGoals(eloAway, eloHome + 40), rng);
  return { home, away };
}

/** Round-robin raspored (circle metoda) — n parno, n-1 kola. */
export function roundRobin(ids) {
  const arr = [...ids];
  if (arr.length % 2 !== 0) arr.push(null); // bye
  const n = arr.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a != null && b != null) pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(pairs);
    arr.splice(1, 0, arr.pop()); // rotate
  }
  return rounds;
}

function freshRow(club) {
  return { ...club, played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, points: 0 };
}

/**
 * Odigraj profesionalnu sezonu (jednokružno, 1 meč/dan, §8.2).
 * @returns {{ table: object[], classification: object }}
 */
export function runProSeason({ clubs, rng = Math.random } = {}) {
  if (!clubs || clubs.length !== LEAGUE_SIZE) {
    throw new Error(`Profesionalna liga ima tačno ${LEAGUE_SIZE} klubova.`);
  }
  const table = clubs.map(freshRow);
  const byId = Object.fromEntries(table.map((c) => [c.id, c]));
  const rounds = roundRobin(table.map((c) => c.id));

  for (const round of rounds) {
    for (const [homeId, awayId] of round) {
      const home = byId[homeId];
      const away = byId[awayId];
      const s = simulateScore(home.elo, away.elo, rng);
      home.played += 1; away.played += 1;
      home.gf += s.home; home.ga += s.away;
      away.gf += s.away; away.ga += s.home;
      if (s.home > s.away) { home.w += 1; home.points += 3; away.l += 1; }
      else if (s.home < s.away) { away.w += 1; away.points += 3; home.l += 1; }
      else { home.d += 1; away.d += 1; home.points += 1; away.points += 1; }
    }
  }

  table.sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  table.forEach((c, i) => { c.rank = i + 1; c.gd = c.gf - c.ga; });

  return { table, classification: classify(table) };
}

/** Klasifikuj tabelu: promocija, ispadanje, evropska mjesta (§8.3–8.4). */
export function classify(table) {
  const euroFor = (rank) => {
    if (rank >= EURO_SPOTS.cl[0] && rank <= EURO_SPOTS.cl[1]) return 'cl';
    if (rank >= EURO_SPOTS.el[0] && rank <= EURO_SPOTS.el[1]) return 'el';
    if (rank >= EURO_SPOTS.conf[0] && rank <= EURO_SPOTS.conf[1]) return 'conf';
    return null;
  };
  return {
    champion: table[0] || null,
    promoted: table.filter((c) => c.rank <= PROMOTION_SPOTS),
    relegated: table.filter((c) => c.rank > LEAGUE_SIZE - RELEGATION_SPOTS),
    euro: table.map((c) => ({ id: c.id, rank: c.rank, competition: euroFor(c.rank) })).filter((x) => x.competition),
  };
}

const EURO_NAMES = { cl: 'Liga Šampiona', el: 'Liga Evrope', conf: 'Liga Konferencija' };
export function euroName(code) {
  return EURO_NAMES[code] || code;
}

/** Sastavi profesionalnu ligu: igrač + AI do 16 klubova. */
export function buildProLeague(playerClub, { rng = Math.random } = {}) {
  const ai = generateAIClubs(LEAGUE_SIZE - 1, { rng, eloRange: [playerClub.elo - 180, playerClub.elo + 180] });
  return [playerClub, ...ai];
}

/**
 * Jednostavan knockout (single elimination) po ELO-u za evropsko takmičenje (§8.4).
 * @returns {{ winner: object, rounds: object[][] }}
 */
export function simulateKnockout(clubs, rng = Math.random) {
  let alive = [...clubs];
  const rounds = [];
  while (alive.length > 1) {
    const next = [];
    const pairs = [];
    for (let i = 0; i + 1 < alive.length; i += 2) {
      const a = alive[i];
      const b = alive[i + 1];
      const s = simulateScore(a.elo, b.elo, rng);
      let winner = s.home > s.away ? a : s.home < s.away ? b : (a.elo >= b.elo ? a : b);
      pairs.push({ a: a.name, b: b.name, score: `${s.home}:${s.away}`, winner: winner.name });
      next.push(winner);
    }
    if (alive.length % 2 === 1) next.push(alive[alive.length - 1]); // bye
    rounds.push(pairs);
    alive = next;
  }
  return { winner: alive[0], rounds };
}

export { eloFromOverall };
