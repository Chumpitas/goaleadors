import { describe, it, expect } from 'vitest';
import {
  trainCard,
  applyPassiveBoost,
  focusOptions,
  MAX_TRAINING_BOOST,
  PASSIVE_BOOST_BY_LEVEL,
  ACTIVE_BOOST_RANGE,
} from './training.js';
import { createCard } from './cards.js';
import { mulberry32 } from './rng.js';

const att = () =>
  createCard({ name: 'T', position: 'ATT', rarity: 'common', attributes: { shooting: 70, passing: 50, tackling: 30, pace: 60 } });

describe('trainCard (§10.4)', () => {
  it('pojača fokus stat za 3–5 i ponovo izračuna OVERALL', () => {
    const c = att();
    const before = c.overall;
    const { card, applied } = trainCard(c, 'shooting', mulberry32(1));
    expect(applied).toBeGreaterThanOrEqual(ACTIVE_BOOST_RANGE[0]);
    expect(applied).toBeLessThanOrEqual(ACTIVE_BOOST_RANGE[1]);
    expect(card.attributes.shooting).toBe(70 + applied);
    expect(card.overall).toBeGreaterThan(before);
  });

  it('ne prelazi ukupni boost od +10', () => {
    let c = att();
    for (let i = 0; i < 10; i++) c = trainCard(c, 'shooting', mulberry32(i + 1)).card;
    expect(c.trainingBoost).toBeLessThanOrEqual(MAX_TRAINING_BOOST);
    // dalji trening ne dodaje ništa
    const res = trainCard(c, 'shooting', mulberry32(99));
    expect(res.applied).toBe(0);
    expect(res.capped).toBe(true);
  });

  it('ne prelazi 100 na atributu', () => {
    let c = createCard({ name: 'X', position: 'ATT', rarity: 'common', attributes: { shooting: 99, passing: 50, tackling: 30, pace: 60 } });
    const { card, applied } = trainCard(c, 'shooting', mulberry32(3));
    expect(card.attributes.shooting).toBeLessThanOrEqual(100);
    expect(applied).toBeLessThanOrEqual(1);
  });

  it('baca grešku za nevažeći fokus', () => {
    expect(() => trainCard(att(), 'reflexes', mulberry32(1))).toThrow();
  });

  it('focusOptions zavisi od pozicije', () => {
    expect(focusOptions('GK')).toContain('reflexes');
    expect(focusOptions('ATT')).toContain('shooting');
    expect(focusOptions('ATT')).not.toContain('reflexes');
  });
});

describe('applyPassiveBoost (§10.4)', () => {
  it('dodaje +N svim atributima po nivou', () => {
    const c = att();
    const boosted = applyPassiveBoost(c, 3);
    expect(boosted.attributes.shooting).toBe(73);
    expect(boosted.attributes.pace).toBe(63);
    expect(PASSIVE_BOOST_BY_LEVEL[5]).toBe(5);
  });

  it('nivo bez boosta vraća kartu nepromijenjenu', () => {
    const c = att();
    expect(applyPassiveBoost(c, 0)).toBe(c);
  });
});
