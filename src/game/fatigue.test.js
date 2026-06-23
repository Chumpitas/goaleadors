import { describe, it, expect } from 'vitest';
import {
  matchEnergyCost,
  applyMatchFatigue,
  dailyRecovery,
  recover,
  canPlay,
  lowEnergyPenaltyMultiplier,
  emergencyHealsPerWeek,
  energyStatus,
  BASE_DAILY_RECOVERY,
  ENERGY_MAX,
} from './fatigue.js';

describe('umor karata (§10.6)', () => {
  it('pun meč troši 20% (15 base + 5)', () => {
    expect(matchEnergyCost(90)).toBe(20);
    expect(matchEnergyCost(45)).toBeCloseTo(17.5, 5);
    expect(matchEnergyCost(0)).toBe(15);
  });

  it('applyMatchFatigue ne ide ispod 0', () => {
    expect(applyMatchFatigue(100)).toBe(80);
    expect(applyMatchFatigue(10)).toBe(0);
  });

  it('ispod 30% energije -10% statovima, inače bez penala', () => {
    expect(lowEnergyPenaltyMultiplier(29)).toBeCloseTo(0.9, 5);
    expect(lowEnergyPenaltyMultiplier(30)).toBe(1);
  });

  it('ispod 10% energije karta ne može igrati', () => {
    expect(canPlay(10)).toBe(true);
    expect(canPlay(9)).toBe(false);
  });

  it('status energije', () => {
    expect(energyStatus(100)).toBe('spremna');
    expect(energyStatus(20)).toBe('umorna');
    expect(energyStatus(5)).toBe('iscrpljena');
  });
});

describe('medicinski centar (§10.7)', () => {
  it('dnevni oporavak = baza + bonus po nivou', () => {
    expect(dailyRecovery(0)).toBe(BASE_DAILY_RECOVERY);
    expect(dailyRecovery(1)).toBe(30);
    expect(dailyRecovery(2)).toBe(40);
    expect(dailyRecovery(3)).toBe(50);
  });

  it('recover ne prelazi 100', () => {
    expect(recover(50, 2, 1)).toBe(90);
    expect(recover(90, 2, 1)).toBe(ENERGY_MAX);
    expect(recover(20, 3, 2)).toBe(ENERGY_MAX); // 20 + 50*2
  });

  it('hitna liječenja po sedmici rastu s nivoom', () => {
    expect(emergencyHealsPerWeek(1)).toBe(0);
    expect(emergencyHealsPerWeek(2)).toBe(1);
    expect(emergencyHealsPerWeek(3)).toBe(2);
  });
});
