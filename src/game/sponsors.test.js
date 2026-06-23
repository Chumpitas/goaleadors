import { describe, it, expect } from 'vitest';
import {
  OFFER_TEMPLATES,
  MAX_OFFERS,
  generateOffers,
  perSeasonAmount,
  maxActiveSponsors,
  AGENCY_LEVELS,
} from './sponsors.js';
import { mulberry32 } from './rng.js';

describe('sponzori (§10.8)', () => {
  it('nudi najviše 3 ponude po sezoni', () => {
    for (let lvl = 1; lvl <= 5; lvl++) {
      const offers = generateOffers(lvl, mulberry32(lvl));
      expect(offers.length).toBeLessThanOrEqual(MAX_OFFERS);
    }
  });

  it('ponude su suštinski različite (jedinstveni arhetipovi, ne duplikati)', () => {
    for (let s = 0; s < 30; s++) {
      const offers = generateOffers(5, mulberry32(s + 1));
      const keys = offers.map((o) => o.key);
      expect(new Set(keys).size).toBe(keys.length); // bez duplikata
    }
  });

  it('na nivou 1 ima 3 ponude (svi lokalni arhetipovi)', () => {
    const offers = generateOffers(1, mulberry32(1));
    expect(offers).toHaveLength(3);
    expect(offers.every((o) => o.type === 'lokalni')).toBe(true);
  });

  it('viši nivo otključava premium tier', () => {
    let sawPremium = false;
    for (let s = 0; s < 40 && !sawPremium; s++) {
      sawPremium = generateOffers(3, mulberry32(s + 1)).some((o) => o.type === 'premium');
    }
    expect(sawPremium).toBe(true);
  });

  it('ponude nose način isplate (odmah ili na rate)', () => {
    const offers = generateOffers(3, mulberry32(9));
    for (const o of offers) {
      expect(['upfront', 'installments']).toContain(o.payout);
      if (o.payout === 'installments') expect(o.perSeason).toBeGreaterThan(0);
      else expect(o.perSeason).toBe(0);
    }
  });

  it('postoje arhetipovi s bonusom na potpis i s pasivnim perkom', () => {
    const withSigning = OFFER_TEMPLATES.some((t) => Object.keys(t.signingBonus).length);
    const withPerk = OFFER_TEMPLATES.some((t) => Object.keys(t.perks).length);
    expect(withSigning).toBe(true);
    expect(withPerk).toBe(true);
  });

  it('perSeasonAmount = iznos / trajanje (zaokruženo)', () => {
    expect(perSeasonAmount(8000, 2)).toBe(4000);
    expect(perSeasonAmount(20000, 3)).toBe(6667);
  });

  it('multi-slot tek na nivou 5', () => {
    expect(maxActiveSponsors(1)).toBe(1);
    expect(maxActiveSponsors(4)).toBe(1);
    expect(maxActiveSponsors(5)).toBe(2);
    expect(AGENCY_LEVELS[5].slots).toBe(2);
  });

  it('baca grešku za nepoznat nivo', () => {
    expect(() => generateOffers(9)).toThrow();
  });
});
