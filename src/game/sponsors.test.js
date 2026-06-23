import { describe, it, expect } from 'vitest';
import {
  SPONSOR_TYPES,
  AGENCY_LEVELS,
  generateOffers,
  perSeasonPayout,
  maxActiveSponsors,
} from './sponsors.js';
import { mulberry32 } from './rng.js';

describe('sponzori (§10.8)', () => {
  it('tipovi imaju ispravna trajanja i iznose', () => {
    expect(SPONSOR_TYPES.lokalni).toMatchObject({ seasons: 1, amount: 3000 });
    expect(SPONSOR_TYPES.regionalni).toMatchObject({ seasons: 2, amount: 8000 });
    expect(SPONSOR_TYPES.premium).toMatchObject({ seasons: 3, amount: 20000 });
  });

  it('isplata po sezoni = iznos / trajanje', () => {
    expect(perSeasonPayout('lokalni')).toBe(3000);
    expect(perSeasonPayout('regionalni')).toBe(4000);
    expect(perSeasonPayout('premium')).toBe(6667); // round(20000/3)
  });

  it('nivo agencije određuje broj ponuda i dostupne tipove (§10.8)', () => {
    const lvl1 = generateOffers(1, mulberry32(1));
    expect(lvl1).toHaveLength(AGENCY_LEVELS[1].offers);
    expect(lvl1.every((o) => o.type === 'lokalni')).toBe(true);

    const lvl3 = generateOffers(3, mulberry32(2));
    expect(lvl3).toHaveLength(4);
    expect(lvl3.every((o) => ['lokalni', 'regionalni', 'premium'].includes(o.type))).toBe(true);
  });

  it('multi-slot tek na nivou 5', () => {
    expect(maxActiveSponsors(1)).toBe(1);
    expect(maxActiveSponsors(4)).toBe(1);
    expect(maxActiveSponsors(5)).toBe(2);
  });

  it('svaka ponuda nosi brand, perSeason i trajanje', () => {
    const offers = generateOffers(5, mulberry32(7));
    for (const o of offers) {
      expect(typeof o.brand).toBe('string');
      expect(o.perSeason).toBeGreaterThan(0);
      expect(o.seasons).toBeGreaterThanOrEqual(1);
    }
  });

  it('baca grešku za nepoznat nivo / tip', () => {
    expect(() => generateOffers(9)).toThrow();
    expect(() => perSeasonPayout('mega')).toThrow();
  });
});
