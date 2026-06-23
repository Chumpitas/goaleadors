// Match engine (§3) — probabilistički, ne realna simulacija 90 min (§3.1).
// Vrati prirodan rezultat kroz 18 intervala + sudijska nadoknada.

import {
  FORMATIONS,
  STYLES,
  MENTALITIES,
  CHANCE_TYPES,
  MATCH_CHARACTERS,
  chanceProbabilityForRatio,
  crowdBonus,
  lineForFormation,
  INTERVALS,
  MINUTES_PER_INTERVAL,
} from './tactics.js';
import { mulberry32, hashSeed, randInt } from './rng.js';

// Težina golmanskog člana u DR (§3.3): "(REFLEXES + POSITIONING golmana × 0.10)".
// Tumačimo kao (reflexes + positioning) × 0.10 — držimo kao konstantu radi lakšeg tuninga.
const GK_DR_WEIGHT = 0.1;

const POS = { GK: 'GK', DEF: 'DEF', MID: 'MID', ATT: 'ATT' };

/** Efektivna vrijednost atributa uz umor karte (§3.10): base × energy/100. */
function eff(card, attr) {
  const energy = card.energy ?? 100;
  return (card.attributes?.[attr] ?? 0) * (energy / 100);
}

function byPosition(cards, position) {
  return cards.filter((c) => c.position === position);
}

/** Prosjek efektivnog atributa za grupu karata (0 ako je grupa prazna). */
function avgEff(cards, attr) {
  if (!cards.length) return 0;
  return cards.reduce((s, c) => s + eff(c, attr), 0) / cards.length;
}

/**
 * Sumiraj taktičke modifikatore (formacija + stil + mentalitet) za AR i DR (§3.4).
 */
function tacticalMods(team) {
  const f = FORMATIONS[team.formation];
  const s = STYLES[team.style];
  const m = MENTALITIES[team.mentality];
  if (!f) throw new Error(`Nepoznata formacija: ${team.formation}`);
  if (!s) throw new Error(`Nepoznat stil: ${team.style}`);
  if (!m) throw new Error(`Nepoznat mentalitet: ${team.mentality}`);
  return {
    ar: f.ar + s.ar + m.ar,
    dr: f.dr + s.dr + m.dr,
    convMod: s.convMod,
  };
}

/** Korak 1 + 2 + 7: izračunaj Attack/Defense Rating za tim (§3.3, 3.4, 3.9). */
export function computeRatings(team) {
  const attackers = byPosition(team.cards, POS.ATT);
  const mids = byPosition(team.cards, POS.MID);
  const defs = byPosition(team.cards, POS.DEF);
  const gk = byPosition(team.cards, POS.GK)[0] || null;
  const whole = team.cards;

  const arBase =
    avgEff(attackers, 'shooting') * 0.5 +
    avgEff(mids, 'passing') * 0.3 +
    avgEff(whole, 'pace') * 0.2;

  const gkTerm = gk ? (eff(gk, 'reflexes') + eff(gk, 'positioning')) * GK_DR_WEIGHT : 0;
  const drBase =
    avgEff(defs, 'tackling') * 0.5 +
    avgEff(mids, 'passing') * 0.2 +
    avgEff(defs, 'pace') * 0.2 +
    gkTerm;

  const mods = tacticalMods(team);
  const crowd = team.isHome ? crowdBonus(team.crowdFill ?? 100) : 0;

  // §3.9: navijački bonus se primjenjuje na AR domaćina.
  const ar = arBase * (1 + mods.ar) * (1 + crowd);
  const dr = drBase * (1 + mods.dr);

  return { ar, dr, arBase, drBase, convMod: mods.convMod, crowd };
}

/** Težinski izbor (po `prob` polju) iz liste. */
function pickWeighted(rng, items) {
  const total = items.reduce((s, it) => s + it.prob, 0);
  let roll = rng() * total;
  for (const it of items) {
    if (roll < it.prob) return it;
    roll -= it.prob;
  }
  return items[items.length - 1];
}

function rollCharacter(rng) {
  return pickWeighted(rng, MATCH_CHARACTERS);
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Korak 4: razriješi jednu šansu u (možda) gol + statistiku šuta (§3.6). */
function resolveChance(attackTeam, defendTeam, attackRatings, rng) {
  const type = pickWeighted(rng, CHANCE_TYPES);

  // Strijelac: napadač s najvećim efektivnim shootingom (fallback: vezni).
  const shooters = byPosition(attackTeam.cards, POS.ATT);
  const pool = shooters.length ? shooters : byPosition(attackTeam.cards, POS.MID);
  const shooter = pool.reduce(
    (best, c) => (eff(c, 'shooting') > eff(best, 'shooting') ? c : best),
    pool[0]
  );
  const shooterShooting = shooter ? eff(shooter, 'shooting') : 50;

  const gk = byPosition(defendTeam.cards, POS.GK)[0] || null;
  const gkReflexes = gk ? Math.max(1, eff(gk, 'reflexes')) : 50;

  // §3.6: finalna konverzija. special_ability_mod ostaje 1.0 do Phase 2 (abilities),
  // ali stil "Counter" daje +30% konverziju kontra-šansama (§3.4).
  const finalConv = clamp(
    type.conversion * (shooterShooting / 100) * (100 / gkReflexes) * attackRatings.convMod,
    0.02,
    0.95
  );

  const isGoal = rng() < finalConv;
  const onTarget = isGoal || rng() < 0.45;
  return { type: type.id, typeLabel: type.label, isGoal, onTarget, shooter: shooter?.name };
}

/**
 * Odigraj jedan tim kao napadač protiv drugog u jednom segmentu intervala.
 * `weight` skalira vjerovatnoću (npr. nadoknada < 1.0).
 */
function playSegment(ctx, attackKey, weight, minute) {
  const { rng, ratings, character } = ctx;
  const att = attackKey;
  const def = att === 'home' ? 'away' : 'home';

  const ratio = ratings[att].ar / Math.max(1, ratings[def].dr);
  const randomFactor = 0.7 + rng() * 0.6; // §3.5 fudbalski kaos
  const p = chanceProbabilityForRatio(ratio) * randomFactor * character.chanceMult * weight;

  if (rng() >= p) return; // nema šanse u ovom segmentu za ovaj tim

  ctx.stats[att].chances += 1;
  const res = resolveChance(ctx.teams[att], ctx.teams[def], ratings[att], rng);
  ctx.stats[att].shots += 1;
  if (res.onTarget) ctx.stats[att].onTarget += 1;

  const event = { minute, team: att, ...res };
  if (res.isGoal) {
    ctx.score[att] += 1;
    event.score = `${ctx.score.home}:${ctx.score.away}`;
  }
  ctx.events.push(event);
}

function teamRating(goalsFor, goalsAgainst, onTarget) {
  return Number(
    clamp(6.0 + 0.4 * goalsFor - 0.3 * goalsAgainst + 0.05 * onTarget, 4.0, 9.5).toFixed(1)
  );
}

/**
 * Simuliraj meč između dva tima.
 *
 * Tim oblik: { name, cards:[...], formation, style, mentality, isHome?, crowdFill? }
 *
 * @param {object} home
 * @param {object} away
 * @param {object} [opts]
 * @param {() => number} [opts.rng] - injektabilni RNG
 * @param {string|number} [opts.seed] - alternativa: deterministički seed
 */
export function simulateMatch(home, away, opts = {}) {
  const rng =
    opts.rng ||
    (opts.seed != null
      ? mulberry32(typeof opts.seed === 'number' ? opts.seed : hashSeed(String(opts.seed)))
      : Math.random);

  const teams = { home: { isHome: true, ...home }, away: { ...away, isHome: false } };
  const ratings = { home: computeRatings(teams.home), away: computeRatings(teams.away) };

  // Korak 5: karakter meča (§3.7). Upset: slabiji (manji AR) dobija +25% AR.
  const character = rollCharacter(rng);
  if (character.upsetBoost) {
    const weaker = ratings.home.ar <= ratings.away.ar ? 'home' : 'away';
    ratings[weaker] = { ...ratings[weaker], ar: ratings[weaker].ar * (1 + character.upsetBoost) };
  }

  const ctx = {
    rng,
    teams,
    ratings,
    character,
    score: { home: 0, away: 0 },
    stats: {
      home: { chances: 0, shots: 0, onTarget: 0 },
      away: { chances: 0, shots: 0, onTarget: 0 },
    },
    events: [],
  };

  // §3.2: 18 intervala, plus nadoknada na kraju svakog poluvremena (1–5 min).
  for (let i = 1; i <= INTERVALS; i++) {
    const minute = i * MINUTES_PER_INTERVAL;
    playSegment(ctx, 'home', 1, minute);
    playSegment(ctx, 'away', 1, minute);

    if (i === INTERVALS / 2 || i === INTERVALS) {
      const stoppage = randInt(rng, 1, 5);
      const label = i === INTERVALS / 2 ? `45+${stoppage}` : `90+${stoppage}`;
      const weight = stoppage / MINUTES_PER_INTERVAL;
      playSegment(ctx, 'home', weight, label);
      playSegment(ctx, 'away', weight, label);
    }
  }

  // Posjed iz omjera AR (§3.11, aproksimacija).
  const arSum = ratings.home.ar + ratings.away.ar || 1;
  const possHome = Math.round((100 * ratings.home.ar) / arSum);

  return {
    character: { id: character.id, label: character.label },
    ratings: {
      home: { ar: round1(ratings.home.ar), dr: round1(ratings.home.dr) },
      away: { ar: round1(ratings.away.ar), dr: round1(ratings.away.dr) },
    },
    score: { ...ctx.score },
    stats: {
      possession: { home: possHome, away: 100 - possHome },
      shots: { home: ctx.stats.home.shots, away: ctx.stats.away.shots },
      onTarget: { home: ctx.stats.home.onTarget, away: ctx.stats.away.onTarget },
      chances: { home: ctx.stats.home.chances, away: ctx.stats.away.chances },
      rating: {
        home: teamRating(ctx.score.home, ctx.score.away, ctx.stats.home.onTarget),
        away: teamRating(ctx.score.away, ctx.score.home, ctx.stats.away.onTarget),
      },
    },
    events: ctx.events,
  };
}

function round1(n) {
  return Number(n.toFixed(1));
}

/**
 * Sastavi postavu iz edition poola za zadanu formaciju.
 * Bira karte s najvećim OVERALL-om po liniji. `extra` (npr. potpisani talenti
 * pretvoreni u karte) imaju prioritet — uvrštavaju se prvi po poziciji.
 */
export function buildLineup(pool, formation, { rng, extra = [] } = {}) {
  const line = lineForFormation(formation);
  const take = (position, n) => {
    const ex = extra.filter((c) => c.position === position).sort((a, b) => b.overall - a.overall);
    let candidates = pool.filter((c) => c.position === position);
    if (rng) candidates = [...candidates].sort(() => rng() - 0.5);
    else candidates = [...candidates].sort((a, b) => b.overall - a.overall);
    return [...ex, ...candidates].slice(0, n);
  };
  return [
    ...take(POS.GK, line.gk),
    ...take(POS.DEF, line.def),
    ...take(POS.MID, line.mid),
    ...take(POS.ATT, line.att),
  ];
}

/** Tekstualni scoreboard u stilu §3.11. */
export function formatScoreboard(result, homeName = 'Domaći', awayName = 'Gosti') {
  const s = result.stats;
  const pad = (v) => String(v).padStart(3);
  return [
    `${homeName}  ${result.score.home} : ${result.score.away}  ${awayName}   [${result.character.label}]`,
    `Posjed:    ${pad(s.possession.home)}% | ${pad(s.possession.away)}%`,
    `Šutevi:    ${pad(s.shots.home)}  | ${pad(s.shots.away)}`,
    `Na gol:    ${pad(s.onTarget.home)}  | ${pad(s.onTarget.away)}`,
    `Šanse:     ${pad(s.chances.home)}  | ${pad(s.chances.away)}`,
    `Ocjena:    ${pad(s.rating.home)} | ${pad(s.rating.away)}`,
  ].join('\n');
}
