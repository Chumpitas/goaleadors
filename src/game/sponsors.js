// Marketinška agencija + sponzori (§10.8).
import { pick } from './rng.js';

/** Tipovi sponzora: trajanje (sezone) i ukupan iznos ugovora u Kovanicama (§10.8). */
export const SPONSOR_TYPES = Object.freeze({
  lokalni: { id: 'lokalni', name: 'Lokalni brend', seasons: 1, amount: 3000 },
  regionalni: { id: 'regionalni', name: 'Regionalni brend', seasons: 2, amount: 8000 },
  premium: { id: 'premium', name: 'Premium sponzor', seasons: 3, amount: 20000 },
});

/**
 * Nivoi agencije (§10.8): broj ponuda + dostupni tipovi + multi-slot.
 * Spec navodi nivoe 1/3/5; 2 i 4 su interpolirani.
 */
export const AGENCY_LEVELS = Object.freeze({
  1: { offers: 2, tiers: ['lokalni'], slots: 1 },
  2: { offers: 3, tiers: ['lokalni', 'regionalni'], slots: 1 },
  3: { offers: 4, tiers: ['lokalni', 'regionalni', 'premium'], slots: 1 },
  4: { offers: 4, tiers: ['lokalni', 'regionalni', 'premium'], slots: 1 },
  5: { offers: 5, tiers: ['lokalni', 'regionalni', 'premium'], slots: 2 }, // dres + stadion odvojeno
});

const BRANDS = {
  lokalni: ['Pekara Sunce', 'Auto-plac Mile', 'Kafić Centar', 'Market Komšija', 'Cvjećara Lala'],
  regionalni: ['BalkanTel', 'EuroMarket', 'RegionBank', 'TransBalkan', 'AdriaFood'],
  premium: ['GlobalBet', 'MegaCorp', 'TitanMotors', 'AeroFly', 'NexaTech'],
};

export function maxActiveSponsors(level) {
  return AGENCY_LEVELS[level]?.slots ?? 1;
}

/** Isplata po sezoni (ukupan iznos / trajanje). */
export function perSeasonPayout(typeId) {
  const t = SPONSOR_TYPES[typeId];
  if (!t) throw new Error(`Nepoznat tip sponzora: ${typeId}`);
  return Math.round(t.amount / t.seasons);
}

/**
 * Generiši sponzorske ponude za nivo agencije (§10.8).
 * @returns {object[]} ponude { id, brand, type, seasons, amount, perSeason }
 */
export function generateOffers(level, rng = Math.random) {
  const cfg = AGENCY_LEVELS[level];
  if (!cfg) throw new Error(`Nepoznat nivo agencije: ${level}`);
  const offers = [];
  for (let i = 0; i < cfg.offers; i++) {
    const tier = pick(rng, cfg.tiers);
    const type = SPONSOR_TYPES[tier];
    offers.push({
      id: `offer-${Date.now()}-${i}-${Math.floor(rng() * 1e6)}`,
      brand: pick(rng, BRANDS[tier]),
      type: tier,
      typeName: type.name,
      seasons: type.seasons,
      amount: type.amount,
      perSeason: perSeasonPayout(tier),
    });
  }
  return offers;
}
