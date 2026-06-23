import { describe, it, expect } from 'vitest';
import { computeOverall, OVERALL_WEIGHTS } from './overall.js';
import { POSITIONS } from './constants.js';
import { createCard } from './cards.js';

describe('OVERALL formula weights (§2.2)', () => {
  it('every position\'s weights sum to 1.0', () => {
    for (const pos of Object.values(POSITIONS)) {
      const sum = Object.values(OVERALL_WEIGHTS[pos]).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    }
  });

  it('ATT: Shooting 50 + Pace 25 + Passing 20 + Tackling 5', () => {
    const o = computeOverall({
      position: 'ATT',
      attributes: { shooting: 90, pace: 80, passing: 70, tackling: 40 },
    });
    // 90*.5 + 80*.25 + 70*.2 + 40*.05 = 45 + 20 + 14 + 2 = 81
    expect(o).toBe(81);
  });

  it('MID: Passing 40 + Shooting 25 + Pace 20 + Tackling 15', () => {
    const o = computeOverall({
      position: 'MID',
      attributes: { passing: 90, shooting: 70, pace: 75, tackling: 68 },
    });
    // 90*.4 + 70*.25 + 75*.2 + 68*.15 = 36 + 17.5 + 15 + 10.2 = 78.7 -> 79
    expect(o).toBe(79);
  });

  it('DEF: Tackling 45 + Pace 25 + Passing 20 + Shooting 10', () => {
    const o = computeOverall({
      position: 'DEF',
      attributes: { tackling: 85, pace: 72, passing: 66, shooting: 40 },
    });
    // 85*.45 + 72*.25 + 66*.2 + 40*.1 = 38.25 + 18 + 13.2 + 4 = 73.45 -> 73
    expect(o).toBe(73);
  });

  it('GK: Reflexes 45 + Positioning 35 + Passing 15 + Pace 5', () => {
    const o = computeOverall({
      position: 'GK',
      attributes: { reflexes: 78, positioning: 74, passing: 55, pace: 60 },
    });
    // 78*.45 + 74*.35 + 55*.15 + 60*.05 = 35.1 + 25.9 + 8.25 + 3 = 72.25 -> 72
    expect(o).toBe(72);
  });

  it('a perfect 100 card rates 100 at every position', () => {
    for (const pos of Object.values(POSITIONS)) {
      const attrs = { shooting: 100, passing: 100, tackling: 100, pace: 100, reflexes: 100, positioning: 100 };
      expect(computeOverall({ position: pos, attributes: attrs })).toBe(100);
    }
  });

  it('throws on an unknown position', () => {
    expect(() => computeOverall({ position: 'XYZ', attributes: {} })).toThrow();
  });
});

describe('card creation rules (§2.5 / §2.6)', () => {
  it('Common cards may not carry abilities', () => {
    expect(() =>
      createCard({
        name: 'X',
        position: 'ATT',
        rarity: 'common',
        attributes: { shooting: 80, pace: 80, passing: 60, tackling: 30 },
        abilities: ['dead_ball'],
      })
    ).toThrow();
  });

  it('Legendary cards allow two ability slots', () => {
    const card = createCard({
      name: 'Legend',
      position: 'ATT',
      rarity: 'legendary',
      attributes: { shooting: 95, pace: 90, passing: 80, tackling: 40 },
      abilities: ['target_man', 'anti_captain'],
    });
    expect(card.abilities).toHaveLength(2);
    expect(card.overall).toBeGreaterThan(0);
  });

  it('ignores attributes that do not belong to the position', () => {
    const gk = createCard({
      name: 'Keeper',
      position: 'GK',
      rarity: 'common',
      attributes: { reflexes: 80, positioning: 70, passing: 50, pace: 55, shooting: 99 },
    });
    expect(gk.attributes.shooting).toBeUndefined();
  });

  it('clamps attribute values to 0–100', () => {
    const card = createCard({
      name: 'Clamp',
      position: 'ATT',
      rarity: 'common',
      attributes: { shooting: 250, pace: -20, passing: 60, tackling: 30 },
    });
    expect(card.attributes.shooting).toBe(100);
    expect(card.attributes.pace).toBe(0);
  });
});
