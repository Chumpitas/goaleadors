// Global game state (Zustand, §15.1). Phase-1 client-side only — no persistence yet.
import { create } from 'zustand';
import { generateEdition, drawCards } from '../game/editionGenerator.js';
import { openPack, packByCode } from '../game/packs.js';
import { CURRENCIES, applyTransaction, matchReward } from '../game/currency.js';
import { grantStarterCards, STARTER_BONUS } from '../game/starterPack.js';

const EDITION = 'foundations';

export const useGameStore = create((set, get) => ({
  editionCode: EDITION,
  pool: generateEdition(EDITION), // 110-card active edition (§4.4)
  collection: [], // cards the player owns (user_cards, §15.2)
  pity: 0, // packs opened without a Legendary (§5.3)
  lastOpening: null, // cards revealed by the most recent pack open
  club: null, // klub identitet iz onboardinga (§9)

  // Valute (§6) + ledger (transactions, §15.2)
  lopte: 0,
  kovanice: 0,
  transactions: [],
  starterClaimed: false,

  /** Interni helper: primijeni transakciju na balanse i upiši u ledger. */
  _tx(currency, amount, reason) {
    const { lopte, kovanice } = get();
    const res = applyTransaction({ lopte, kovanice }, currency, amount, reason);
    if (!res.ok) return false;
    set((s) => ({
      lopte: res.balances.lopte,
      kovanice: res.balances.kovanice,
      transactions: [res.entry, ...s.transactions].slice(0, 100),
    }));
    return true;
  },

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

  /**
   * Kupi i otvori kesicu plaćajući valutom (§5.1/§6).
   * @returns {{ ok: boolean, reason?: string, cards?: object[] }}
   */
  buyPack(packCode, currency = CURRENCIES.KOVANICE) {
    const pack = packByCode(packCode);
    if (!pack) return { ok: false, reason: 'nepoznata kesica' };
    const price = currency === CURRENCIES.LOPTE ? pack.priceLopte : pack.priceKovanice;
    if (price == null) return { ok: false, reason: 'nije dostupno za tu valutu' };
    if (get()[currency] < price) return { ok: false, reason: 'nedovoljno sredstava' };

    get()._tx(currency, -price, `kupovina:${packCode}`);
    const cards = get().openAndCollect(packCode);
    return { ok: true, cards };
  },

  /** Dodijeli starter pack jednom (§7): karte + Kovanice + Zlatna kesica. */
  claimStarter() {
    if (get().starterClaimed) return;
    const starterCards = grantStarterCards(get().pool);
    set((s) => ({
      collection: [...s.collection, ...starterCards],
      starterClaimed: true,
    }));
    get()._tx(CURRENCIES.KOVANICE, STARTER_BONUS.kovanice, 'starter:kovanice');
    for (const code of STARTER_BONUS.packs) get().openAndCollect(code);
  },

  /** Snimi/izmijeni klub identitet; pri prvom osnivanju dodjeljuje starter. */
  setClub(club) {
    const first = !get().club;
    set({ club });
    if (first) get().claimStarter();
  },

  resetClub() {
    set({ club: null });
  },

  /** Pripiši nagradu u Kovanicama za ishod meča (§6.2). */
  rewardMatch(outcome) {
    const amount = matchReward(outcome);
    get()._tx(CURRENCIES.KOVANICE, amount, `mec:${outcome}`);
    return amount;
  },

  clearOpening() {
    set({ lastOpening: null });
  },
}));
