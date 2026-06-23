import { describe, it, expect } from 'vitest';
import {
  startMission,
  missionDurationMs,
  SCOUT_DURATION_HOURS,
  scoutSlots,
  isComplete,
  remainingMs,
  speedUpCost,
  resolveMission,
} from './scouting.js';
import { LOPTE_COSTS } from './currency.js';
import { generateEdition } from './editionGenerator.js';
import { mulberry32 } from './rng.js';

const HOUR = 3600 * 1000;
const pool = generateEdition('foundations');

describe('scout misije (§10.5)', () => {
  it('trajanje po raritetu odgovara spec-u', () => {
    expect(SCOUT_DURATION_HOURS).toEqual({ common: 4, rare: 12, epic: 48, legendary: 168 });
    expect(missionDurationMs('rare')).toBe(12 * HOUR);
  });

  it('slotovi rastu s nivoom (1→1, 3→3, 5→5)', () => {
    expect(scoutSlots(1)).toBe(1);
    expect(scoutSlots(3)).toBe(3);
    expect(scoutSlots(5)).toBe(5);
  });

  it('startMission postavlja finishesAt prema trajanju', () => {
    const m = startMission({ position: 'ATT', rarityFocus: 'epic' }, { level: 1, now: 1000 });
    expect(m.finishesAt).toBe(1000 + 48 * HOUR);
    expect(isComplete(m, m.finishesAt)).toBe(true);
    expect(isComplete(m, m.finishesAt - 1)).toBe(false);
  });

  it('odbija nevažeću poziciju i raritet', () => {
    expect(() => startMission({ position: 'XX', rarityFocus: 'rare' })).toThrow();
    expect(() => startMission({ position: 'ATT', rarityFocus: 'mythic' })).toThrow();
  });

  it('traženje ability-ja zahtijeva nivo 5', () => {
    expect(() => startMission({ position: 'ATT', rarityFocus: 'epic', ability: 'dribbler' }, { level: 3 })).toThrow();
    expect(() => startMission({ position: 'ATT', rarityFocus: 'epic', ability: 'dribbler' }, { level: 5 })).not.toThrow();
  });

  it('minOverall mora biti 0–100', () => {
    expect(() => startMission({ position: 'ATT', rarityFocus: 'rare', minOverall: 150 })).toThrow();
  });

  it('cijena ubrzanja pada kako vrijeme prolazi', () => {
    const m = startMission({ position: 'ATT', rarityFocus: 'rare' }, { now: 0 });
    const early = speedUpCost(m, 0);
    const later = speedUpCost(m, 6 * HOUR);
    expect(early).toBe(12 * LOPTE_COSTS.speedScoutHour);
    expect(later).toBeLessThan(early);
    expect(remainingMs(m, m.finishesAt)).toBe(0);
  });
});

describe('resolveMission', () => {
  it('poštuje poziciju, raritet i min OVR', () => {
    const m = startMission({ position: 'DEF', rarityFocus: 'rare', minOverall: 60 }, { level: 3, now: 0 });
    for (let s = 0; s < 30; s++) {
      const card = resolveMission(m, pool, mulberry32(s + 1));
      expect(card.position).toBe('DEF');
      expect(card.rarity).toBe('rare');
      expect(card.overall).toBeGreaterThanOrEqual(60);
    }
  });

  it('poštuje nacionalnost kad postoji kandidat', () => {
    // nađi nacionalnost koja postoji za DEF rare
    const defRares = pool.filter((c) => c.position === 'DEF' && c.rarity === 'rare');
    const nat = defRares[0].nationality;
    const m = startMission({ position: 'DEF', rarityFocus: 'rare', minOverall: 0, nationality: nat }, { level: 3, now: 0 });
    const card = resolveMission(m, pool, mulberry32(2));
    expect(card.nationality).toBe(nat);
  });

  it('viši nivo daje u prosjeku bolji OVR', () => {
    const mk = (level) => startMission({ position: 'ATT', rarityFocus: 'common', minOverall: 0 }, { level, now: 0 });
    const avg = (level) => {
      let sum = 0;
      const N = 80;
      for (let s = 0; s < N; s++) sum += resolveMission(mk(level), pool, mulberry32(s + 1)).overall;
      return sum / N;
    };
    expect(avg(5)).toBeGreaterThan(avg(1));
  });
});
