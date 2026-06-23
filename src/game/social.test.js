import { describe, it, expect } from 'vitest';
import {
  RIVALRY_LEVELS,
  rivalryLevel,
  derbyBonusPct,
  createRivalry,
  applyDerbyResult,
  streakLabel,
  MAX_RIVALRIES,
} from './rivalries.js';
import {
  ULTRA_LEVELS,
  ULTRA_POINTS,
  ultraLevelFromPoints,
  groupCapacity,
  ultraPointsFor,
  WEEKLY_ULTRA_CHALLENGES,
} from './ultras.js';

describe('rivalstva (§14.2)', () => {
  it('nivoi i derby bonus po broju mečeva', () => {
    expect(rivalryLevel(0).name).toBe('Mlado rivalstvo');
    expect(derbyBonusPct(5)).toBe(50);
    expect(derbyBonusPct(20)).toBe(75);
    expect(derbyBonusPct(40)).toBe(100);
    expect(derbyBonusPct(60)).toBe(150);
    expect(RIVALRY_LEVELS).toHaveLength(4);
    expect(MAX_RIVALRIES).toBe(3);
  });

  it('applyDerbyResult ažurira statistiku i niz', () => {
    let r = createRivalry('FC Rival');
    r = applyDerbyResult(r, { scoreFor: 3, scoreAgainst: 1 });
    expect(r.wins).toBe(1);
    expect(r.currentStreak).toBe(1);
    expect(r.biggestWin).toBe(2);
    r = applyDerbyResult(r, { scoreFor: 2, scoreAgainst: 0 });
    expect(r.currentStreak).toBe(2);
    r = applyDerbyResult(r, { scoreFor: 0, scoreAgainst: 4 });
    expect(r.losses).toBe(1);
    expect(r.currentStreak).toBe(-1);
    expect(r.worstLoss).toBe(4);
    r = applyDerbyResult(r, { scoreFor: 1, scoreAgainst: 1 });
    expect(r.draws).toBe(1);
    expect(r.currentStreak).toBe(0);
    expect(r.played).toBe(4);
  });

  it('streakLabel čitljiv', () => {
    expect(streakLabel(3)).toContain('pobjeda');
    expect(streakLabel(-2)).toContain('poraza');
    expect(streakLabel(0)).toBe('bez niza');
  });
});

describe('ultra grupe (§14.1)', () => {
  it('nivo iz poena i kapacitet', () => {
    expect(ultraLevelFromPoints(0)).toBe(1);
    expect(ultraLevelFromPoints(1000)).toBe(2);
    expect(ultraLevelFromPoints(10000)).toBe(5);
    expect(ultraLevelFromPoints(999999)).toBe(5);
    expect(groupCapacity(1)).toBe(5);
    expect(groupCapacity(5)).toBe(30);
    expect(Object.keys(ULTRA_LEVELS)).toHaveLength(5);
  });

  it('ultra poeni po akciji', () => {
    expect(ultraPointsFor('win')).toBe(ULTRA_POINTS.win);
    expect(ultraPointsFor('leagueWin')).toBe(500);
    expect(ultraPointsFor('promotion')).toBe(200);
    expect(ultraPointsFor('nepoznato')).toBe(0);
  });

  it('sedmični izazovi imaju nagrade', () => {
    expect(WEEKLY_ULTRA_CHALLENGES.length).toBeGreaterThan(0);
    for (const c of WEEKLY_ULTRA_CHALLENGES) expect(c.reward).toBeTruthy();
  });
});
