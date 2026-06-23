import { describe, it, expect } from 'vitest';
import {
  PREMIUM_PRICES,
  LEGENDARY_STADIUMS,
  HISTORIC_CRESTS,
  SPECIAL_KITS,
  stadiumsForCountry,
  stadiumById,
} from './cosmeticsPremium.js';

describe('premium kosmetika (§9.4)', () => {
  it('cijene u Lopticama (§6.4)', () => {
    expect(PREMIUM_PRICES).toEqual({ stadium: 2000, crest: 500, kit: 300 });
  });

  it('stadioni su jedinstveni (1-of-1) i filtrirani po državi', () => {
    const ids = LEGENDARY_STADIUMS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const es = stadiumsForCountry('Španija');
    expect(es.length).toBeGreaterThan(0);
    expect(es.every((s) => s.country === 'Španija')).toBe(true);
  });

  it('svaka država ima bar jedan ZAUZET (preTaken) stadion', () => {
    const countries = [...new Set(LEGENDARY_STADIUMS.map((s) => s.country))];
    for (const c of countries) {
      expect(stadiumsForCountry(c).some((s) => s.preTaken)).toBe(true);
    }
  });

  it('historijski grbovi i special dresovi imaju katalog', () => {
    expect(HISTORIC_CRESTS.length).toBeGreaterThanOrEqual(5);
    expect(SPECIAL_KITS.every((k) => k.from && k.to)).toBe(true);
  });

  it('stadiumById', () => {
    expect(stadiumById('fr-parc').name).toBe('Le Parc');
    expect(stadiumById('x')).toBeNull();
  });
});
