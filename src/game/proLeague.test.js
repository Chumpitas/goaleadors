import { describe, it, expect } from 'vitest';
import {
  LEAGUE_SIZE,
  roundRobin,
  simulateScore,
  runProSeason,
  classify,
  buildProLeague,
  simulateKnockout,
  euroName,
} from './proLeague.js';
import { mulberry32 } from './rng.js';

describe('round-robin raspored (§8.2)', () => {
  it('16 klubova → 15 kola po 8 mečeva, svako sa svakim jednom', () => {
    const ids = Array.from({ length: 16 }, (_, i) => i);
    const rounds = roundRobin(ids);
    expect(rounds).toHaveLength(15);
    rounds.forEach((r) => expect(r).toHaveLength(8));
    // svaki par tačno jednom
    const seen = new Set();
    for (const r of rounds) for (const [a, b] of r) {
      const key = [a, b].sort((x, y) => x - y).join('-');
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe((16 * 15) / 2);
  });
});

describe('simulateScore', () => {
  it('vraća nenegativne cijele golove', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const s = simulateScore(1000, 1000, rng);
      expect(Number.isInteger(s.home)).toBe(true);
      expect(s.home).toBeGreaterThanOrEqual(0);
      expect(s.away).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('runProSeason + classify (§8.2–8.4)', () => {
  const clubs = (seed) => {
    const rng = mulberry32(seed);
    return Array.from({ length: LEAGUE_SIZE }, (_, i) => ({ id: `c${i}`, name: `Klub ${i}`, elo: 900 + Math.floor(rng() * 300) }));
  };

  it('svaki klub odigra 15 mečeva, tabela rangirana', () => {
    const { table } = runProSeason({ clubs: clubs(1), rng: mulberry32(2) });
    expect(table).toHaveLength(16);
    for (const c of table) expect(c.played).toBe(15);
    for (let i = 1; i < table.length; i++) {
      const a = table[i - 1], b = table[i];
      expect(a.points > b.points || (a.points === b.points && a.gd >= b.gd) || a.points === b.points).toBe(true);
    }
  });

  it('klasifikacija: 2 promovisana, 2 ispala, evropska mjesta 1–6', () => {
    const { classification } = runProSeason({ clubs: clubs(3), rng: mulberry32(4) });
    expect(classification.promoted).toHaveLength(2);
    expect(classification.relegated).toHaveLength(2);
    expect(classification.euro).toHaveLength(6);
    const comps = classification.euro.map((e) => e.competition);
    expect(comps.filter((c) => c === 'cl')).toHaveLength(2);
    expect(comps.filter((c) => c === 'el')).toHaveLength(2);
    expect(comps.filter((c) => c === 'conf')).toHaveLength(2);
  });

  it('baca grešku ako nije 16 klubova', () => {
    expect(() => runProSeason({ clubs: clubs(1).slice(0, 10) })).toThrow();
  });
});

describe('buildProLeague + knockout (§8.4)', () => {
  it('buildProLeague vraća 16 klubova s igračem', () => {
    const league = buildProLeague({ id: 'player', name: 'Ja', elo: 1100 }, { rng: mulberry32(1) });
    expect(league).toHaveLength(16);
    expect(league[0].id).toBe('player');
  });

  it('knockout daje jednog pobjednika', () => {
    const clubs = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, name: `K${i}`, elo: 1000 + i * 10 }));
    const { winner, rounds } = simulateKnockout(clubs, mulberry32(5));
    expect(winner).toBeTruthy();
    expect(rounds.length).toBe(3); // 8 -> 4 -> 2 -> 1
  });

  it('euroName mapira kodove', () => {
    expect(euroName('cl')).toBe('Liga Šampiona');
    expect(euroName('el')).toBe('Liga Evrope');
    expect(euroName('conf')).toBe('Liga Konferencija');
  });
});
