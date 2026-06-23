// Global game state (Zustand, §15.1). Perzistira u localStorage (preživi reload).
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateEdition, drawCards } from '../game/editionGenerator.js';
import { openPack, packByCode } from '../game/packs.js';
import { CURRENCIES, applyTransaction, matchReward, rollKovanice } from '../game/currency.js';
import {
  streakReward,
  dailyChallengeSet,
  SEASON_PASS_WEEKS,
  PREMIUM_PASS_COST_LOPTE,
} from '../game/progression.js';
import { grantStarterCards, STARTER_BONUS } from '../game/starterPack.js';
import { trainCard, TRAINING_COST_KOVANICE } from '../game/training.js';
import { generateYouth } from '../game/academy.js';
import { startMission, isComplete, resolveMission, maxConcurrentScouts, missionCost } from '../game/scouting.js';
import {
  signingCost,
  trainingSlotsForLevel,
  applySeasonalGrowth,
  isExpired,
  talentToCard,
  MAX_TALENTS_PER_CLUB,
} from '../game/talents.js';
import { buildLineup, simulateMatch } from '../game/matchEngine.js';
import { outcomeFromScore } from '../game/elo.js';
import { createRivalry, applyDerbyResult, derbyBonusPct, MAX_RIVALRIES } from '../game/rivalries.js';
import { ultraPointsFor, WEEKLY_ULTRA_CHALLENGES } from '../game/ultras.js';
import { eloFromOverall } from '../game/elo.js';
import { generateMarketListings, netProceeds } from '../game/market.js';
import {
  generateReferralCode,
  REFERRAL_EVENTS,
  tierMultiplier,
  resolveInviterReward,
  SECOND_LEVEL_PCT,
} from '../game/referral.js';
import { AFFILIATE_ACTIONS, bookmakerById, estimatedRevenueEUR } from '../game/affiliate.js';
import { rollFriendlyReward, FRIENDLY_TYPES } from '../game/friendlies.js';
import { PREMIUM_PRICES, stadiumById } from '../game/cosmeticsPremium.js';
import { calculateManagerRating, simulateWorldCup, placementReward } from '../game/worldCup.js';
import { buildProLeague, runProSeason, simulateKnockout } from '../game/proLeague.js';
import { generateAIClubs } from '../game/amateurSeason.js';
import { mulberry32 } from '../game/rng.js';
import { generateEditionSchedule, legacyEditions, seasonForDay } from '../game/editions.js';
import { generateOffers, maxActiveSponsors } from '../game/sponsors.js';
import {
  applyMatchFatigue,
  recover,
  emergencyHealsPerWeek,
  ENERGY_MAX,
} from '../game/fatigue.js';
import { authEnabled, signIn, signUp, signOut, getUser, onAuthChange } from '../lib/auth.js';
import { loadCloudState, saveCloudState } from '../lib/cloudSave.js';

const EDITION = 'foundations';

/** Trajno (perzistabilno) stanje: izbaci `pool` (determinizam), tranzijente i akcije. */
export function persistable(s) {
  const { pool, lastOpening, user, cloudStatus, ...rest } = s;
  return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== 'function'));
}

export const useGameStore = create(persist((set, get) => ({
  editionCode: EDITION,
  pool: generateEdition(EDITION), // 110-card active edition (§4.4) — deterministička, ne perzistira se
  resetGame() {
    if (typeof window !== 'undefined') {
      try { window.localStorage.removeItem('goaleadors'); } catch { /* ignore */ }
      window.location.reload();
    }
  },
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

  // Affiliate B2B (§11)
  affiliateAgeVerified: false,
  affiliateActivations: [], // { bookmakerId, mode, deposited }
  affiliateDevRevenueEUR: 0, // procjena prihoda developera

  /** Dobna verifikacija 18+ prije prikaza ponude (§11.5). */
  verifyAffiliateAge() {
    set({ affiliateAgeVerified: true });
  },

  /** Aktiviraj affiliate kod kladionice (poveži ili registruj se). Jedan po kladionici (§11.5). */
  activateAffiliate(bookmakerId, mode) {
    if (!get().affiliateAgeVerified) return { ok: false, reason: 'potrebna dobna verifikacija (18+)' };
    if (!bookmakerById(bookmakerId)) return { ok: false, reason: 'nepoznata kladionica' };
    if (mode !== 'link' && mode !== 'register') return { ok: false, reason: 'nepoznata akcija' };
    if (get().affiliateActivations.some((a) => a.bookmakerId === bookmakerId)) {
      return { ok: false, reason: 'već aktivirano za ovu kladionicu' };
    }
    // Bonus se isplaćuje kad kladionica "potvrdi" (ovdje simulirano odmah).
    get()._grantReward(AFFILIATE_ACTIONS[mode].playerBonus);
    set((s) => ({
      affiliateActivations: [...s.affiliateActivations, { bookmakerId, mode, deposited: false }],
      affiliateDevRevenueEUR: s.affiliateDevRevenueEUR + estimatedRevenueEUR(mode),
    }));
    return { ok: true };
  },

  /** Prvi depozit prijatelja na kladionici → bonus + revenue share (§11.2). */
  affiliateDeposit(bookmakerId) {
    const act = get().affiliateActivations.find((a) => a.bookmakerId === bookmakerId);
    if (!act) return { ok: false, reason: 'nije aktivirano' };
    if (act.deposited) return { ok: false, reason: 'depozit već evidentiran' };
    get()._grantReward(AFFILIATE_ACTIONS.firstDeposit.playerBonus);
    set((s) => ({
      affiliateActivations: s.affiliateActivations.map((a) => (a.bookmakerId === bookmakerId ? { ...a, deposited: true } : a)),
      affiliateDevRevenueEUR: s.affiliateDevRevenueEUR + estimatedRevenueEUR('firstDeposit'),
    }));
    return { ok: true };
  },

  // Premium kosmetika (§9.4)
  ownedCosmetics: { stadiumId: null, crestId: null, kitId: null },

  /** Kupi legendarni stadion (1-of-1 po državi, §9.4). */
  buyLegendaryStadium(id) {
    const st = stadiumById(id);
    if (!st) return { ok: false, reason: 'nepoznat stadion' };
    if (st.country !== get().club?.country) return { ok: false, reason: 'nije u tvojoj državi' };
    if (st.preTaken) return { ok: false, reason: 'ZAUZETO u tvojoj državi' };
    if (get().lopte < PREMIUM_PRICES.stadium) return { ok: false, reason: 'nedovoljno Loptica' };
    get()._tx(CURRENCIES.LOPTE, -PREMIUM_PRICES.stadium, 'kosmetika:stadion');
    set((s) => ({
      ownedCosmetics: { ...s.ownedCosmetics, stadiumId: id },
      club: s.club ? { ...s.club, stadiumName: st.name, stadiumCap: 50000 } : s.club, // elitni (§9.5)
    }));
    return { ok: true };
  },

  /** Kupi premium kosmetiku (grb ili dres) za Lopte (§9.4/§6.4). */
  buyPremiumCosmetic(kind, id) {
    const price = kind === 'crest' ? PREMIUM_PRICES.crest : PREMIUM_PRICES.kit;
    if (get().lopte < price) return { ok: false, reason: 'nedovoljno Loptica' };
    get()._tx(CURRENCIES.LOPTE, -price, `kosmetika:${kind}`);
    set((s) => ({ ownedCosmetics: { ...s.ownedCosmetics, [kind === 'crest' ? 'crestId' : 'kitId']: id } }));
    return { ok: true };
  },

  // Referral program (§17)
  referralCode: null,
  referrals: [],
  referralEarned: { kovanice: 0, lopte: 0, packs: 0 },

  _ensureReferralCode() {
    if (!get().referralCode) set({ referralCode: generateReferralCode(get().club?.name || 'GOAL') });
    return get().referralCode;
  },

  referralValidatedCount() {
    return get().referrals.filter((r) => r.validated && r.level === 1).length;
  },

  /** Interno: razriješi + isplati + evidentiraj referral nagradu (za „Moja mreža"). */
  _grantReferralReward(rawReward, mult) {
    const r = resolveInviterReward(rawReward, mult);
    get()._grantReward(r);
    set((s) => ({
      referralEarned: {
        kovanice: s.referralEarned.kovanice + (r.kovanice || 0),
        lopte: s.referralEarned.lopte + (r.lopte || 0),
        packs: s.referralEarned.packs + (r.pack ? 1 : 0),
      },
    }));
  },

  /** Pozovi prijatelja (§17.1). Registracijska nagrada čeka validaciju (§17.5). */
  inviteFriend(name) {
    if (!name?.trim()) return { ok: false, reason: 'unesi ime' };
    get()._ensureReferralCode();
    set((s) => ({
      referrals: [...s.referrals, { id: `ref-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name: name.trim(), level: 1, matchesPlayed: 0, validated: false, pendingRegister: true, done: {} }],
    }));
    return { ok: true };
  },

  /**
   * Označi referral događaj prijatelja i isplati nagradu pozivaču s tier bonusom (§17.2/§17.3).
   * 'played7' validira referral (§17.5) i isplaćuje zaostalu registracijsku nagradu.
   */
  friendEvent(id, eventKey) {
    const friend = get().referrals.find((r) => r.id === id);
    if (!friend || friend.done[eventKey]) return { ok: false, reason: 'nedostupno' };
    const ev = REFERRAL_EVENTS[eventKey];
    if (!ev) return { ok: false, reason: 'nepoznat događaj' };

    if (eventKey === 'played7') {
      set((s) => ({ referrals: s.referrals.map((r) => (r.id === id ? { ...r, matchesPlayed: 7, validated: true, done: { ...r.done, played7: true } } : r)) }));
      const mult = tierMultiplier(get().referralValidatedCount());
      if (friend.pendingRegister) {
        get()._grantReferralReward(REFERRAL_EVENTS.register.inviter, mult);
        set((s) => ({ referrals: s.referrals.map((r) => (r.id === id ? { ...r, pendingRegister: false } : r)) }));
      }
      get()._grantReferralReward(ev.inviter, mult);
      return { ok: true };
    }

    if (!friend.validated) return { ok: false, reason: 'referral nije validiran (7 mečeva)' };
    const mult = tierMultiplier(get().referralValidatedCount());
    get()._grantReferralReward(ev.inviter, mult);
    set((s) => ({ referrals: s.referrals.map((r) => (r.id === id ? { ...r, done: { ...r.done, [eventKey]: true } } : r)) }));
    return { ok: true };
  },

  /** Drugi nivo lanca: prijatelj pozove nekoga → 20% standardne nagrade (§17.4). */
  inviteSecondLevel(parentId, name) {
    const parent = get().referrals.find((r) => r.id === parentId);
    if (!parent || !parent.validated) return { ok: false, reason: 'pozivač mora biti validiran' };
    set((s) => ({
      referrals: [...s.referrals, { id: `ref2-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, name: (name || 'Drugi nivo').trim(), level: 2, parentId, validated: true, matchesPlayed: 7, done: { played7: true } }],
    }));
    const mult = tierMultiplier(get().referralValidatedCount()) * (SECOND_LEVEL_PCT / 100);
    get()._grantReferralReward(REFERRAL_EVENTS.played7.inviter, mult);
    return { ok: true };
  },

  // Trade tržište (§5.4)
  marketListings: [],
  legacyMarketListings: [],
  myListings: [],
  myLegacyListings: [],

  /** Osvježi AI ponudu na tržištu (transfer + Legacy). */
  refreshMarket() {
    const pool = get().pool;
    set({
      marketListings: generateMarketListings(pool, 8, Math.random),
      legacyMarketListings: generateMarketListings(pool, 4, Math.random, { legacy: true }),
    });
  },

  /** Kupi kartu s tržišta (puna cijena). `legacy` bira tržište/odredište. */
  buyListing(id, legacy = false) {
    const key = legacy ? 'legacyMarketListings' : 'marketListings';
    const listing = get()[key].find((l) => l.id === id);
    if (!listing) return { ok: false, reason: 'nema oglasa' };
    if (get().kovanice < listing.price) return { ok: false, reason: 'nedovoljno Kovanica' };
    get()._tx(CURRENCIES.KOVANICE, -listing.price, legacy ? 'legacy:kupovina' : 'tržište:kupovina');
    set((s) => ({
      [key]: s[key].filter((l) => l.id !== id),
      ...(legacy ? { legacy: [...s.legacy, listing.card] } : { collection: [...s.collection, listing.card] }),
    }));
    return { ok: true };
  },

  /** Izloži kartu iz kolekcije (ili Legacy) na tržište po cijeni. */
  listCard(index, price, legacy = false) {
    const src = legacy ? 'legacy' : 'collection';
    const dest = legacy ? 'myLegacyListings' : 'myListings';
    const card = get()[src][index];
    if (!card) return { ok: false, reason: 'nema karte' };
    if (!price || price < 50) return { ok: false, reason: 'cijena min 50' };
    set((s) => ({
      [src]: s[src].filter((_, i) => i !== index),
      [dest]: [...s[dest], { id: `mine-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, card, price, legacy }],
    }));
    return { ok: true };
  },

  /** Prodaja izložene karte (simulirani kupac): neto = cijena − 5% fee (§5.4). */
  sellMyListing(id, legacy = false) {
    const key = legacy ? 'myLegacyListings' : 'myListings';
    const listing = get()[key].find((l) => l.id === id);
    if (!listing) return { ok: false, reason: 'nema oglasa' };
    const net = netProceeds(listing.price);
    get()._tx(CURRENCIES.KOVANICE, net, legacy ? 'legacy:prodaja' : 'tržište:prodaja');
    set((s) => ({ [key]: s[key].filter((l) => l.id !== id) }));
    return { ok: true, net };
  },

  /** Povuci izloženu kartu nazad u kolekciju/Legacy. */
  cancelListing(id, legacy = false) {
    const key = legacy ? 'myLegacyListings' : 'myListings';
    const dest = legacy ? 'legacy' : 'collection';
    const listing = get()[key].find((l) => l.id === id);
    if (!listing) return;
    set((s) => ({ [key]: s[key].filter((l) => l.id !== id), [dest]: [...s[dest], listing.card] }));
  },

  // World Cup (WORLD_CUP_SYSTEM)
  managerStats: { currentLeagueLevel: 3, winsLast30: 0, europeanHistory: [], totalSeasons: 0 },
  veteranTokens: 0,
  wcApplication: null,
  wcQualified: false,
  wcResult: null,
  wcTrophies: [],

  managerRating() {
    return calculateManagerRating(get().managerStats);
  },

  /** Prijavi se za selektora (max 3 nacije po prioritetu). */
  applyWorldCup(nations) {
    const list = (nations || []).filter(Boolean).slice(0, 3);
    if (!list.length) return { ok: false, reason: 'odaberi bar jednu naciju' };
    set({ wcApplication: { nations: list }, wcQualified: false, wcResult: null });
    return { ok: true };
  },

  /** Kvalifikacije: top selektori po Manager Ratingu prolaze (simulirani bracket). */
  runQualification() {
    if (!get().wcApplication) return { ok: false, reason: 'prvo se prijavi' };
    const rating = get().managerRating().total;
    const rng = mulberry32(Math.floor(Math.random() * 1e9));
    // Bracket od 8: pobijedi 3 protivnika (rating-vjerovatnoća) → kvalifikacija.
    let survived = true;
    for (let round = 0; round < 3 && survived; round++) {
      const opp = 1500 + Math.floor(rng() * 1500);
      survived = rng() < rating / (rating + opp);
    }
    set({ wcQualified: survived });
    return { ok: true, qualified: survived };
  },

  /** Odigraj World Cup za kvalifikovanu naciju #1; dodijeli nagrade po plasmanu. */
  runWorldCup() {
    if (!get().wcQualified || !get().wcApplication) return { ok: false, reason: 'nisi kvalifikovan' };
    const nation = get().wcApplication.nations[0];
    const bonus = Math.round(get().managerRating().total / 40); // bolji selektor = jača reprezentacija
    const result = simulateWorldCup({ [nation]: bonus });
    const placement = result.placement[nation];
    const reward = placementReward(placement);
    if (reward) get()._grantWCReward(reward);
    set({ wcResult: { ...result, nation, placement } });
    return { ok: true, placement };
  },

  _grantWCReward(reward) {
    if (reward.coins) get()._tx(CURRENCIES.KOVANICE, reward.coins, 'wc:nagrada');
    for (let i = 0; i < (reward.elitePacks || 0); i++) get().openAndCollect('elite');
    for (let i = 0; i < (reward.diamondPacks || 0); i++) get().openAndCollect('dijamantska');
    if (reward.veteranTokens) set((s) => ({ veteranTokens: s.veteranTokens + reward.veteranTokens }));
    if (reward.trophy) set((s) => ({ wcTrophies: [...s.wcTrophies, reward.trophy] }));
    if (reward.kit) set((s) => ({ ownedCosmetics: { ...s.ownedCosmetics, kitId: reward.kit } }));
  },

  // Profesionalne lige + Evropa (§8.2–8.4)
  proSeason: null,
  euroResult: null,

  /** Procijeni ELO igrača iz najjače postave (+ talenti). */
  _playerElo() {
    const talents = get().talents.filter((t) => t.status === 'signed').map(talentToCard);
    const lineup = buildLineup(get().pool, '4-3-3', { extra: talents });
    const avg = lineup.reduce((s, c) => s + c.overall, 0) / (lineup.length || 1);
    return eloFromOverall(avg);
  },

  /** Odigraj profesionalnu ligašku sezonu (16 klubova, §8.2–8.3). */
  runProSeason() {
    const elo = get()._playerElo();
    const player = { id: 'player', name: get().club?.name || 'Moj klub', elo, isPlayer: true };
    const clubs = buildProLeague(player);
    const { table, classification } = runProSeason({ clubs });

    const me = table.find((c) => c.id === 'player');
    const euro = classification.euro.find((e) => e.id === 'player') || null;

    // Nagrade (§6.2): prvak lige 25.000, ostali promovisani bonus.
    if (me.rank === 1) { get()._grantReward({ kovanice: 25000 }); get().contributeUltraPoints('leagueWin'); }
    else if (me.rank <= 2) { get()._grantReward({ kovanice: 5000 }); get().contributeUltraPoints('promotion'); }

    // Ažuriraj Manager Rating (WORLD_CUP_SYSTEM napomena 1).
    set((s) => ({
      managerStats: {
        ...s.managerStats,
        currentLeagueLevel: me.rank <= 2 ? 1 : 2,
        winsLast30: Math.min(30, me.w),
        totalSeasons: s.managerStats.totalSeasons + 1,
      },
    }));

    set({ proSeason: { table, classification, playerRank: me.rank, euro, playerElo: elo }, euroResult: null });
    return { rank: me.rank, euro };
  },

  /** Odigraj evropsko takmičenje za koje se igrač kvalifikovao (§8.4). */
  runEuropean() {
    const ps = get().proSeason;
    if (!ps || !ps.euro) return { ok: false, reason: 'nema evropske kvalifikacije' };
    const rng = mulberry32(Math.floor(Math.random() * 1e9));
    const ai = generateAIClubs(7, { rng, eloRange: [ps.playerElo - 60, ps.playerElo + 160] });
    const bracket = [{ id: 'player', name: get().club?.name || 'Moj klub', elo: ps.playerElo, isPlayer: true }, ...ai];
    const { winner, rounds } = simulateKnockout(bracket, rng);
    const playerWon = winner.id === 'player';

    // Nagrade: osvajanje LŠ 100.000 (§6.2); LE/LK manje.
    if (playerWon) {
      const reward = ps.euro.competition === 'cl' ? 100000 : ps.euro.competition === 'el' ? 40000 : 20000;
      get()._grantReward({ kovanice: reward });
      get().contributeUltraPoints('leagueWin');
    }
    set((s) => ({
      euroResult: { competition: ps.euro.competition, rounds, winner, playerWon },
      managerStats: { ...s.managerStats, europeanHistory: [...s.managerStats.europeanHistory, { result: playerWon ? 'win' : 'qf' }] },
    }));
    return { ok: true, playerWon };
  },

  // Socijalni sistemi (§14)
  rivalries: [],
  ultraGroup: null,
  lastFriendly: null,

  /** Odigraj prijateljski/random/AI meč (§14.3) — ne utiče na standings. */
  playFriendly(type) {
    const cfg = FRIENDLY_TYPES[type];
    if (!cfg) return { ok: false, reason: 'nepoznat tip' };
    const pool = get().pool;
    const talents = get().talents.filter((t) => t.status === 'signed').map(talentToCard);
    const elo = get()._playerElo();
    const rng = mulberry32(Math.floor(Math.random() * 1e9));
    const home = { name: 'Moj klub', cards: buildLineup(pool, '4-3-3', { extra: talents }), formation: '4-3-3', style: 'Possession', mentality: 'Balanced', isHome: true };
    const away = { name: cfg.label, cards: buildLineup(pool, '4-4-2', { rng }), formation: '4-4-2', style: 'Possession', mentality: 'Balanced' };
    const result = simulateMatch(home, away);
    const reward = rollFriendlyReward(type);
    get()._tx(CURRENCIES.KOVANICE, reward, `friendly:${type}`);
    set({ lastFriendly: { type, label: cfg.label, result, reward } });
    return { ok: true, result, reward };
  },

  /** Dodaj rivalstvo (max 3, §14.2). */
  addRivalry(name) {
    if (!name?.trim()) return { ok: false, reason: 'unesi ime' };
    if (get().rivalries.length >= MAX_RIVALRIES) return { ok: false, reason: 'maksimum 3 rivalstva' };
    set((s) => ({ rivalries: [...s.rivalries, createRivalry(name.trim())] }));
    return { ok: true };
  },

  removeRivalry(id) {
    set((s) => ({ rivalries: s.rivalries.filter((r) => r.id !== id) }));
  },

  /** Odigraj derby protiv rivala: simulira meč, ažurira statistiku, isplaćuje Kovanice s derby bonusom. */
  playDerby(id) {
    const rivalry = get().rivalries.find((r) => r.id === id);
    if (!rivalry) return { ok: false, reason: 'nema rivala' };

    const pool = get().pool;
    const talents = get().talents.filter((t) => t.status === 'signed').map(talentToCard);
    const rng = mulberry32(Math.floor(Math.random() * 1e9));
    const home = { name: 'Moj klub', cards: buildLineup(pool, '4-3-3', { extra: talents }), formation: '4-3-3', style: 'High Press', mentality: 'Attacking', isHome: true, crowdFill: 95 };
    const away = { name: rivalry.opponent, cards: buildLineup(pool, '4-4-2', { rng }), formation: '4-4-2', style: 'Counter', mentality: 'Balanced' };
    const result = simulateMatch(home, away);
    const outcome = outcomeFromScore(result.score.home, result.score.away, 'home');

    const bonusPct = derbyBonusPct(rivalry.played);
    const base = matchReward(outcome);
    const reward = Math.round(base * (1 + bonusPct / 100));
    get()._tx(CURRENCIES.KOVANICE, reward, `derby:${outcome}`);
    if (outcome === 'win') get().contributeUltraPoints('win');

    set((s) => ({
      rivalries: s.rivalries.map((r) =>
        r.id === id ? applyDerbyResult(r, { scoreFor: result.score.home, scoreAgainst: result.score.away }) : r
      ),
    }));
    return { ok: true, result, outcome, reward, bonusPct };
  },

  /** Osnuj Ultra grupu (§14.1) — igrač je Capo. */
  createUltraGroup(name) {
    if (!name?.trim()) return { ok: false, reason: 'unesi ime' };
    const clubName = get().club?.name || 'Moj klub';
    set({
      ultraGroup: {
        name: name.trim(),
        points: 0,
        members: [
          { name: clubName, role: 'Capo' },
          { name: 'Dinamo Ultras', role: 'Lieutenant' },
          { name: 'Sjever 1989', role: 'Member' },
        ],
        weeklyClaimed: [],
      },
    });
    return { ok: true };
  },

  /** Dodaj Ultra poene (§14.1). */
  contributeUltraPoints(source) {
    if (!get().ultraGroup) return;
    set((s) => ({ ultraGroup: { ...s.ultraGroup, points: s.ultraGroup.points + ultraPointsFor(source) } }));
  },

  /** Pokupi nagradu sedmičnog Ultra izazova (§14.1). */
  claimUltraChallenge(id) {
    const group = get().ultraGroup;
    if (!group) return { ok: false, reason: 'nema grupe' };
    if (group.weeklyClaimed.includes(id)) return { ok: false, reason: 'već pokupljeno' };
    const ch = WEEKLY_ULTRA_CHALLENGES.find((c) => c.id === id);
    if (!ch) return { ok: false, reason: 'nepoznat izazov' };
    get()._grantReward(ch.reward);
    set((s) => ({ ultraGroup: { ...s.ultraGroup, weeklyClaimed: [...s.ultraGroup.weeklyClaimed, id] } }));
    return { ok: true };
  },

  // Dnevni progression loop (§12)
  streak: 0,
  dailyChallenges: [],
  seasonPassPremium: false,
  passClaimed: { free: [], premium: [] },

  /** Interno: dodijeli nagradu (Kovanice/Lopte/kesica/karta određenog rariteta). */
  _grantReward(reward = {}) {
    if (reward.kovanice) get()._tx(CURRENCIES.KOVANICE, reward.kovanice, 'nagrada');
    if (reward.lopte) get()._tx(CURRENCIES.LOPTE, reward.lopte, 'nagrada');
    if (reward.pack) {
      const count = reward.count || 1;
      for (let i = 0; i < count; i++) get().openAndCollect(reward.pack);
    }
    if (reward.cardRarity) get()._grantCardOfRarity(reward.cardRarity);
  },

  _grantCardOfRarity(rarity) {
    const candidates = get().pool.filter((c) => c.rarity === rarity);
    if (!candidates.length) return;
    const card = candidates[Math.floor(Math.random() * candidates.length)];
    set((s) => ({ collection: [...s.collection, card] }));
  },

  /** Dnevni login (§12.1/§12.3): streak +1, login bonus, streak nagrada, novi izazovi. */
  dailyLogin() {
    const nextStreak = get().streak + 1;
    set({ streak: nextStreak, dailyChallenges: dailyChallengeSet() });
    get()._tx(CURRENCIES.KOVANICE, rollKovanice('dailyLogin'), 'dnevni-login');
    const sr = streakReward(nextStreak);
    if (sr) get()._grantReward(sr);
    return { streak: nextStreak, streakReward: sr };
  },

  /** Ispuni dnevni izazov i pokupi nagradu (§12.2). */
  completeChallenge(id) {
    const ch = get().dailyChallenges.find((c) => c.id === id);
    if (!ch || ch.done) return { ok: false };
    get()._grantReward(ch.reward);
    set((s) => ({ dailyChallenges: s.dailyChallenges.map((c) => (c.id === id ? { ...c, done: true } : c)) }));
    return { ok: true };
  },

  /** Kupi premium sezonski pass za Lopte (§12.4/§6.4). */
  buyPremiumPass() {
    if (get().seasonPassPremium) return { ok: false, reason: 'već aktivan' };
    if (get().lopte < PREMIUM_PASS_COST_LOPTE) return { ok: false, reason: 'nedovoljno Loptica' };
    get()._tx(CURRENCIES.LOPTE, -PREMIUM_PASS_COST_LOPTE, 'sezonski-pass:premium');
    set({ seasonPassPremium: true });
    return { ok: true };
  },

  /** Pokupi nagradu sezonskog passa za sedmicu i track ('free'|'premium'). */
  claimPassReward(week, track) {
    if (track === 'premium' && !get().seasonPassPremium) return { ok: false, reason: 'nema premium passa' };
    if (get().passClaimed[track].includes(week)) return { ok: false, reason: 'već pokupljeno' };
    const wk = SEASON_PASS_WEEKS.find((w) => w.week === week);
    if (!wk) return { ok: false, reason: 'nepoznata sedmica' };
    get()._grantReward(wk[track]);
    set((s) => ({ passClaimed: { ...s.passClaimed, [track]: [...s.passClaimed[track], week] } }));
    return { ok: true };
  },

  clearOpening() {
    set({ lastOpening: null });
  },

  // --- Backend: auth + cloud-save ---
  user: null,
  cloudStatus: 'idle', // idle | loading | saving | saved | error
  authEnabled,

  /** Inicijalizuj auth: učitaj sesiju i pretplati se na promjene. */
  async initAuth() {
    if (!authEnabled) return;
    const u = await getUser();
    if (u) { set({ user: u }); await get().syncFromCloud(); }
    onAuthChange((nextUser) => {
      const prev = get().user?.id;
      set({ user: nextUser });
      if (nextUser && nextUser.id !== prev) get().syncFromCloud();
    });
  },

  async signIn(email, password) {
    const { user, error } = await signIn(email, password);
    if (error) return { ok: false, reason: error };
    set({ user });
    await get().syncFromCloud();
    return { ok: true };
  },

  async signUp(email, password) {
    const { user, error } = await signUp(email, password);
    if (error) return { ok: false, reason: error };
    if (user) { set({ user }); await get().syncToCloud(); }
    return { ok: true, needsConfirm: !user };
  },

  async signOut() {
    await signOut();
    set({ user: null, cloudStatus: 'idle' });
  },

  /** Učitaj stanje iz oblaka i primijeni ga. */
  async syncFromCloud() {
    if (!get().user) return;
    set({ cloudStatus: 'loading' });
    try {
      const st = await loadCloudState(get().user.id);
      if (st) set(st);
      set({ cloudStatus: 'saved' });
    } catch (e) {
      set({ cloudStatus: 'error' });
    }
  },

  /** Snimi trenutno stanje u oblak. */
  async syncToCloud() {
    if (!get().user) return { ok: false, reason: 'niste prijavljeni' };
    set({ cloudStatus: 'saving' });
    try {
      await saveCloudState(get().user.id, persistable(get()));
      set({ cloudStatus: 'saved' });
      return { ok: true };
    } catch (e) {
      set({ cloudStatus: 'error' });
      return { ok: false, reason: e.message };
    }
  },

  // --- Admin / dev alati (zaobilaze cijene i ograničenja) ---
  adminCredit(currency, amount) {
    get()._tx(currency, amount, 'admin');
  },
  adminAddVeteranTokens(n) {
    set((s) => ({ veteranTokens: s.veteranTokens + n }));
  },
  /** Otvori kesicu besplatno (puni kolekciju). */
  adminOpenPack(code) {
    get().openAndCollect(code);
  },
  /** Dodaj N nasumičnih karata zadanog rariteta u kolekciju. */
  adminGrantCards(rarity, n = 1) {
    for (let i = 0; i < n; i++) get()._grantCardOfRarity(rarity);
  },
  /** Generička izmjena polja (nivoi, managerStats, flagovi). */
  adminSet(patch) {
    set(patch);
  },
  adminSetManagerStat(key, value) {
    set((s) => ({ managerStats: { ...s.managerStats, [key]: value } }));
  },

  // MyTeam lineup
  lineup: {},       // { slotIndex: collectionIndex }
  formation: '4-3-3',
  setLineup(lineup) { set({ lineup }); },
  setFormation(f) { set({ formation: f, lineup: {} }); },
}), {
  name: 'goaleadors',
  version: 1,
  storage: createJSONStorage(() => localStorage),
  // Perzistiraj samo trajno stanje; `pool` se determinizmom regeneriše, `lastOpening` je tranzijentno.
  partialize: persistable,
}));
