// Premium kosmetika — Legendary tier (§9.4). Cijene u Lopticama (§6.4).

export const PREMIUM_PRICES = Object.freeze({ stadium: 2000, crest: 500, kit: 300 });

/**
 * Legendarni stadioni — 1-of-1 po državi (§9.4). `preTaken` = već zauzet (AI klub),
 * prikazuje se kao "ZAUZETO" za ostale u toj državi.
 */
export const LEGENDARY_STADIUMS = Object.freeze([
  { id: 'es-katedrala', country: 'Španija', name: 'La Catedral', preTaken: false },
  { id: 'es-coloso', country: 'Španija', name: 'El Coloso', preTaken: true },
  { id: 'en-fortress', country: 'Engleska', name: 'Old Fortress', preTaken: false },
  { id: 'en-cathedral', country: 'Engleska', name: 'The Cathedral', preTaken: true },
  { id: 'it-scala', country: 'Italija', name: 'La Scala del Calcio', preTaken: false },
  { id: 'it-tempio', country: 'Italija', name: 'Il Tempio', preTaken: true },
  { id: 'de-arena', country: 'Njemačka', name: 'Die Festung', preTaken: false },
  { id: 'de-westfalen', country: 'Njemačka', name: 'Der Westfalen', preTaken: true },
  { id: 'fr-parc', country: 'Francuska', name: 'Le Parc', preTaken: false },
  { id: 'fr-velodrome', country: 'Francuska', name: 'Le Vélodrome', preTaken: true },
]);

/** Historijski grbovi — art-quality, nedostupni builder-om (§9.4). */
export const HISTORIC_CRESTS = Object.freeze([
  { id: 'phoenix', name: 'Phoenix', symbol: '🔥', hex: '#e8462f' },
  { id: 'imperial-eagle', name: 'Imperial Eagle', symbol: '🦅', hex: '#b8860b' },
  { id: 'golden-lion', name: 'Golden Lion', symbol: '🦁', hex: '#e0a01e' },
  { id: 'royal-crown', name: 'Royal Crown', symbol: '👑', hex: '#8b3fd1' },
  { id: 'ancient-shield', name: 'Ancient Shield', symbol: '🛡️', hex: '#16a3a3' },
]);

/** Special dresovi — gradijenti i posebni efekti (§9.4). */
export const SPECIAL_KITS = Object.freeze([
  { id: 'aurora', name: 'Aurora', from: '#16a3a3', to: '#8b3fd1' },
  { id: 'inferno', name: 'Inferno', from: '#d63a3a', to: '#e0a01e' },
  { id: 'galaxy', name: 'Galaxy', from: '#1e63d6', to: '#0a0f0c' },
  { id: 'emerald', name: 'Emerald Shine', from: '#0f5132', to: '#2c8c5e' },
]);

export function stadiumsForCountry(country) {
  return LEGENDARY_STADIUMS.filter((s) => s.country === country);
}

export function stadiumById(id) {
  return LEGENDARY_STADIUMS.find((s) => s.id === id) || null;
}

export function historicCrestById(id) {
  return HISTORIC_CRESTS.find((c) => c.id === id) || null;
}

export function specialKitById(id) {
  return SPECIAL_KITS.find((k) => k.id === id) || null;
}
