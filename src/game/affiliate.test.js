import { describe, it, expect } from 'vitest';
import {
  MIN_AGE,
  AFFILIATE_ACTIONS,
  B2B_PACKAGES,
  BOOKMAKERS,
  eligibleBookmakers,
  bookmakerById,
  estimatedRevenueEUR,
  RESPONSIBLE_GAMBLING_NOTE,
} from './affiliate.js';

describe('affiliate B2B (§11)', () => {
  it('dobna granica i disclaimer postoje (§11.5)', () => {
    expect(MIN_AGE).toBe(18);
    expect(RESPONSIBLE_GAMBLING_NOTE).toMatch(/18\+/);
  });

  it('akcije nose nagrade za igrača (§11.2)', () => {
    expect(AFFILIATE_ACTIONS.link.playerBonus.kovanice).toBe(5000);
    expect(AFFILIATE_ACTIONS.register.playerBonus.kovanice).toBe(15000);
    expect(AFFILIATE_ACTIONS.register.playerBonus.pack).toBe('zlatna');
    expect(AFFILIATE_ACTIONS.firstDeposit.playerBonus.kovanice).toBe(5000);
  });

  it('geo-restriction: kladionice filtrirane po državi (§11.5)', () => {
    const it_ = eligibleBookmakers('Italija');
    expect(it_.length).toBeGreaterThan(0);
    expect(it_.every((b) => b.countries.includes('Italija'))).toBe(true);
    expect(eligibleBookmakers('Srbija')).toHaveLength(0); // nije podržana država
    expect(eligibleBookmakers()).toHaveLength(0);
  });

  it('exclusive kladionica je vezana za jednu državu (§11.4)', () => {
    const ex = BOOKMAKERS.find((b) => b.exclusive);
    expect(ex.pkg).toBe('exclusive');
    expect(ex.countries).toHaveLength(1);
  });

  it('B2B paketi: basic/premium/exclusive', () => {
    expect(Object.keys(B2B_PACKAGES)).toEqual(['basic', 'premium', 'exclusive']);
  });

  it('CPA registracije je u rasponu 20–50€', () => {
    expect(AFFILIATE_ACTIONS.register.revenueEUR).toEqual([20, 50]);
    expect(estimatedRevenueEUR('register')).toBe(35);
  });

  it('bookmakerById', () => {
    expect(bookmakerById('goldbet').name).toBe('GoldBet');
    expect(bookmakerById('x')).toBeNull();
  });
});
