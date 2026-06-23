// World Cup sistem (WORLD_CUP_SYSTEM) — 16 reprezentacija, igrači kao selektori.
// Bogatstvo kluba = nula prednosti; svi selektori vide isti reprezentacijski pool.
import { createCard } from './cards.js';
import { buildLineup, simulateMatch } from './matchEngine.js';
import { eloFromOverall } from './elo.js';
import { mulberry32, hashSeed, randInt } from './rng.js';

export const WORLD_CUP_NATIONS = Object.freeze([
  'Brazil', 'Germany', 'Italy', 'Argentina', 'France', 'Spain',
  'England', 'Uruguay', 'Netherlands', 'Portugal', 'Croatia',
  'Belgium', 'Mexico', 'Japan', 'Australia', 'Nigeria',
]);

export const WC_GROUPS = Object.freeze({
  A: ['Brazil', 'Mexico', 'Uruguay', 'Belgium'],
  B: ['Germany', 'Japan', 'Croatia', 'Argentina'],
  C: ['Spain', 'Italy', 'Portugal', 'France'],
  D: ['England', 'Nigeria', 'Australia', 'Netherlands'],
});

/** WC edicija: izlazi 2 sezone prije WC-a, traje 2 sezone. */
export const WC_EDITION_CONFIG = Object.freeze({
  totalCards: 200,
  cardsPerNation: 12,
  epicChanceMultiplier: 1.3,
  legendaryChanceMultiplier: 1.2,
  visualTheme: 'world_cup',
  duration: 2,
});

const YEAR = new Date().getFullYear();

export const WC_REWARDS = Object.freeze({
  winner: { trophy: 'gold', title: `World Cup Winner ${YEAR}`, aura: 'gold_world_cup', elitePacks: 3, coins: 500000, veteranTokens: 5, stadiumSkin: `wc_${YEAR}_winner`, kit: `wc_${YEAR}_winner` },
  runnerUp: { trophy: 'silver', elitePacks: 1, coins: 150000, veteranTokens: 2 },
  thirdPlace: { trophy: 'bronze', diamondPacks: 1, coins: 75000 },
});

// ---------------------------------------------------------------------------
// Manager Rating
// ---------------------------------------------------------------------------

/** Najbolji evropski rezultat → poeni (LŠ win 1000, finale 700, SF 400, QF 200). */
export function calcEuropeanScore(history = []) {
  const map = { win: 1000, final: 700, sf: 400, qf: 200 };
  return history.reduce((max, h) => Math.max(max, map[h.result] || 0), 0);
}

/**
 * Manager Rating s breakdownom (WORLD_CUP_SYSTEM).
 * NAPOMENA: interface komentar kaže leagueLevel max 1000, ali formula daje
 * 1200 − (level−1)·200 (level 1 = 1200). Pratimo formulu (konkretan kod).
 */
export function calculateManagerRating(m) {
  const leagueLevel = Math.max(0, 1200 - (m.currentLeagueLevel - 1) * 200);
  const winRate30 = (m.winsLast30 / 30) * 1500;
  const europeanResults = calcEuropeanScore(m.europeanHistory);
  const seasonsPlayed = Math.min(m.totalSeasons * 10, 500);
  return {
    total: Math.round(leagueLevel + winRate30 + europeanResults + seasonsPlayed),
    breakdown: {
      leagueLevel: Math.round(leagueLevel),
      winRate30: Math.round(winRate30),
      europeanResults,
      seasonsPlayed,
    },
  };
}

// ---------------------------------------------------------------------------
// Kvalifikacioni bracket
// ---------------------------------------------------------------------------

export function nextPowerOf2(n) {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/** Izgradi kvalifikacioni bracket (WORLD_CUP_SYSTEM). participants sortirani po ratingu (desc). */
export function buildBracket(participants) {
  const n = participants.length;
  if (n === 1) return { type: 'direct_qualification', winner: participants[0] };
  if (n === 2) return { type: 'single_match', participants };
  if (n === 3) return { type: 'three_way', bye: participants[0], semifinal: [participants[1], participants[2]] };
  const bracketSize = nextPowerOf2(n);
  return { type: 'standard', bracketSize, byes: bracketSize - n, participants };
}

// ---------------------------------------------------------------------------
// Reprezentacijski pool (min 12 karata po naciji)
// ---------------------------------------------------------------------------

const NATION_LINE = { GK: 2, DEF: 5, MID: 5, ATT: 4 }; // 16 karata

/** Generiši reprezentacijski pool nacije (deterministički, min 12). */
export function generateNationPool(nation) {
  const rng = mulberry32(hashSeed(`wc-${nation}`));
  const cards = [];
  const make = (position, n) => {
    for (let i = 0; i < n; i++) {
      const overall = randInt(rng, 72, 90);
      const rarity = overall >= 85 ? 'epic' : overall >= 78 ? 'rare' : 'common';
      const attrs = position === 'GK'
        ? { reflexes: overall + randInt(rng, -3, 3), positioning: overall + randInt(rng, -3, 3), passing: overall - 10, pace: overall - 12 }
        : { shooting: overall + randInt(rng, -5, 5), passing: overall + randInt(rng, -5, 5), tackling: overall + randInt(rng, -5, 5), pace: overall + randInt(rng, -5, 5) };
      cards.push(createCard({ name: `${nation} ${position}${i + 1}`, position, rarity, nationality: nation, attributes: attrs }));
    }
  };
  make('GK', NATION_LINE.GK); make('DEF', NATION_LINE.DEF); make('MID', NATION_LINE.MID); make('ATT', NATION_LINE.ATT);
  return cards;
}

/** Auto-izbor najboljih 11 (kad selektor nije prisutan, §pravilo prisutnosti). */
export function autoSelectBest11(pool, formation = '4-4-2') {
  return buildLineup(pool, formation);
}

/** Jačina nacije = prosječni OVERALL najbolje postave (memoizirano). */
const _strengthCache = {};
export function nationStrength(nation) {
  if (_strengthCache[nation] != null) return _strengthCache[nation];
  const xi = autoSelectBest11(generateNationPool(nation), '4-3-3');
  const avg = xi.reduce((s, c) => s + c.overall, 0) / (xi.length || 1);
  _strengthCache[nation] = avg;
  return avg;
}

// ---------------------------------------------------------------------------
// World Cup simulacija
// ---------------------------------------------------------------------------

function nationElo(nation, extras) {
  return eloFromOverall(nationStrength(nation)) + (extras?.[nation] || 0);
}

function playMatch(a, b, eloExtras, rng) {
  const ea = nationElo(a, eloExtras);
  const eb = nationElo(b, eloExtras);
  const res = simulateMatch(
    { name: a, cards: autoSelectBest11(generateNationPool(a), '4-3-3'), formation: '4-3-3', style: 'Possession', mentality: 'Balanced', isHome: true },
    { name: b, cards: autoSelectBest11(generateNationPool(b), '4-4-2'), formation: '4-4-2', style: 'Possession', mentality: 'Balanced' }
  );
  // ELO extras (manager bonus) kao tie/boost: lagano pomakni rezultat ako je extra velik
  let { home, away } = res.score;
  if (eloExtras?.[a]) home += ea > eb && rng() < 0.2 ? 1 : 0;
  return { a, b, ga: home, gb: away };
}

function knockoutMatch(a, b, eloExtras, rng) {
  const m = playMatch(a, b, eloExtras, rng);
  let winner = m.ga > m.gb ? a : m.ga < m.gb ? b : (nationElo(a, eloExtras) >= nationElo(b, eloExtras) ? a : b);
  return { a, b, score: `${m.ga}:${m.gb}`, winner };
}

/**
 * Simuliraj cijeli World Cup. `eloExtras[nation]` dodaje ELO (npr. manager bonus selektora).
 * @returns {{ groups, knockout, placement, order }}
 */
export function simulateWorldCup(eloExtras = {}, rng = Math.random) {
  // Grupna faza
  const groups = {};
  const groupOrder = {};
  for (const [g, nations] of Object.entries(WC_GROUPS)) {
    const table = Object.fromEntries(nations.map((n) => [n, { nation: n, pts: 0, gf: 0, ga: 0 }]));
    for (let i = 0; i < nations.length; i++) {
      for (let j = i + 1; j < nations.length; j++) {
        const m = playMatch(nations[i], nations[j], eloExtras, rng);
        const A = table[nations[i]], B = table[nations[j]];
        A.gf += m.ga; A.ga += m.gb; B.gf += m.gb; B.ga += m.ga;
        if (m.ga > m.gb) A.pts += 3; else if (m.ga < m.gb) B.pts += 3; else { A.pts += 1; B.pts += 1; }
      }
    }
    const sorted = Object.values(table).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
    groups[g] = sorted;
    groupOrder[g] = sorted.map((t) => t.nation);
  }

  // Knockout: top 2 po grupi → četvrtfinale (8 ekipa).
  const w = (g) => groupOrder[g][0];
  const r = (g) => groupOrder[g][1];
  const qf = [
    knockoutMatch(w('A'), r('B'), eloExtras, rng),
    knockoutMatch(w('C'), r('D'), eloExtras, rng),
    knockoutMatch(w('B'), r('A'), eloExtras, rng),
    knockoutMatch(w('D'), r('C'), eloExtras, rng),
  ];
  const sf = [
    knockoutMatch(qf[0].winner, qf[1].winner, eloExtras, rng),
    knockoutMatch(qf[2].winner, qf[3].winner, eloExtras, rng),
  ];
  const finalists = [sf[0].winner, sf[1].winner];
  const sfLosers = [sf[0].a === sf[0].winner ? sf[0].b : sf[0].a, sf[1].a === sf[1].winner ? sf[1].b : sf[1].a];
  const final = knockoutMatch(finalists[0], finalists[1], eloExtras, rng);
  const third = knockoutMatch(sfLosers[0], sfLosers[1], eloExtras, rng);

  const winner = final.winner;
  const runnerUp = final.a === winner ? final.b : final.a;
  const thirdPlace = third.winner;

  // Plasman po naciji
  const placement = {};
  for (const n of WORLD_CUP_NATIONS) placement[n] = 'group';
  qf.forEach((m) => { placement[m.a] = placement[m.a] === 'group' ? 'qf' : placement[m.a]; placement[m.b] = placement[m.b] === 'group' ? 'qf' : placement[m.b]; });
  sfLosers.forEach((n) => (placement[n] = 'sf'));
  placement[thirdPlace] = 'third';
  placement[runnerUp] = 'runnerUp';
  placement[winner] = 'winner';

  return { groups, knockout: { qf, sf, third, final }, placement, winner, runnerUp, thirdPlace };
}

/** Mapiraj plasman nacije na nagradu (winner/runnerUp/thirdPlace). */
export function placementReward(placement) {
  if (placement === 'winner') return WC_REWARDS.winner;
  if (placement === 'runnerUp') return WC_REWARDS.runnerUp;
  if (placement === 'third') return WC_REWARDS.thirdPlace;
  return null;
}
