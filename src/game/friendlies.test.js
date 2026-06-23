import { describe, it, expect } from 'vitest';
import { FRIENDLY_TYPES, rollFriendlyReward } from './friendlies.js';
import { buildHallOfFame } from './hallOfFame.js';
import { mulberry32 } from './rng.js';

describe('prijateljski mečevi (§14.3)', () => {
  it('nagrade u zadatim rasponima', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const f = rollFriendlyReward('friendly', rng);
      expect(f).toBeGreaterThanOrEqual(500);
      expect(f).toBeLessThanOrEqual(1000);
    }
    expect(rollFriendlyReward('ai', mulberry32(2))).toBe(100);
  });

  it('random trening 200–300', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 50; i++) {
      const v = rollFriendlyReward('random', rng);
      expect(v).toBeGreaterThanOrEqual(200);
      expect(v).toBeLessThanOrEqual(300);
    }
  });

  it('baca grešku za nepoznat tip', () => {
    expect(() => rollFriendlyReward('xyz')).toThrow();
    expect(Object.keys(FRIENDLY_TYPES)).toEqual(['friendly', 'random', 'ai']);
  });
});

describe('Hall of Fame (§14.4)', () => {
  it('prazan kad nema postignuća', () => {
    expect(buildHallOfFame({})).toEqual([]);
  });

  it('kompiliran iz stanja: prvak, Evropa, niz, ultra', () => {
    const hof = buildHallOfFame({
      proSeason: { classification: { champion: { name: 'FC Prvak' } } },
      euroResult: { competition: 'cl', playerWon: true },
      ultraGroup: { name: 'Sjever' },
      rivalries: [{ currentStreak: 4 }, { currentStreak: -2 }],
      clubName: 'Moj klub',
    });
    const titles = hof.map((h) => h.title);
    expect(titles).toContain('Šampion 1. lige');
    expect(titles.some((t) => t.includes('Liga Šampiona'))).toBe(true);
    expect(titles).toContain('Najduži pobjednički niz');
    expect(titles).toContain('Ultra grupa sezone');
    expect(hof.find((h) => h.title === 'Najduži pobjednički niz').holder).toContain('4');
  });
});
