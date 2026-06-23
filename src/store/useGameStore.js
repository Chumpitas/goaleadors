// Global game state (Zustand, §15.1). Phase-1 client-side only — no persistence yet.
import { create } from 'zustand';
import { generateEdition, drawCards } from '../game/editionGenerator.js';
import { openPack, packByCode } from '../game/packs.js';
import { CURRENCIES, applyTransaction, matchReward } from '../game/currency.js';
import { grantStarterCards, STARTER_BONUS } from '../game/starterPack.js';
import { trainCard, TRAINING_COST_KOVANICE } from '../game/training.js';
import { generateYouth } from '../game/academy.js';
import { startMission, isComplete, resolveMission, maxConcurrentScouts, missionCost } from '../game/scouting.js';
import {
  signingCost,
  trainingSlotsForLevel,
  applySeasonalGrowth,
  isExpired,
  MAX_TALENTS_PER_CLUB,
} from '../game/talents.js';
import { generateEditionSchedule, legacyEditions, seasonForDay } from '../game/editions.js';
import { generateOffers, maxActiveSponsors } from '../game/sponsors.js';
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

  // Marketinška agencija + sponzori (§10.8)
  agencyLevel: 3,
  sponsorOffers: [],
  activeSponsors: [],

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

    // Sezonska isplata sponzora (§10.8).
    const seasonsCrossed = seasonForDay(nextDay) - seasonForDay(prevDay);
    if (seasonsCrossed > 0 && get().activeSponsors.length) {
      let payout = 0;
      const remaining = [];
      for (const sp of get().activeSponsors) {
        const seasonsPaid = Math.min(seasonsCrossed, sp.seasonsLeft);
        // Samo ugovori "na rate" plaćaju po sezoni; upfront je već isplaćen na potpis.
        if (sp.payout === 'installments') payout += sp.perSeason * seasonsPaid;
        const left = sp.seasonsLeft - seasonsPaid;
        if (left > 0) remaining.push({ ...sp, seasonsLeft: left });
      }
      if (payout > 0) get()._tx(CURRENCIES.KOVANICE, payout, 'sponzor:sezona');
      set({ activeSponsors: remaining });
    }

    // Sezonski rast potpisanih talenata; penzija nakon 5 sezona (SCOUT_SYSTEM_UPDATE).
    if (seasonsCrossed > 0 && get().talents.some((t) => t.status === 'signed')) {
      for (let i = 0; i < seasonsCrossed; i++) {
        const retiring = [];
        const kept = [];
        for (const t of get().talents) {
          if (t.status !== 'signed') {
            kept.push(t);
            continue;
          }
          const { talent } = applySeasonalGrowth(t);
          if (talent.seasonsRemaining <= 0) retiring.push({ ...talent, status: 'released', seasonsPlayed: 5, peakOVR: talent.overall });
          else kept.push(talent);
        }
        set((s) => ({ talents: kept, legacyTalents: retiring.length ? [...s.legacyTalents, ...retiring] : s.legacyTalents }));
      }
    }
  },

  setAgencyLevel(level) {
    set({ agencyLevel: level, sponsorOffers: [] });
  },

  /** Generiši nove sezonske sponzorske ponude (§10.8). */
  generateSponsorOffers() {
    set({ sponsorOffers: generateOffers(get().agencyLevel) });
  },

  /** Potpiši sponzora ako ima slobodan slot; isplati bonus na potpis i upfront (§10.8). */
  signSponsor(offerId) {
    const offer = get().sponsorOffers.find((o) => o.id === offerId);
    if (!offer) return { ok: false, reason: 'nema ponude' };
    if (get().activeSponsors.length >= maxActiveSponsors(get().agencyLevel)) {
      return { ok: false, reason: 'svi slotovi popunjeni' };
    }

    // Bonus na potpis.
    const sb = offer.signingBonus || {};
    if (sb.kovanice) get()._tx(CURRENCIES.KOVANICE, sb.kovanice, `sponzor:potpis:${offer.brand}`);
    if (sb.lopte) get()._tx(CURRENCIES.LOPTE, sb.lopte, `sponzor:potpis:${offer.brand}`);
    if (sb.pack) get().openAndCollect(sb.pack);

    // Isplata odmah (upfront) — cijeli iznos na potpis.
    if (offer.payout === 'upfront') {
      get()._tx(CURRENCIES.KOVANICE, offer.amount, `sponzor:upfront:${offer.brand}`);
    }

    set((s) => ({
      activeSponsors: [...s.activeSponsors, { ...offer, seasonsLeft: offer.seasons }],
      sponsorOffers: s.sponsorOffers.filter((o) => o.id !== offerId),
    }));
    return { ok: true };
  },

  /** Ukupan bonus na Kovanice iz mečeva od aktivnih sponzora (§10.8 perk). */
  sponsorMatchIncomePct() {
    return get().activeSponsors.reduce((sum, sp) => sum + (sp.perks?.matchIncomePct || 0), 0);
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

  // Scout mreža — mladi talenti (SCOUT_SYSTEM_UPDATE)
  scoutLevel: 3, // nivo scout mreže
  trainingCenterLevel: 3, // određuje trening slotove za talente
  scoutMissions: [],
  talents: [], // status: available | signed
  legacyTalents: [], // penzionisani/otpušteni talenti (sjećanje)

  /** Pokreni scout misiju za talenta (plaća se Kovanicama). */
  startScout(params) {
    const { scoutLevel, scoutMissions } = get();
    if (scoutMissions.length >= maxConcurrentScouts(scoutLevel)) {
      return { ok: false, reason: 'svi skauti zauzeti' };
    }
    let cost;
    try {
      cost = missionCost(params.potentialType);
    } catch (e) {
      return { ok: false, reason: e.message };
    }
    if (get().kovanice < cost) return { ok: false, reason: 'nedovoljno Kovanica' };

    let mission;
    try {
      mission = startMission(params, { level: scoutLevel });
    } catch (e) {
      return { ok: false, reason: e.message };
    }
    get()._tx(CURRENCIES.KOVANICE, -cost, `scout:${params.potentialType}`);
    set((s) => ({ scoutMissions: [...s.scoutMissions, mission] }));
    return { ok: true, mission };
  },

  /** Razriješi završenu misiju → talent(i) u 'available' status (48h prozor). */
  resolveScout(id) {
    const mission = get().scoutMissions.find((m) => m.id === id);
    if (!mission) return { ok: false, reason: 'nema misije' };
    if (!isComplete(mission)) return { ok: false, reason: 'misija u toku' };
    const result = resolveMission(mission);
    set((s) => ({
      talents: [...s.talents, ...result.talents],
      scoutMissions: s.scoutMissions.filter((m) => m.id !== id),
    }));
    return { ok: true, success: result.success, talents: result.talents };
  },

  /** Potpiši dostupnog talenta (§ potpis): plati Kovanice, max 5 u klubu. */
  signTalent(id) {
    const t = get().talents.find((x) => x.id === id);
    if (!t) return { ok: false, reason: 'nema talenta' };
    if (t.status !== 'available') return { ok: false, reason: 'talent nije dostupan' };
    if (isExpired(t)) return { ok: false, reason: 'prozor istekao' };
    const signed = get().talents.filter((x) => x.status === 'signed').length;
    if (signed >= MAX_TALENTS_PER_CLUB) return { ok: false, reason: 'maksimum 5 talenata' };
    const cost = signingCost(t.potential);
    if (get().kovanice < cost) return { ok: false, reason: 'nedovoljno Kovanica' };

    get()._tx(CURRENCIES.KOVANICE, -cost, `talent:potpis:${t.potential}`);
    set((s) => ({
      talents: s.talents.map((x) => (x.id === id ? { ...x, status: 'signed', signedAt: Date.now() } : x)),
    }));
    return { ok: true };
  },

  /** Otpusti talenta → odlazi u Legacy (sjećanje), oslobađa slot. */
  releaseTalent(id) {
    const t = get().talents.find((x) => x.id === id);
    if (!t) return;
    set((s) => ({
      talents: s.talents.filter((x) => x.id !== id),
      legacyTalents: [...s.legacyTalents, { ...t, status: 'released', seasonsPlayed: 5 - t.seasonsRemaining, peakOVR: t.overall }],
    }));
  },

  /** Dodijeli trening slot talentu: null | 1 (standard) | 2 (focus). */
  setTalentTrainingSlot(id, slot) {
    const available = trainingSlotsForLevel(get().trainingCenterLevel);
    const used = get().talents
      .filter((x) => x.status === 'signed' && x.id !== id)
      .reduce((sum, x) => sum + (x.trainingSlot === 2 ? 2 : x.trainingSlot === 1 ? 1 : 0), 0);
    const need = slot === 2 ? 2 : slot === 1 ? 1 : 0;
    if (used + need > available) return { ok: false, reason: 'nema dovoljno trening slotova' };
    set((s) => ({ talents: s.talents.map((x) => (x.id === id ? { ...x, trainingSlot: slot } : x)) }));
    return { ok: true };
  },

  setTrainingCenterLevel(level) {
    set({ trainingCenterLevel: level });
  },

  /** Ukloni istekle dostupne talente (48h FOMO). */
  pruneExpiredTalents() {
    set((s) => ({ talents: s.talents.filter((t) => !isExpired(t)) }));
  },

  /** DEMO: preskoči vrijeme misije radi isprobavanja. */
  skipScoutTime(id) {
    set((s) => ({
      scoutMissions: s.scoutMissions.map((m) => (m.id === id ? { ...m, completesAt: Date.now() } : m)),
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

  /** Pripiši nagradu u Kovanicama za ishod meča (§6.2) + sponzorski bonus (§10.8). */
  rewardMatch(outcome) {
    const base = matchReward(outcome);
    const pct = get().sponsorMatchIncomePct();
    const amount = Math.round(base * (1 + pct / 100));
    get()._tx(CURRENCIES.KOVANICE, amount, `mec:${outcome}`);
    return amount;
  },

  clearOpening() {
    set({ lastOpening: null });
  },
}));
