import { describe, it, expect } from 'vitest';
import {
  generateReferralCode,
  REFERRAL_EVENTS,
  REFERRAL_TIERS,
  referralTier,
  tierMultiplier,
  resolveInviterReward,
  SECOND_LEVEL_PCT,
  SAMPLE_LOPTE_PURCHASE,
  VALIDATION_MATCHES,
} from './referral.js';
import { mulberry32 } from './rng.js';

describe('referral kod + događaji (§17.1/§17.2)', () => {
  it('kod je slug + broj', () => {
    expect(generateReferralCode('FC Madrid', mulberry32(1))).toMatch(/^FCMAD\d{2}$/);
    expect(generateReferralCode('', mulberry32(1))).toMatch(/^GOAL\d{2}$/);
  });

  it('događaji nagrađuju obje strane gdje spec kaže', () => {
    expect(REFERRAL_EVENTS.register.inviter.pack).toBe('zlatna');
    expect(REFERRAL_EVENTS.played7.inviter.kovanice).toBe(3000);
    expect(REFERRAL_EVENTS.played7.invitee.pack).toBe('zlatna');
    expect(REFERRAL_EVENTS.proLeague.invitee.pack).toBe('dijamantska');
    expect(VALIDATION_MATCHES).toBe(7);
  });
});

describe('tier sistem (§17.3)', () => {
  it('tier po broju validnih', () => {
    expect(referralTier(1).name).toBe('Scout');
    expect(referralTier(5).name).toBe('Agent');
    expect(referralTier(15).name).toBe('Director');
    expect(referralTier(30).name).toBe('Legenda');
    expect(referralTier(30).title).toBe(true);
    expect(REFERRAL_TIERS).toHaveLength(4);
  });

  it('multiplikator raste s tierom', () => {
    expect(tierMultiplier(1)).toBe(1.0);
    expect(tierMultiplier(5)).toBe(1.25);
    expect(tierMultiplier(15)).toBe(1.5);
    expect(tierMultiplier(30)).toBe(2.0);
  });
});

describe('resolveInviterReward', () => {
  it('skalira Kovanice multiplikatorom, kesice ne', () => {
    expect(resolveInviterReward({ kovanice: 3000 }, 1.25)).toEqual({ kovanice: 3750 });
    expect(resolveInviterReward({ pack: 'zlatna' }, 2)).toEqual({ pack: 'zlatna' });
  });

  it('loptePct se pretvara u Lopte iz uzorka', () => {
    const r = resolveInviterReward({ loptePct: 10 }, 1);
    expect(r.lopte).toBe(Math.round(SAMPLE_LOPTE_PURCHASE * 0.1));
  });

  it('drugi nivo daje 20% (preko multiplikatora)', () => {
    const mult = tierMultiplier(1) * (SECOND_LEVEL_PCT / 100);
    expect(resolveInviterReward({ kovanice: 3000 }, mult)).toEqual({ kovanice: 600 });
  });
});
