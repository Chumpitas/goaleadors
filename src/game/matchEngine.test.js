import { describe, it, expect } from 'vitest';
import { simulateMatch, computeRatings, buildLineup } from './matchEngine.js';
import { createCard } from './cards.js';
import { generateEdition } from './editionGenerator.js';
import { mulberry32 } from './rng.js';

// Pomoćnik: napravi Common kartu (0 abilities) sa zadanim atributima.
function card(position, attributes, name = position) {
  return createCard({ name, position, rarity: 'common', attributes });
}

// Tim 4-4-2 sa kontrolisanim prosjecima radi provjere AR formule.
function controlledTeam(overrides = {}) {
  const cards = [
    card('GK', { reflexes: 70, positioning: 70, passing: 50, pace: 50 }),
    ...Array.from({ length: 4 }, (_, i) => card('DEF', { shooting: 30, passing: 50, tackling: 70, pace: 50 }, `D${i}`)),
    ...Array.from({ length: 4 }, (_, i) => card('MID', { shooting: 40, passing: 60, tackling: 50, pace: 50 }, `M${i}`)),
    ...Array.from({ length: 2 }, (_, i) => card('ATT', { shooting: 80, passing: 40, tackling: 20, pace: 50 }, `A${i}`)),
  ];
  return { name: 'Test', cards, formation: '4-4-2', style: 'Possession', mentality: 'Balanced', ...overrides };
}

describe('computeRatings (§3.3–3.4)', () => {
  it('AR slijedi formulu + taktičke modifikatore', () => {
    // arBase = 80*0.5 + 60*0.3 + 50*0.2 = 40 + 18 + 10 = 68
    // mods: 4-4-2 (+0.05) + Possession (+0.03) + Balanced (0) = +0.08
    // away (nije domaćin) -> bez navijačkog bonusa => 68 * 1.08 = 73.44
    const r = computeRatings(controlledTeam());
    expect(r.arBase).toBeCloseTo(68, 5);
    expect(r.ar).toBeCloseTo(73.44, 2);
  });

  it('navijački bonus podiže AR domaćinu (§3.9)', () => {
    const away = computeRatings(controlledTeam());
    const home = computeRatings(controlledTeam({ isHome: true, crowdFill: 95 })); // +8%
    expect(home.ar).toBeGreaterThan(away.ar);
  });

  it('defanzivni mentalitet podiže DR, snižava AR', () => {
    const balanced = computeRatings(controlledTeam());
    const defensive = computeRatings(controlledTeam({ mentality: 'Defensive' }));
    expect(defensive.dr).toBeGreaterThan(balanced.dr);
    expect(defensive.ar).toBeLessThan(balanced.ar);
  });
});

describe('simulateMatch', () => {
  const pool = generateEdition('foundations');
  const mkTeam = (formation, extra = {}) => ({
    cards: buildLineup(pool, formation),
    formation,
    style: 'Possession',
    mentality: 'Balanced',
    ...extra,
  });

  it('isti seed daje identičan rezultat (determinizam)', () => {
    const a = simulateMatch(mkTeam('4-3-3', { isHome: true }), mkTeam('4-4-2'), { seed: 'mec-1' });
    const b = simulateMatch(mkTeam('4-3-3', { isHome: true }), mkTeam('4-4-2'), { seed: 'mec-1' });
    expect(b.score).toEqual(a.score);
    expect(b.events.length).toBe(a.events.length);
    expect(b.stats).toEqual(a.stats);
  });

  it('rezultat su nenegativni cijeli brojevi, golova = broj goal eventa', () => {
    const res = simulateMatch(mkTeam('4-3-3', { isHome: true }), mkTeam('4-4-2'), { seed: 7 });
    for (const k of ['home', 'away']) {
      expect(Number.isInteger(res.score[k])).toBe(true);
      expect(res.score[k]).toBeGreaterThanOrEqual(0);
    }
    const goalEvents = res.events.filter((e) => e.isGoal).length;
    expect(goalEvents).toBe(res.score.home + res.score.away);
  });

  it('posjed se sabira na 100%', () => {
    const res = simulateMatch(mkTeam('4-3-3', { isHome: true }), mkTeam('4-4-2'), { seed: 3 });
    expect(res.stats.possession.home + res.stats.possession.away).toBe(100);
  });

  it('jači tim pobjeđuje u većini mečeva', () => {
    // Jak napad vs slaba odbrana.
    const strong = {
      cards: [
        card('GK', { reflexes: 85, positioning: 85, passing: 60, pace: 55 }),
        ...Array.from({ length: 4 }, (_, i) => card('DEF', { shooting: 40, passing: 65, tackling: 88, pace: 75 }, `D${i}`)),
        ...Array.from({ length: 3 }, (_, i) => card('MID', { shooting: 60, passing: 88, tackling: 70, pace: 75 }, `M${i}`)),
        ...Array.from({ length: 3 }, (_, i) => card('ATT', { shooting: 92, passing: 60, tackling: 30, pace: 90 }, `A${i}`)),
      ],
      formation: '4-3-3',
      style: 'High Press',
      mentality: 'Attacking',
      isHome: true,
    };
    const weak = {
      cards: [
        card('GK', { reflexes: 50, positioning: 50, passing: 40, pace: 40 }),
        ...Array.from({ length: 5 }, (_, i) => card('DEF', { shooting: 25, passing: 45, tackling: 52, pace: 48 }, `D${i}`)),
        ...Array.from({ length: 4 }, (_, i) => card('MID', { shooting: 35, passing: 50, tackling: 45, pace: 48 }, `M${i}`)),
        ...Array.from({ length: 1 }, (_, i) => card('ATT', { shooting: 55, passing: 40, tackling: 25, pace: 55 }, `A${i}`)),
      ],
      formation: '5-4-1',
      style: 'Defensive',
      mentality: 'Defensive',
    };

    let strongWins = 0;
    const N = 200;
    for (let s = 0; s < N; s++) {
      const res = simulateMatch(strong, weak, { rng: mulberry32(s + 1) });
      if (res.score.home > res.score.away) strongWins += 1;
    }
    expect(strongWins / N).toBeGreaterThan(0.6);
  });

  it('prosječan broj golova je u uvjerljivom fudbalskom rasponu (§3.1)', () => {
    let goals = 0;
    const N = 400;
    for (let s = 0; s < N; s++) {
      const res = simulateMatch(mkTeam('4-3-3', { isHome: true }), mkTeam('4-4-2'), { rng: mulberry32(s + 100) });
      goals += res.score.home + res.score.away;
    }
    const avg = goals / N;
    expect(avg).toBeGreaterThan(1.0);
    expect(avg).toBeLessThan(5.0);
  });

  it('baca grešku na nepoznatu formaciju/stil', () => {
    expect(() => simulateMatch(mkTeam('9-9-9', { isHome: true }), mkTeam('4-4-2'))).toThrow();
  });
});
