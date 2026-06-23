// Taktičke tabele i konstante za match engine (§3.4–3.7).
// Svi procentualni modifikatori su izraženi kao decimale (npr. +12% -> 0.12).

/**
 * Formacije (§3.4). `ar`/`dr` su modifikatori, a `def`/`mid`/`att` broj igrača
 * po liniji (uz 1 GK = 11 ukupno) — koristi se za sastavljanje postave.
 */
export const FORMATIONS = Object.freeze({
  '4-3-3':   { ar: 0.12,  dr: -0.08, def: 4, mid: 3, att: 3, karakter: 'Ofanzivna' },
  '4-4-2':   { ar: 0.05,  dr: 0.0,   def: 4, mid: 4, att: 2, karakter: 'Balansirana' },
  '4-2-3-1': { ar: 0.08,  dr: 0.05,  def: 4, mid: 5, att: 1, karakter: 'Kontrola' },
  '4-5-1':   { ar: -0.08, dr: 0.12,  def: 4, mid: 5, att: 1, karakter: 'Defanzivna' },
  '3-5-2':   { ar: 0.06,  dr: -0.03, def: 3, mid: 5, att: 2, karakter: 'Vezna dominacija' },
  '5-3-2':   { ar: -0.05, dr: 0.15,  def: 5, mid: 3, att: 2, karakter: 'Ultra defanzivna' },
  '5-4-1':   { ar: -0.12, dr: 0.18,  def: 5, mid: 4, att: 1, karakter: 'Parking the bus' },
});

/** Stil igre (§3.4). `convMod` množi konverziju šansi (Counter: +30%). */
export const STYLES = Object.freeze({
  'High Press': { ar: 0.08,  dr: -0.10, fatigue: 0.20, convMod: 1.0 },
  Possession:   { ar: 0.03,  dr: 0.03,  fatigue: 0.0,  convMod: 1.0 },
  Counter:      { ar: -0.05, dr: 0.0,   fatigue: 0.0,  convMod: 1.30 },
  Defensive:    { ar: -0.10, dr: 0.10,  fatigue: 0.0,  convMod: 1.0 },
});

/** Mentalitet (§3.4). */
export const MENTALITIES = Object.freeze({
  Attacking: { ar: 0.10,  dr: -0.15 },
  Balanced:  { ar: 0.0,   dr: 0.0 },
  Defensive: { ar: -0.15, dr: 0.10 },
});

/** Tipovi šanse: vjerovatnoća tipa + bazna konverzija (§3.6). */
export const CHANCE_TYPES = Object.freeze([
  { id: 'zicer',  label: 'Zicer',            prob: 0.15, conversion: 0.55 },
  { id: 'box',    label: 'Šut iz šesnaesterca', prob: 0.45, conversion: 0.28 },
  { id: 'edge',   label: 'Šut s ivice',       prob: 0.30, conversion: 0.12 },
  { id: 'header', label: 'Udarac glavom',     prob: 0.10, conversion: 0.20 },
]);

/** AR/DR omjer -> vjerovatnoća šanse po intervalu (§3.5). */
export function chanceProbabilityForRatio(ratio) {
  if (ratio >= 1.5) return 0.27;
  if (ratio >= 1.2) return 0.22;
  if (ratio >= 0.9) return 0.18;
  if (ratio >= 0.7) return 0.13;
  return 0.08;
}

/** Karakter meča / kontrola haosa (§3.7). */
export const MATCH_CHARACTERS = Object.freeze([
  { id: 'normalan', label: 'Normalan', prob: 0.60, chanceMult: 1.0,  upsetBoost: 0 },
  { id: 'lud',      label: 'Lud meč',  prob: 0.15, chanceMult: 1.4,  upsetBoost: 0 },
  { id: 'cvrst',    label: 'Čvrst meč',prob: 0.15, chanceMult: 0.6,  upsetBoost: 0 },
  { id: 'upset',    label: 'Upset meč',prob: 0.10, chanceMult: 1.0,  upsetBoost: 0.25 },
]);

/** Navijački bonus prema popunjenosti stadiona (§3.9). */
export function crowdBonus(fillPct) {
  if (fillPct >= 90) return 0.08;
  if (fillPct >= 70) return 0.05;
  if (fillPct >= 50) return 0.02;
  return -0.03;
}

/** 18 intervala od po 5 minuta (§3.2). */
export const INTERVALS = 18;
export const MINUTES_PER_INTERVAL = 5;
export const BASE_CHANCE_RATE = 0.18; // §3.5 (informativno; bucket tabela je primarna)

/** Razbij naziv formacije na broj igrača po liniji. */
export function lineForFormation(name) {
  const f = FORMATIONS[name];
  if (!f) throw new Error(`Nepoznata formacija: ${name}`);
  return { gk: 1, def: f.def, mid: f.mid, att: f.att };
}
