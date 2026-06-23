import { describe, it, expect } from 'vitest';
import {
  SCOUT_NETWORK_LEVELS,
  maxConcurrentScouts,
  availablePotentials,
  regionTargetingAllowed,
  missionDurationMs,
  missionCost,
  startMission,
  isComplete,
  resolveMission,
} from './scouting.js';
import { POTENTIAL_TYPES } from './talents.js';
import { mulberry32 } from './rng.js';

describe('scout mreža (SCOUT_SYSTEM_UPDATE)', () => {
  it('nivoi: concurrent skauti i dostupni potencijali', () => {
    expect(maxConcurrentScouts(1)).toBe(1);
    expect(maxConcurrentScouts(5)).toBe(5);
    expect(availablePotentials(1)).toEqual(['fast', 'standard']);
    expect(availablePotentials(5)).toContain('exceptional');
  });

  it('region targeting samo na nivou 5', () => {
    expect(regionTargetingAllowed(4)).toBe(false);
    expect(regionTargetingAllowed(5)).toBe(true);
  });

  it('trajanje skraćeno multiplikatorom nivoa', () => {
    const full = POTENTIAL_TYPES.fast.duration;
    expect(missionDurationMs('fast', 1)).toBe(full);
    expect(missionDurationMs('fast', 5)).toBe(Math.round(full * SCOUT_NETWORK_LEVELS[5].durationMultiplier));
  });

  it('cijena misije po potencijalu', () => {
    expect(missionCost('fast')).toBe(1000);
    expect(missionCost('exceptional')).toBe(12000);
  });

  it('startMission odbija nedostupan potencijal i region bez nivoa 5', () => {
    expect(() => startMission({ position: 'ATT', potentialType: 'exceptional' }, { level: 1 })).toThrow();
    expect(() => startMission({ position: 'ATT', potentialType: 'fast', region: 'africa' }, { level: 3 })).toThrow();
    expect(() => startMission({ position: 'ATT', potentialType: 'fast', region: 'africa' }, { level: 5 })).not.toThrow();
  });

  it('startMission postavlja completesAt', () => {
    const m = startMission({ position: 'MID', potentialType: 'standard' }, { level: 1, now: 1000 });
    expect(m.completesAt).toBe(1000 + POTENTIAL_TYPES.standard.duration);
    expect(isComplete(m, m.completesAt)).toBe(true);
  });

  it('resolveMission: uspjeh generiše talent, neuspjeh prazno', () => {
    const m = startMission({ position: 'ATT', potentialType: 'fast' }, { level: 1, now: 0 });
    let successes = 0;
    let talentsCount = 0;
    for (let s = 0; s < 200; s++) {
      const r = resolveMission(m, mulberry32(s + 1), 0);
      if (r.success) { successes += 1; talentsCount += r.talents.length; expect(r.talents[0].position).toBe('ATT'); }
      else expect(r.talents).toHaveLength(0);
    }
    // fast ima 80% uspjeha -> većina
    expect(successes).toBeGreaterThan(120);
    expect(talentsCount).toBeGreaterThanOrEqual(successes);
  });

  it('bonus talent moguć na nivou 5', () => {
    const m = startMission({ position: 'ATT', potentialType: 'fast' }, { level: 5, now: 0 });
    let twoTalentRuns = 0;
    for (let s = 0; s < 300; s++) {
      const r = resolveMission(m, mulberry32(s + 1), 0);
      if (r.talents.length === 2) twoTalentRuns += 1;
    }
    expect(twoTalentRuns).toBeGreaterThan(0);
  });
});
