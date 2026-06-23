import { describe, it, expect } from 'vitest';
import {
  WORLD_CUP_NATIONS,
  WC_GROUPS,
  WC_EDITION_CONFIG,
  calcEuropeanScore,
  calculateManagerRating,
  nextPowerOf2,
  buildBracket,
  generateNationPool,
  autoSelectBest11,
  simulateWorldCup,
  placementReward,
  WC_REWARDS,
} from './worldCup.js';
import { mulberry32 } from './rng.js';

describe('World Cup osnove', () => {
  it('16 nacija u 4 grupe od po 4', () => {
    expect(WORLD_CUP_NATIONS).toHaveLength(16);
    expect(Object.keys(WC_GROUPS)).toHaveLength(4);
    const all = Object.values(WC_GROUPS).flat();
    expect(all).toHaveLength(16);
    expect(new Set(all).size).toBe(16);
  });

  it('WC edicija: 200 karata, min 12/naciji', () => {
    expect(WC_EDITION_CONFIG.totalCards).toBe(200);
    expect(WC_EDITION_CONFIG.cardsPerNation).toBe(12);
  });
});

describe('Manager Rating', () => {
  it('evropski skor uzima najbolji rezultat', () => {
    expect(calcEuropeanScore([{ result: 'qf' }, { result: 'win' }, { result: 'sf' }])).toBe(1000);
    expect(calcEuropeanScore([])).toBe(0);
  });

  it('total = zbir komponenti', () => {
    const r = calculateManagerRating({ currentLeagueLevel: 1, winsLast30: 30, europeanHistory: [{ result: 'win' }], totalSeasons: 50 });
    // leagueLevel 1200 + winRate 1500 + euro 1000 + seasons 500 = 4200
    expect(r.total).toBe(4200);
    expect(r.breakdown.leagueLevel).toBe(1200);
    expect(r.breakdown.seasonsPlayed).toBe(500);
  });

  it('niža liga i slabiji winrate daju manji rating', () => {
    const low = calculateManagerRating({ currentLeagueLevel: 3, winsLast30: 5, europeanHistory: [], totalSeasons: 2 });
    const high = calculateManagerRating({ currentLeagueLevel: 1, winsLast30: 25, europeanHistory: [{ result: 'final' }], totalSeasons: 20 });
    expect(high.total).toBeGreaterThan(low.total);
  });
});

describe('kvalifikacioni bracket', () => {
  it('nextPowerOf2', () => {
    expect(nextPowerOf2(5)).toBe(8);
    expect(nextPowerOf2(8)).toBe(8);
    expect(nextPowerOf2(9)).toBe(16);
  });

  it('buildBracket pokriva 1/2/3/n', () => {
    expect(buildBracket(['a']).type).toBe('direct_qualification');
    expect(buildBracket(['a', 'b']).type).toBe('single_match');
    expect(buildBracket(['a', 'b', 'c']).type).toBe('three_way');
    const b = buildBracket(['a', 'b', 'c', 'd', 'e']);
    expect(b.bracketSize).toBe(8);
    expect(b.byes).toBe(3);
  });
});

describe('reprezentacijski pool', () => {
  it('min 12 karata po naciji, ista nacionalnost', () => {
    const pool = generateNationPool('Brazil');
    expect(pool.length).toBeGreaterThanOrEqual(12);
    expect(pool.every((c) => c.nationality === 'Brazil')).toBe(true);
    expect(autoSelectBest11(pool)).toHaveLength(11);
  });

  it('deterministički po naciji', () => {
    expect(generateNationPool('Italy')[0].overall).toBe(generateNationPool('Italy')[0].overall);
  });
});

describe('simulacija turnira', () => {
  it('daje prvaka, finalistu i treće mjesto', () => {
    const res = simulateWorldCup({}, mulberry32(1));
    expect(WORLD_CUP_NATIONS).toContain(res.winner);
    expect(res.runnerUp).not.toBe(res.winner);
    expect(res.placement[res.winner]).toBe('winner');
    expect(res.placement[res.runnerUp]).toBe('runnerUp');
    expect(res.placement[res.thirdPlace]).toBe('third');
  });

  it('placementReward mapira podijum', () => {
    expect(placementReward('winner')).toBe(WC_REWARDS.winner);
    expect(placementReward('runnerUp')).toBe(WC_REWARDS.runnerUp);
    expect(placementReward('third')).toBe(WC_REWARDS.thirdPlace);
    expect(placementReward('qf')).toBeNull();
  });
});
