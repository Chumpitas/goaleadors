import { describe, it, expect } from 'vitest';
import {
  STREAK_REWARDS,
  streakReward,
  DAILY_CHALLENGES,
  dailyChallengeSet,
  SEASON_PASS_WEEKS,
  PREMIUM_PASS_COST_LOPTE,
  describeReward,
} from './progression.js';
import { mulberry32 } from './rng.js';

describe('streak (§12.3)', () => {
  it('nagrade na 3/7/30 dana', () => {
    expect(streakReward(3).pack).toBe('srebrna');
    expect(streakReward(7).pack).toBe('zlatna');
    expect(streakReward(30).pack).toBe('dijamantska');
    expect(streakReward(30).cosmetic).toBe(true);
    expect(streakReward(4)).toBeNull();
    expect(Object.keys(STREAK_REWARDS)).toHaveLength(3);
  });
});

describe('dnevni izazovi (§12.2)', () => {
  it('izabere zadani broj različitih izazova', () => {
    const set = dailyChallengeSet(mulberry32(1), 2);
    expect(set).toHaveLength(2);
    expect(new Set(set.map((c) => c.id)).size).toBe(2);
    expect(set.every((c) => c.done === false)).toBe(true);
  });

  it('svaki izazov ima nagradu', () => {
    for (const c of DAILY_CHALLENGES) {
      expect(c.reward).toBeTruthy();
      expect(Object.keys(c.reward).length).toBeGreaterThan(0);
    }
  });
});

describe('sezonski pass (§12.4)', () => {
  it('ima 4 sedmice s free i premium track-om', () => {
    expect(SEASON_PASS_WEEKS).toHaveLength(4);
    for (const w of SEASON_PASS_WEEKS) {
      expect(w.free).toBeTruthy();
      expect(w.premium).toBeTruthy();
    }
  });

  it('sedmica 4 premium nosi Legendary kartu + Elite kesicu', () => {
    const w4 = SEASON_PASS_WEEKS[3];
    expect(w4.premium.pack).toBe('elite');
    expect(w4.premium.cardRarity).toBe('legendary');
  });

  it('premium pass cijena u Lopticama', () => {
    expect(PREMIUM_PASS_COST_LOPTE).toBe(400);
  });

  it('describeReward čitljiv', () => {
    expect(describeReward({ kovanice: 3000 })).toContain('🪙');
    expect(describeReward({ pack: 'zlatna', count: 2, cardRarity: 'rare' })).toContain('2× zlatna');
  });
});
