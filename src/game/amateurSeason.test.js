import { describe, it, expect } from 'vitest';
import {
  updateElo,
  ELO_DELTAS,
  expectedScore,
  outcomeFromScore,
  matchmakeBySimilarElo,
  eloFromOverall,
} from './elo.js';
import {
  runAmateurSeason,
  generateAIClubs,
  resolveByElo,
  playerClubFromLineup,
} from './amateurSeason.js';
import { mulberry32 } from './rng.js';

describe('ELO osnove (§8.1)', () => {
  it('flat delte: pobjeda +25, remi +5, poraz -15', () => {
    expect(updateElo(1000, 'win')).toBe(1000 + ELO_DELTAS.win);
    expect(updateElo(1000, 'draw')).toBe(1005);
    expect(updateElo(1000, 'loss')).toBe(985);
  });

  it('ELO ne pada ispod 0', () => {
    expect(updateElo(10, 'loss')).toBe(0);
  });

  it('expectedScore je 0.5 za jednake, raste s prednošću', () => {
    expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 6);
    expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
  });

  it('outcomeFromScore poštuje stranu', () => {
    expect(outcomeFromScore(2, 1, 'home')).toBe('win');
    expect(outcomeFromScore(2, 1, 'away')).toBe('loss');
    expect(outcomeFromScore(1, 1, 'home')).toBe('draw');
  });

  it('matchmake pari susjedne po ELO', () => {
    const clubs = [{ elo: 1000 }, { elo: 1200 }, { elo: 800 }, { elo: 1100 }];
    const pairs = matchmakeBySimilarElo(clubs, mulberry32(1));
    expect(pairs).toHaveLength(2);
    // najjači (1200) uparen sa sljedećim najjačim (1100)
    expect(pairs[0].map((c) => c.elo).sort((a, b) => b - a)).toEqual([1200, 1100]);
  });

  it('eloFromOverall: 65 OVERALL -> baza', () => {
    expect(eloFromOverall(65)).toBe(1000);
    expect(eloFromOverall(75)).toBe(1150);
  });
});

describe('resolveByElo', () => {
  it('jači domaćin pobjeđuje češće nego što gubi', () => {
    let home = 0;
    let away = 0;
    const rng = mulberry32(5);
    for (let i = 0; i < 1000; i++) {
      const r = resolveByElo(1200, 900, rng);
      if (r === 'home') home += 1;
      else if (r === 'away') away += 1;
    }
    expect(home).toBeGreaterThan(away * 3);
  });
});

describe('runAmateurSeason (§8.1)', () => {
  const seasonClubs = () => generateAIClubs(20, { rng: mulberry32(42), eloRange: [850, 1150] });

  it('svaki klub odigra otprilike `days` mečeva (parno polje)', () => {
    const { table } = runAmateurSeason({ clubs: seasonClubs(), days: 30, rng: mulberry32(1) });
    for (const c of table) expect(c.played).toBe(30);
  });

  it('promoviše top 20% (§8.1)', () => {
    const { table, promotedCount } = runAmateurSeason({ clubs: seasonClubs(), days: 30, rng: mulberry32(2) });
    expect(promotedCount).toBe(4); // ceil(20 * 0.2)
    expect(table.filter((c) => c.promoted)).toHaveLength(4);
    // promovisani su prva 4 po rangu
    expect(table.slice(0, 4).every((c) => c.promoted)).toBe(true);
    expect(table[4].promoted).toBe(false);
  });

  it('isti seed -> identičan poredak (determinizam)', () => {
    const a = runAmateurSeason({ clubs: seasonClubs(), days: 30, rng: mulberry32(7) });
    const b = runAmateurSeason({ clubs: seasonClubs(), days: 30, rng: mulberry32(7) });
    expect(b.table.map((c) => c.name)).toEqual(a.table.map((c) => c.name));
    expect(b.table.map((c) => c.elo)).toEqual(a.table.map((c) => c.elo));
  });

  it('klub igrača iz postave dobija ELO iz prosječnog OVERALL-a', () => {
    const lineup = [{ overall: 80 }, { overall: 70 }];
    const club = playerClubFromLineup('Moj Klub', lineup);
    expect(club.isPlayer).toBe(true);
    expect(club.elo).toBe(eloFromOverall(75));
  });

  it('baca grešku za manje od 2 kluba', () => {
    expect(() => runAmateurSeason({ clubs: [{ elo: 1000 }] })).toThrow();
  });
});
