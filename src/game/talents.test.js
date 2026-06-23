import { describe, it, expect } from 'vitest';
import {
  generateTalent,
  applySeasonalGrowth,
  checkAbilityMilestone,
  signingCost,
  trainingSlotsForLevel,
  isExpired,
  talentToCard,
  potentialToRarity,
  POTENTIAL_TYPES,
  GROWTH_RATES,
  TALENT_AVAILABILITY_WINDOW,
  MAX_TALENTS_PER_CLUB,
} from './talents.js';
import { computeOverall } from './overall.js';
import { buildLineup, simulateMatch } from './matchEngine.js';
import { generateEdition } from './editionGenerator.js';
import { mulberry32 } from './rng.js';

describe('scout talent (SCOUT_SYSTEM_UPDATE)', () => {
  it('generiše talent u start OVR rasponu, 5 sezona, 48h prozor', () => {
    const t = generateTalent({ position: 'ATT', potentialType: 'high' }, mulberry32(1), 1000);
    const pot = POTENTIAL_TYPES.high;
    expect(t.overall).toBeGreaterThanOrEqual(pot.startOVRRange[0]);
    expect(t.overall).toBeLessThanOrEqual(pot.startOVRRange[1]);
    expect(t.seasonsRemaining).toBe(5);
    expect(t.status).toBe('available');
    expect(t.availableUntil).toBe(1000 + TALENT_AVAILABILITY_WINDOW);
    expect(t.abilities).toEqual([]);
    expect(t.trainingSlot).toBeNull();
  });

  it('region targeting poštuje zadanu regiju', () => {
    const t = generateTalent({ position: 'MID', potentialType: 'standard', region: 'africa' }, mulberry32(2), 0);
    expect(t.region).toBe('africa');
  });

  it('MAX 5 talenata po klubu (konstanta)', () => {
    expect(MAX_TALENTS_PER_CLUB).toBe(5);
  });
});

describe('sezonski rast (SCOUT_SYSTEM_UPDATE)', () => {
  const base = () => ({
    ...generateTalent({ position: 'ATT', potentialType: 'exceptional' }, mulberry32(3), 0),
    overall: 60, shooting: 60, passing: 60, tackling: 60, pace: 60,
  });

  it('rast ovisi o trening slotu (2/5/8)', () => {
    expect(applySeasonalGrowth({ ...base(), trainingSlot: null }).talent.overall).toBe(60 + GROWTH_RATES.no_training);
    expect(applySeasonalGrowth({ ...base(), trainingSlot: 1 }).talent.overall).toBe(60 + GROWTH_RATES.training);
    expect(applySeasonalGrowth({ ...base(), trainingSlot: 2 }).talent.overall).toBe(60 + GROWTH_RATES.focus);
  });

  it('odbrojava sezonu i ne prelazi plafon potencijala', () => {
    const t = { ...base(), potential: 'fast', overall: 76, trainingSlot: 2 }; // fast ceiling 78
    const { talent } = applySeasonalGrowth(t);
    expect(talent.overall).toBe(78);
    expect(talent.seasonsRemaining).toBe(4);
  });

  it('otključava prvu individual ability na OVR 65 (100%)', () => {
    const t = { ...base(), overall: 60, trainingSlot: 2 }; // 60 -> 68 prelazi 65
    const { talent, unlockedAbility } = applySeasonalGrowth(t, mulberry32(5));
    expect(unlockedAbility).toBeTruthy();
    expect(talent.abilities).toHaveLength(1);
  });

  it('checkAbilityMilestone: ispod praga ne otključava', () => {
    expect(checkAbilityMilestone(60, 64, 'ATT', mulberry32(1))).toBeNull();
  });
});

describe('potpis i slotovi', () => {
  it('cijena potpisa po potencijalu', () => {
    expect(signingCost('fast')).toBe(800);
    expect(signingCost('exceptional')).toBe(8000);
    expect(() => signingCost('mega')).toThrow();
  });

  it('trening slotovi po nivou centra (1-2:0, 3:1, 4:2, 5:3)', () => {
    expect(trainingSlotsForLevel(2)).toBe(0);
    expect(trainingSlotsForLevel(3)).toBe(1);
    expect(trainingSlotsForLevel(5)).toBe(3);
  });

  it('isExpired tačan nakon prozora', () => {
    const t = generateTalent({ position: 'GK', potentialType: 'fast' }, mulberry32(1), 0);
    expect(isExpired(t, t.availableUntil - 1)).toBe(false);
    expect(isExpired(t, t.availableUntil + 1)).toBe(true);
  });
});

describe('talentToCard adapter (integracija u meč)', () => {
  it('outfield talent → karta s 4 atributa i mapom rariteta', () => {
    const t = generateTalent({ position: 'ATT', potentialType: 'exceptional' }, mulberry32(3), 0);
    const card = talentToCard(t);
    expect(card.position).toBe('ATT');
    expect(card.rarity).toBe(potentialToRarity('exceptional')); // legendary
    expect(card.attributes).toHaveProperty('shooting');
    expect(card.isTalent).toBe(true);
  });

  it('GK talent → GK atributi (REFLEXES/POSITIONING), kompatibilan s OVERALL', () => {
    const t = { ...generateTalent({ position: 'GK', potentialType: 'high' }, mulberry32(4), 0), overall: 80, passing: 70, pace: 60 };
    const card = talentToCard(t);
    expect(card.attributes).toHaveProperty('reflexes');
    expect(card.attributes).toHaveProperty('positioning');
    expect(card.attributes).not.toHaveProperty('shooting');
    // OVERALL formula radi bez greške i daje smislen broj
    expect(computeOverall(card)).toBeGreaterThan(60);
  });

  it('simulateMatch radi s postavom koja sadrži talente (uklj. GK)', () => {
    const pool = generateEdition('foundations');
    const talents = [
      talentToCard({ ...generateTalent({ position: 'GK', potentialType: 'high' }, mulberry32(1), 0), overall: 82, passing: 70, pace: 60 }),
      talentToCard({ ...generateTalent({ position: 'ATT', potentialType: 'exceptional' }, mulberry32(2), 0), overall: 90, shooting: 92, passing: 70, tackling: 40, pace: 90 }),
    ];
    const home = { cards: buildLineup(pool, '4-3-3', { extra: talents }), formation: '4-3-3', style: 'High Press', mentality: 'Attacking', isHome: true };
    const away = { cards: buildLineup(pool, '4-4-2'), formation: '4-4-2', style: 'Possession', mentality: 'Balanced' };
    const res = simulateMatch(home, away, { seed: 'talent-mec' });
    expect(res.score.home).toBeGreaterThanOrEqual(0);
    // talenti su zaista u postavi
    expect(home.cards.some((c) => c.isTalent)).toBe(true);
  });
});
