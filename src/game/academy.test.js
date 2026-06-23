import { describe, it, expect } from 'vitest';
import { generateYouth, ACADEMY_LEVELS, DOMESTIC_RATE } from './academy.js';
import { mulberry32 } from './rng.js';

describe('akademija (§10.3)', () => {
  it('generiše tačan broj karata po nivou', () => {
    for (const [lvl, cfg] of Object.entries(ACADEMY_LEVELS)) {
      const youth = generateYouth(Number(lvl), { country: 'Španija', rng: mulberry32(Number(lvl)) });
      expect(youth).toHaveLength(cfg.cards);
    }
  });

  it('OVR je unutar raspona nivoa', () => {
    for (const [lvl, cfg] of Object.entries(ACADEMY_LEVELS)) {
      for (let s = 0; s < 20; s++) {
        const youth = generateYouth(Number(lvl), { country: 'Italija', rng: mulberry32(s + 1) });
        for (const c of youth) {
          expect(c.overall).toBeGreaterThanOrEqual(cfg.ovr[0]);
          expect(c.overall).toBeLessThanOrEqual(cfg.ovr[1]);
        }
      }
    }
  });

  it('nivoi 1 i 2 daju samo Common', () => {
    for (const lvl of [1, 2]) {
      for (let s = 0; s < 30; s++) {
        const youth = generateYouth(lvl, { country: 'Engleska', rng: mulberry32(s + 1) });
        expect(youth.every((c) => c.rarity === 'common')).toBe(true);
      }
    }
  });

  it('nivo 4 garantuje bar jednu Rare+', () => {
    for (let s = 0; s < 30; s++) {
      const youth = generateYouth(4, { country: 'Njemačka', rng: mulberry32(s + 1) });
      expect(youth.some((c) => c.rarity !== 'common')).toBe(true);
    }
  });

  it('većina karata je domaća (§10.3 ~85–90%)', () => {
    let domestic = 0;
    let total = 0;
    for (let s = 0; s < 100; s++) {
      const youth = generateYouth(5, { country: 'Francuska', rng: mulberry32(s + 1) });
      for (const c of youth) {
        total += 1;
        if (c.nationality === 'Francuska') domestic += 1;
      }
    }
    expect(domestic / total).toBeGreaterThan(0.7);
    expect(DOMESTIC_RATE).toBeGreaterThanOrEqual(0.85);
  });

  it('omladinske karte nose editionId aktivne edicije', () => {
    const youth = generateYouth(3, { country: 'Španija', editionCode: 'speed', rng: mulberry32(1) });
    expect(youth.every((c) => c.editionId === 'speed')).toBe(true);
  });

  it('baca grešku za nepoznat nivo', () => {
    expect(() => generateYouth(9)).toThrow();
  });
});
