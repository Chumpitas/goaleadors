import { describe, it, expect } from 'vitest';
import {
  TRADE_FEE_PCT,
  netProceeds,
  feeAmount,
  suggestedPrice,
  generateMarketListings,
} from './market.js';
import { generateEdition } from './editionGenerator.js';
import { mulberry32 } from './rng.js';

const pool = generateEdition('foundations');

describe('trade tržište (§5.4)', () => {
  it('trade fee je 5% i ide u sink', () => {
    expect(TRADE_FEE_PCT).toBe(5);
    expect(netProceeds(1000)).toBe(950);
    expect(feeAmount(1000)).toBe(50);
  });

  it('suggestedPrice raste s raritetom i OVERALL-om', () => {
    const common = { rarity: 'common', overall: 60 };
    const legendary = { rarity: 'legendary', overall: 90 };
    expect(suggestedPrice(legendary)).toBeGreaterThan(suggestedPrice(common));
    expect(suggestedPrice({ rarity: 'rare', overall: 70 })).toBe(800);
  });

  it('generateMarketListings vraća N oglasa s cijenom i kartom', () => {
    const listings = generateMarketListings(pool, 8, mulberry32(1));
    expect(listings).toHaveLength(8);
    for (const l of listings) {
      expect(l.card).toBeTruthy();
      expect(l.price).toBeGreaterThanOrEqual(50);
      expect(l.legacy).toBe(false);
    }
  });

  it('legacy flag se prenosi', () => {
    const listings = generateMarketListings(pool, 3, mulberry32(2), { legacy: true });
    expect(listings.every((l) => l.legacy === true)).toBe(true);
  });
});
