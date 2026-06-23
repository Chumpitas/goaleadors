// Global game state (Zustand, §15.1). Phase-1 client-side only — no persistence yet.
import { create } from 'zustand';
import { generateEdition, drawCards } from '../game/editionGenerator.js';
import { openPack, packByCode } from '../game/packs.js';
import { CURRENCIES, applyTransaction, matchReward } from '../game/currency.js';
import { grantStarterCards, STARTER_BONUS } from '../game/starterPack.js';
import { trainCard, TRAINING_COST_KOVANICE } from '../game/training.js';
import { generateYouth } from '../game/academy.js';
import { startMission, isComplete, resolveMission, speedUpCost, scoutSlots } from '../game/scouting.js';
import { generateEditionSchedule, legacyEditions } from '../game/editions.js';
import {
  applyMatchFatigue,
  recover,
  emergencyHealsPerWeek,
  ENERGY_MAX,
} from '../game/fatigue.js';

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

  /**
   * Treniraj kartu iz kolekcije (§10.4): plati Kovanice, pojačaj fokus stat.
   * @returns {{ ok: boolean, reason?: string, applied?: number, capped?: boolean }}
   */
  trainCardAt(index, focusAttr) {
    const card = get().collection[index];
    if (!card) return { ok: false, reason: 'nema karte' };
    if ((card.trainingBoost ?? 0) >= 10) return { ok: false, reason: 'maksimalno istrenirana' };
    if (get().kovanice < TRAINING_COST_KOVANICE) return { ok: false, reason: 'nedovoljno Kovanica' };

    const res = trainCard(card, focusAttr);
    if (res.applied <= 0) return { ok: false, reason: 'stat na maksimumu' };

    get()._tx(CURRENCIES.KOVANICE, -TRAINING_COST_KOVANICE, 'trening');
    set((s) => {
      const collection = s.collection.slice();
      collection[index] = res.card;
      return { collection };
    });
    return { ok: true, applied: res.applied, capped: res.capped };
  },

  // Edicije + Legacy (§4, §13) i umor (§10.6–10.7)
  currentDay: 1,
  editionSchedule: generateEditionSchedule(6),
  legacy: [], // penzionisane karte
  medicalLevel: 2, // medicinski centar (§10.7)
  emergencyHealsUsed: 0, // potrošeno ove sedmice

  /**
   * Napreduj kalendar: penzioniši edicije u Legacy (§4.2), oporavi energiju karata
   * (§10.6/§10.7) i resetuj sedmična hitna liječenja.
   */
  advanceDay(days = 1) {
    const prevDay = get().currentDay;
    const nextDay = prevDay + days;
    const level = get().medicalLevel;
    const legacyCodes = new Set(legacyEditions(get().editionSchedule, nextDay).map((e) => e.code));
    const weekChanged = Math.floor((nextDay - 1) / 7) !== Math.floor((prevDay - 1) / 7);

    set((s) => {
      const recovered = s.collection.map((c) =>
        legacyCodes.has(c.editionId) ? c : { ...c, energy: recover(c.energy ?? ENERGY_MAX, level, days) }
      );
      const toLegacy = recovered.filter((c) => legacyCodes.has(c.editionId));
      const remaining = recovered.filter((c) => !legacyCodes.has(c.editionId));
      return {
        currentDay: nextDay,
        collection: remaining,
        legacy: toLegacy.length ? [...s.legacy, ...toLegacy] : s.legacy,
        emergencyHealsUsed: weekChanged ? 0 : s.emergencyHealsUsed,
      };
    });
  },

  setMedicalLevel(level) {
    set({ medicalLevel: level });
  },

  /** DEMO: odigraj meč jedne karte → potroši energiju (§10.6). */
  drainCardEnergy(index, minutes = 90) {
    set((s) => {
      const collection = s.collection.slice();
      const c = collection[index];
      if (!c) return {};
      collection[index] = { ...c, energy: applyMatchFatigue(c.energy ?? ENERGY_MAX, minutes) };
      return { collection };
    });
  },

  /** Hitno liječenje karte na puno (§10.7), uz sedmični limit po nivou. */
  emergencyHeal(index) {
    const limit = emergencyHealsPerWeek(get().medicalLevel);
    if (get().emergencyHealsUsed >= limit) return { ok: false, reason: 'nema hitnih liječenja ove sedmice' };
    set((s) => {
      const collection = s.collection.slice();
      const c = collection[index];
      if (!c) return {};
      collection[index] = { ...c, energy: ENERGY_MAX };
      return { collection, emergencyHealsUsed: s.emergencyHealsUsed + 1 };
    });
    return { ok: true };
  },

  // Scout mreža (§10.5)
  scoutLevel: 3,
  scoutMissions: [],

  /** Pokreni scout misiju ako ima slobodnog skauta. */
  startScout(params) {
    const { scoutLevel, scoutMissions } = get();
    if (scoutMissions.length >= scoutSlots(scoutLevel)) {
      return { ok: false, reason: 'svi skauti zauzeti' };
    }
    let mission;
    try {
      mission = startMission(params, { level: scoutLevel });
    } catch (e) {
      return { ok: false, reason: e.message };
    }
    set((s) => ({ scoutMissions: [...s.scoutMissions, mission] }));
    return { ok: true, mission };
  },

  /** Ubrzaj misiju Lopticama (§6.4). */
  speedUpScout(id) {
    const mission = get().scoutMissions.find((m) => m.id === id);
    if (!mission) return { ok: false, reason: 'nema misije' };
    const cost = speedUpCost(mission);
    if (get().lopte < cost) return { ok: false, reason: 'nedovoljno Loptica' };
    get()._tx(CURRENCIES.LOPTE, -cost, 'scout:ubrzanje');
    set((s) => ({
      scoutMissions: s.scoutMissions.map((m) => (m.id === id ? { ...m, finishesAt: Date.now() } : m)),
    }));
    return { ok: true };
  },

  /** Preuzmi kartu sa završene misije. */
  collectScout(id) {
    const mission = get().scoutMissions.find((m) => m.id === id);
    if (!mission) return { ok: false, reason: 'nema misije' };
    if (!isComplete(mission)) return { ok: false, reason: 'misija u toku' };
    const card = resolveMission(mission, get().pool);
    set((s) => ({
      collection: card ? [...s.collection, card] : s.collection,
      scoutMissions: s.scoutMissions.filter((m) => m.id !== id),
    }));
    return { ok: true, card };
  },

  /** DEMO: preskoči vrijeme misije (bez troška) radi isprobavanja. */
  skipScoutTime(id) {
    set((s) => ({
      scoutMissions: s.scoutMissions.map((m) => (m.id === id ? { ...m, finishesAt: Date.now() } : m)),
    }));
  },

  cancelScout(id) {
    set((s) => ({ scoutMissions: s.scoutMissions.filter((m) => m.id !== id) }));
  },

  /** Generiši omladince iz akademije (§10.3) — besplatno, dodaje u kolekciju. */
  runAcademy(level = 1) {
    const { club, editionCode } = get();
    const youth = generateYouth(level, { country: club?.country, editionCode });
    set((s) => ({ collection: [...s.collection, ...youth] }));
    return youth;
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
