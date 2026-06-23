import { describe, it, expect } from 'vitest';
import {
  generateEditionSchedule,
  editionStatus,
  activeEditions,
  legacyEditions,
  daysUntilRetire,
  seasonForDay,
  editionCode,
  EDITION_STATUS,
  SEASON_DAYS,
} from './editions.js';
import { legacyBonuses, LEGACY_RULES } from './legacy.js';

describe('kalendar edicija (§4)', () => {
  const schedule = generateEditionSchedule(6);

  it('prva edicija je "foundations" i izlazi na dan 1', () => {
    expect(schedule[0].code).toBe('foundations');
    expect(schedule[0].releaseDay).toBe(1);
    expect(editionCode('Speed', 2)).toBe('speed-2');
  });

  it('edicije izlaze svakih 30 dana i traju 90', () => {
    expect(schedule[1].releaseDay).toBe(31);
    expect(schedule[0].retireDay).toBe(91);
    expect(schedule[0].warnDay).toBe(76); // 15 dana upozorenja (§4.2)
  });

  it('status prati životni ciklus (§4.2)', () => {
    const e = schedule[0]; // rel 1, warn 76, retire 91
    expect(editionStatus(e, 1)).toBe(EDITION_STATUS.ACTIVE);
    expect(editionStatus(e, 75)).toBe(EDITION_STATUS.ACTIVE);
    expect(editionStatus(e, 76)).toBe(EDITION_STATUS.RETIRING);
    expect(editionStatus(e, 90)).toBe(EDITION_STATUS.RETIRING);
    expect(editionStatus(e, 91)).toBe(EDITION_STATUS.LEGACY);
  });

  it('u stabilnom stanju su 3 edicije aktivne paralelno (§4.1)', () => {
    const active = activeEditions(schedule, 100);
    expect(active).toHaveLength(3);
    expect(active.map((e) => e.index)).toEqual([2, 3, 4]);
  });

  it('legacyEditions hvata penzionisane', () => {
    expect(legacyEditions(schedule, 100).map((e) => e.index)).toEqual([1]);
    expect(daysUntilRetire(schedule[1], 100)).toBe(21);
  });

  it('seasonForDay računa sezonu', () => {
    expect(seasonForDay(1)).toBe(1);
    expect(seasonForDay(SEASON_DAYS)).toBe(1);
    expect(seasonForDay(SEASON_DAYS + 1)).toBe(2);
  });
});

describe('Legacy bonusi (§13.2)', () => {
  const card = (editionId, rarity = 'common', titleCard = false) => ({ editionId, rarity, titleCard });

  it('10 karata iste edicije daje +1% prihod po ediciji', () => {
    const cards = Array.from({ length: 10 }, () => card('foundations'));
    expect(legacyBonuses(cards).incomePct).toBe(LEGACY_RULES.incomePctPerEdition);
  });

  it('manje od 10 ne daje prihod bonus', () => {
    const cards = Array.from({ length: 9 }, () => card('foundations'));
    expect(legacyBonuses(cards).incomePct).toBe(0);
  });

  it('50 karata ukupno daje +2% navijačka baza', () => {
    const cards = Array.from({ length: 50 }, (_, i) => card(`ed-${i % 4}`));
    expect(legacyBonuses(cards).fanBasePct).toBe(LEGACY_RULES.fanBasePct);
  });

  it('5 legendarnih iste edicije = kompletna kolekcija', () => {
    const cards = Array.from({ length: 5 }, () => card('speed-2', 'legendary'));
    expect(legacyBonuses(cards).completedLegendaryEditions).toContain('speed-2');
  });

  it('broji titula karte', () => {
    const cards = [card('foundations', 'epic', true), card('foundations'), card('foundations', 'rare', true)];
    expect(legacyBonuses(cards).titleCards).toBe(2);
  });
});
