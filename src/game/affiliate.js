// Affiliate sistem (B2B, §11) — simulirani tok s ugrađenim zaštitnim mehanizmima (§11.5).
// Sve kladionice su FIKTIVNE; ovo je game-side mehanika, ne prava integracija.

/** Dobna granica prije prikaza affiliate ponude (§11.5). */
export const MIN_AGE = 18;

/** Disclaimer o odgovornom kockanju (§11.5). */
export const RESPONSIBLE_GAMBLING_NOTE =
  'Igre na sreću su namijenjene punoljetnim osobama (18+). Igraj odgovorno. Kockanje može izazvati zavisnost.';

/**
 * Akcije i nagrade (§11.1/§11.2). `playerBonus` = igraču, `devRevenue` = model prihoda developera.
 */
export const AFFILIATE_ACTIONS = Object.freeze({
  link: { label: 'Već imam nalog → Poveži', playerBonus: { kovanice: 5000 }, devRevenue: 'Fee po verifikaciji', revenueEUR: [5, 5] },
  register: { label: 'Nemam nalog → Registruj se', playerBonus: { kovanice: 15000, pack: 'zlatna' }, devRevenue: 'CPA fee', revenueEUR: [20, 50] },
  firstDeposit: { label: 'Prvi depozit', playerBonus: { kovanice: 5000 }, devRevenue: 'Revenue share %', revenueEUR: [8, 16] },
});

/** B2B paketi za kladionice (§11.4). */
export const B2B_PACKAGES = Object.freeze({
  basic: { name: 'Basic', includes: 'Logo na dresovima, Kovanice kao nagrada' },
  premium: { name: 'Premium', includes: 'Basic + affiliate registracije (CPA)' },
  exclusive: { name: 'Exclusive', includes: 'Premium + jedina kladionica u toj državi' },
});

/** Fiktivne kladionice s geo-dostupnošću (§11.5 geo-restriction). */
export const BOOKMAKERS = Object.freeze([
  { id: 'goldbet', name: 'GoldBet', countries: ['Španija', 'Engleska', 'Italija', 'Njemačka', 'Francuska'], pkg: 'premium' },
  { id: 'acewager', name: 'AceWager', countries: ['Španija', 'Italija'], pkg: 'basic' },
  { id: 'kickodds', name: 'KickOdds', countries: ['Engleska', 'Njemačka', 'Francuska'], pkg: 'premium' },
  { id: 'primabet', name: 'PrimaBet', countries: ['Italija'], pkg: 'exclusive', exclusive: true },
]);

/** Kladionice vidljive za zadanu državu (geo-restriction, §11.5). */
export function eligibleBookmakers(country) {
  if (!country) return [];
  return BOOKMAKERS.filter((b) => b.countries.includes(country));
}

export function bookmakerById(id) {
  return BOOKMAKERS.find((b) => b.id === id) || null;
}

/** Procijenjeni prihod developera u EUR za akciju (sredina raspona). */
export function estimatedRevenueEUR(actionKey) {
  const a = AFFILIATE_ACTIONS[actionKey];
  if (!a) return 0;
  return Math.round((a.revenueEUR[0] + a.revenueEUR[1]) / 2);
}
