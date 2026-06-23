// Marketinška agencija + sponzori (§10.8).
//
// Dok nema pravih sponzora (kladionice / affiliate, §11), sistem generiše fiktivne.
// Svake sezone manager dobija MAX 3 *suštinski različite* ponude — različit iznos,
// trajanje, način isplate (odmah vs na rate), bonus na potpis i pasivne benefite —
// pa bira ono što mu trenutno najviše odgovara (ne 3 ista ugovora s drugom cifrom).

import { pick } from './rng.js';

/** Najviše ponuda po sezoni. */
export const MAX_OFFERS = 3;

/** Tip sponzora (samo prikazni naziv; iznosi su po šablonu ponude). */
export const SPONSOR_TYPES = Object.freeze({
  lokalni: { id: 'lokalni', name: 'Lokalni brend' },
  regionalni: { id: 'regionalni', name: 'Regionalni brend' },
  premium: { id: 'premium', name: 'Premium sponzor' },
});

/** Nivoi agencije (§10.8): broj slotova (multi-sponzor na 5) i dostupnost tiera preko minAgency. */
export const AGENCY_LEVELS = Object.freeze({
  1: { slots: 1 },
  2: { slots: 1 },
  3: { slots: 1 },
  4: { slots: 1 },
  5: { slots: 2 }, // dres + stadion odvojeno
});

/**
 * Šabloni ponuda — svaki je drugačiji "arhetip" odluke:
 *  - payout: 'upfront' (sve odmah) | 'installments' (po sezoni)
 *  - signingBonus: jednokratno na potpis { kovanice?, lopte?, pack? }
 *  - perks: pasivno dok ugovor traje { matchIncomePct?, fanBasePct? }
 */
export const OFFER_TEMPLATES = Object.freeze([
  { key: 'lokalni-brz', tier: 'lokalni', label: 'Brzi keš', minAgency: 1, seasons: 1, amount: 3000, payout: 'upfront', signingBonus: {}, perks: {}, desc: 'Cijeli iznos odmah na potpis.' },
  { key: 'lokalni-kesica', tier: 'lokalni', label: 'Sponzor kesica', minAgency: 1, seasons: 1, amount: 1500, payout: 'upfront', signingBonus: { pack: 'zlatna' }, perks: {}, desc: 'Manji keš + besplatna Zlatna kesica na potpis.' },
  { key: 'lokalni-navijaci', tier: 'lokalni', label: 'Navijački', minAgency: 1, seasons: 2, amount: 4000, payout: 'installments', signingBonus: {}, perks: { fanBasePct: 2 }, desc: 'Na rate kroz 2 sezone, +2% navijačka baza dok traje.' },
  { key: 'regionalni-stabilni', tier: 'regionalni', label: 'Stabilni partner', minAgency: 2, seasons: 2, amount: 8000, payout: 'installments', signingBonus: {}, perks: {}, desc: 'Veći iznos, isplata po sezoni.' },
  { key: 'regionalni-lopte', tier: 'regionalni', label: 'Premium valuta', minAgency: 2, seasons: 1, amount: 2000, payout: 'upfront', signingBonus: { lopte: 150 }, perks: {}, desc: 'Keš odmah + 150 Loptica (premium valuta) na potpis.' },
  { key: 'regionalni-performans', tier: 'regionalni', label: 'Performans bonus', minAgency: 2, seasons: 2, amount: 6000, payout: 'installments', signingBonus: {}, perks: { matchIncomePct: 15 }, desc: 'Na rate, +15% Kovanica iz mečeva dok traje.' },
  { key: 'premium-div', tier: 'premium', label: 'Dugoročni div', minAgency: 3, seasons: 3, amount: 20000, payout: 'installments', signingBonus: {}, perks: {}, desc: 'Najveći ukupan iznos kroz 3 sezone (po sezoni).' },
  { key: 'premium-elitni', tier: 'premium', label: 'Elitni paket', minAgency: 3, seasons: 3, amount: 15000, payout: 'installments', signingBonus: { pack: 'dijamantska' }, perks: { matchIncomePct: 10 }, desc: 'Dijamantska kesica na potpis + 10% Kovanica iz mečeva + isplata po sezoni.' },
]);

const BRANDS = {
  lokalni: ['Pekara Sunce', 'Auto-plac Mile', 'Kafić Centar', 'Market Komšija', 'Cvjećara Lala'],
  regionalni: ['BalkanTel', 'EuroMarket', 'RegionBank', 'TransBalkan', 'AdriaFood'],
  premium: ['GlobalBet', 'MegaCorp', 'TitanMotors', 'AeroFly', 'NexaTech'],
};

export function maxActiveSponsors(level) {
  return AGENCY_LEVELS[level]?.slots ?? 1;
}

/** Isplata po sezoni za ugovor na rate. */
export function perSeasonAmount(amount, seasons) {
  return Math.round(amount / seasons);
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Variraj iznos ±8%, zaokruženo na 100. */
function vary(amount, rng) {
  return Math.max(500, Math.round((amount * (0.92 + rng() * 0.16)) / 100) * 100);
}

/**
 * Generiši do MAX_OFFERS suštinski različitih ponuda za nivo agencije (§10.8).
 * Bira različite arhetipe (jedinstveni `key`) — nikad duplikate.
 */
export function generateOffers(level, rng = Math.random) {
  if (!AGENCY_LEVELS[level]) throw new Error(`Nepoznat nivo agencije: ${level}`);
  const available = OFFER_TEMPLATES.filter((t) => t.minAgency <= level);
  const chosen = shuffle(available, rng).slice(0, MAX_OFFERS);

  return chosen.map((t, i) => {
    const amount = vary(t.amount, rng);
    return {
      id: `offer-${Date.now()}-${i}-${Math.floor(rng() * 1e6)}`,
      key: t.key,
      brand: pick(rng, BRANDS[t.tier]),
      label: t.label,
      type: t.tier,
      typeName: SPONSOR_TYPES[t.tier].name,
      seasons: t.seasons,
      amount,
      payout: t.payout,
      perSeason: t.payout === 'installments' ? perSeasonAmount(amount, t.seasons) : 0,
      signingBonus: { ...t.signingBonus },
      perks: { ...t.perks },
      desc: t.desc,
      real: false, // fiktivni dok nema affiliate sponzora (§11)
    };
  });
}
