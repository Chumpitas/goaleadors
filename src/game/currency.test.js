import { describe, it, expect } from 'vitest';
import {
  CURRENCIES,
  KOVANICE_REWARDS,
  rollKovanice,
  matchReward,
  LOPTE_BUNDLES,
  bundleLopte,
  LOPTE_COSTS,
  canAfford,
  applyTransaction,
} from './currency.js';
import { grantStarterCards, starterCardCount, STARTER_COMPOSITION } from './starterPack.js';
import { generateEdition } from './editionGenerator.js';
import { mulberry32 } from './rng.js';

describe('valute (§6)', () => {
  it('roll nagrade je u zadatom rasponu', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 200; i++) {
      const v = rollKovanice('win', rng);
      expect(v).toBeGreaterThanOrEqual(KOVANICE_REWARDS.win[0]);
      expect(v).toBeLessThanOrEqual(KOVANICE_REWARDS.win[1]);
    }
  });

  it('matchReward poštuje ishod', () => {
    const rng = mulberry32(2);
    const loss = matchReward('loss', rng);
    expect(loss).toBeGreaterThanOrEqual(50);
    expect(loss).toBeLessThanOrEqual(100);
  });

  it('roll nepoznatog izvora baca grešku', () => {
    expect(() => rollKovanice('xyz')).toThrow();
  });

  it('Lopte paketi: medium ima +50 bonus (§6.3)', () => {
    const medium = LOPTE_BUNDLES.find((b) => b.id === 'medium');
    expect(bundleLopte(medium)).toBe(750);
    expect(LOPTE_BUNDLES.find((b) => b.id === 'mega').eur).toBe(59.99);
  });

  it('cijene u Lopticama postoje (§6.4)', () => {
    expect(LOPTE_COSTS.veteranToken).toBe(300);
    expect(LOPTE_COSTS.legendaryStadium).toBe(2000);
  });
});

describe('applyTransaction', () => {
  const base = { lopte: 100, kovanice: 1000 };

  it('kreditira i debitira ispravno', () => {
    const credit = applyTransaction(base, CURRENCIES.KOVANICE, 500, 'test');
    expect(credit.ok).toBe(true);
    expect(credit.balances.kovanice).toBe(1500);

    const debit = applyTransaction(base, CURRENCIES.LOPTE, -40, 'kupovina');
    expect(debit.ok).toBe(true);
    expect(debit.balances.lopte).toBe(60);
  });

  it('odbija debit ispod nule (ne mijenja balans)', () => {
    const res = applyTransaction(base, CURRENCIES.LOPTE, -200, 'preskupo');
    expect(res.ok).toBe(false);
    expect(res.balances).toBe(base);
  });

  it('canAfford radi', () => {
    expect(canAfford(1000, 999)).toBe(true);
    expect(canAfford(1000, 1001)).toBe(false);
  });

  it('baca na nepoznatu valutu', () => {
    expect(() => applyTransaction(base, 'zlato', 10, 'x')).toThrow();
  });
});

describe('starter pack (§7)', () => {
  const pool = generateEdition('foundations');

  // +1 Common po poziciji u odnosu na §7 raspored -> 17C/5R/1E = 23 (odluka vlasnika).
  it('kompozicija po poziciji je 17C + 5R + 1E = 23', () => {
    expect(starterCardCount()).toBe(23);
    const totals = STARTER_COMPOSITION.reduce(
      (a, r) => ({ common: a.common + r.common, rare: a.rare + r.rare, epic: a.epic + r.epic }),
      { common: 0, rare: 0, epic: 0 }
    );
    expect(totals).toEqual({ common: 17, rare: 5, epic: 1 });
  });

  it('grantStarterCards vrati 23 karte ispravnih rariteta/pozicija', () => {
    const cards = grantStarterCards(pool, mulberry32(5));
    expect(cards).toHaveLength(23);
    expect(cards.filter((c) => c.rarity === 'common')).toHaveLength(17);
    expect(cards.filter((c) => c.rarity === 'rare')).toHaveLength(5);
    expect(cards.filter((c) => c.rarity === 'epic')).toHaveLength(1);
    // sve 4 pozicije zastupljene
    for (const pos of ['GK', 'DEF', 'MID', 'ATT']) {
      expect(cards.filter((c) => c.position === pos).length).toBeGreaterThan(0);
    }
    expect(cards.filter((c) => c.position === 'GK')).toHaveLength(3);
  });
});
