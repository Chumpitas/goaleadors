import { describe, it, expect } from 'vitest';
import { openPack, PACKS, PITY_THRESHOLD, ZLATNA_ODDS } from './packs.js';
import { mulberry32 } from './rng.js';
import { generateEdition, drawCards } from './editionGenerator.js';
import { EDITION_POOL } from './constants.js';

const seeded = (s) => mulberry32(s);

describe('pack catalog (§5.1)', () => {
  it('Zlatna odds match the spec exactly (§5.2)', () => {
    expect(PACKS.zlatna.odds).toEqual({ common: 0.6, rare: 0.3, epic: 0.09, legendary: 0.01 });
    expect(ZLATNA_ODDS.legendary).toBe(0.01);
  });

  it('Elite is not purchasable with Kovanice', () => {
    expect(PACKS.elite.priceKovanice).toBeNull();
  });
});

describe('openPack', () => {
  it('returns exactly the pack card count', () => {
    for (const code of Object.keys(PACKS)) {
      const res = openPack(code, { rng: seeded(1) });
      expect(res.rarities).toHaveLength(PACKS[code].cards);
    }
  });

  it('honors per-pack guarantees over many draws', () => {
    const ORDER = ['common', 'rare', 'epic', 'legendary'];
    const atLeastQuality = (rs, r) => rs.filter((x) => ORDER.indexOf(x) >= ORDER.indexOf(r)).length;
    for (let s = 0; s < 50; s++) {
      const rng = seeded(s + 1);
      // Srebrna: at least 3 commons exactly (lowest-tier floor).
      expect(openPack('srebrna', { rng }).rarities.filter((r) => r === 'common').length).toBeGreaterThanOrEqual(3);
      // Higher guarantees are "rarity or better".
      expect(atLeastQuality(openPack('zlatna', { rng }).rarities, 'rare')).toBeGreaterThanOrEqual(1);
      expect(atLeastQuality(openPack('dijamantska', { rng }).rarities, 'epic')).toBeGreaterThanOrEqual(1);
      expect(atLeastQuality(openPack('elite', { rng }).rarities, 'legendary')).toBeGreaterThanOrEqual(1);
    }
  });

  it('increments pity when no Legendary is pulled and resets when one is', () => {
    // Srebrna almost never yields a Legendary -> pity should advance.
    const res = openPack('srebrna', { rng: seeded(3), pity: 10 });
    if (res.pulledLegendary) {
      expect(res.pity).toBe(0);
    } else {
      expect(res.pity).toBe(11);
    }
    // Elite guarantees a Legendary -> pity always resets.
    const elite = openPack('elite', { rng: seeded(3), pity: 40 });
    expect(elite.pulledLegendary).toBe(true);
    expect(elite.pity).toBe(0);
  });

  it('pity guarantees a Legendary on the next eligible pack at threshold (§5.3)', () => {
    // Dijamantska is pity-eligible; at threshold it must contain a Legendary.
    const res = openPack('dijamantska', { rng: seeded(7), pity: PITY_THRESHOLD });
    expect(res.pityApplied).toBe(true);
    expect(res.rarities).toContain('legendary');
    expect(res.pity).toBe(0);
  });

  it('does not apply pity to ineligible packs', () => {
    const res = openPack('zlatna', { rng: seeded(7), pity: PITY_THRESHOLD + 5 });
    expect(res.pityApplied).toBe(false);
  });

  it('throws on an unknown pack', () => {
    expect(() => openPack('mythic')).toThrow();
  });
});

describe('edition generator (§4.4)', () => {
  const pool = generateEdition('foundations');

  it('produces 110 cards with the spec rarity split', () => {
    expect(pool).toHaveLength(EDITION_POOL.total);
    const byRarity = pool.reduce((a, c) => ((a[c.rarity] = (a[c.rarity] || 0) + 1), a), {});
    expect(byRarity).toEqual(EDITION_POOL.byRarity);
  });

  it('produces the spec position split', () => {
    const byPos = pool.reduce((a, c) => ((a[c.position] = (a[c.position] || 0) + 1), a), {});
    expect(byPos).toEqual(EDITION_POOL.byPosition);
  });

  it('is deterministic for a given edition code', () => {
    const again = generateEdition('foundations');
    expect(again[0].name).toBe(pool[0].name);
    expect(again[0].overall).toBe(pool[0].overall);
  });

  it('assigns abilities per rarity rules (§2.6)', () => {
    for (const c of pool) {
      const expected = { common: 0, rare: 1, epic: 2, legendary: 2 }[c.rarity];
      expect(c.abilities.length).toBeLessThanOrEqual(expected);
    }
  });

  it('drawCards maps drawn rarities to cards of that rarity', () => {
    const cards = drawCards(pool, ['legendary', 'common', 'epic'], seeded(2));
    expect(cards[0].rarity).toBe('legendary');
    expect(cards[1].rarity).toBe('common');
    expect(cards[2].rarity).toBe('epic');
  });
});
