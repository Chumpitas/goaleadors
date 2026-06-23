// Global game state (Zustand, §15.1). Phase-1 client-side only — no persistence yet.
import { create } from 'zustand';
import { generateEdition, drawCards } from '../game/editionGenerator.js';
import { openPack } from '../game/packs.js';

const EDITION = 'foundations';

export const useGameStore = create((set, get) => ({
  editionCode: EDITION,
  pool: generateEdition(EDITION), // 110-card active edition (§4.4)
  collection: [], // cards the player owns (user_cards, §15.2)
  pity: 0, // packs opened without a Legendary (§5.3)
  lastOpening: null, // cards revealed by the most recent pack open

  /** Open a pack, draw concrete cards, bank them and advance pity. */
  openAndCollect(packCode) {
    const { pool, pity } = get();
    const result = openPack(packCode, { pity });
    const cards = drawCards(pool, result.rarities);
    set((s) => ({
      collection: [...s.collection, ...cards],
      pity: result.pity,
      lastOpening: { cards, pack: result.pack, pityApplied: result.pityApplied },
    }));
    return cards;
  },

  clearOpening() {
    set({ lastOpening: null });
  },
}));
