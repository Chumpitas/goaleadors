// Klub identitet i kosmetika — podaci + helperi za grb/dres builder (§9).

/** Podržane države Faze 1 (§8.5) sa gradovima za onboarding (§9.1). */
export const COUNTRIES = Object.freeze({
  Španija: ['Madrid', 'Barcelona', 'Sevilla', 'Valencia', 'Bilbao'],
  Engleska: ['London', 'Manchester', 'Liverpool', 'Birmingham', 'Leeds'],
  Italija: ['Rim', 'Milano', 'Torino', 'Napulj', 'Firenca'],
  Njemačka: ['Berlin', 'Minhen', 'Hamburg', 'Dortmund', 'Keln'],
  Francuska: ['Pariz', 'Marsej', 'Lion', 'Lil', 'Nica'],
});

/**
 * Oblici štita (§9.2) — SVG path u viewBox-u "0 0 100 120".
 * Spec traži 15–20; katalog je proširiv, ovdje 8 jasno različitih oblika.
 */
export const SHIELD_SHAPES = Object.freeze([
  { id: 'classic', name: 'Klasični', path: 'M15,15 L85,15 L85,60 Q85,95 50,112 Q15,95 15,60 Z' },
  { id: 'rounded', name: 'Zaobljeni', path: 'M50,12 Q85,12 85,40 L85,62 Q85,98 50,112 Q15,98 15,62 L15,40 Q15,12 50,12 Z' },
  { id: 'french', name: 'Francuski', path: 'M15,15 L85,15 L85,95 Q85,108 72,108 L28,108 Q15,108 15,95 Z' },
  { id: 'spanish', name: 'Španski', path: 'M15,15 L85,15 L85,70 Q85,112 50,112 Q15,112 15,70 Z' },
  { id: 'arched', name: 'Lučni', path: 'M50,8 Q88,12 86,20 L86,60 Q86,95 50,113 Q14,95 14,60 L14,20 Q12,12 50,8 Z' },
  { id: 'swallow', name: 'Lastin rep', path: 'M15,15 L85,15 L85,70 L65,112 L50,95 L35,112 L15,70 Z' },
  { id: 'flat', name: 'Ravni', path: 'M15,15 L85,15 L85,100 L15,100 Z' },
  { id: 'pentagon', name: 'Pentagon', path: 'M50,10 L86,30 L86,80 L50,113 L14,80 L14,30 Z' },
]);

/** Tipovi pozadine grba (§9.2): puna ili split (gore/dolje, lijevo/desno). */
export const CREST_BACKGROUNDS = Object.freeze([
  { id: 'solid', name: 'Puna' },
  { id: 'split-h', name: 'Split gore/dolje' },
  { id: 'split-v', name: 'Split lijevo/desno' },
]);

/** Simboli (§9.2): 50+ opcija (životinje, predmeti, slova…). */
export const SYMBOLS = Object.freeze([
  '🦁', '🐯', '🐻', '🐺', '🦅', '🐉', '🐂', '🐎', '🦌', '🐗',
  '🐍', '🦈', '🦂', '🐝', '🦇', '🐲', '🦏', '🐘', '🦬', '🐊',
  '⚽', '🏆', '👑', '⭐', '🔥', '⚡', '🌟', '💀', '⚓', '🗡️',
  '🛡️', '⚔️', '🏰', '🗼', '⛰️', '🌊', '☀️', '🌙', '❄️', '🍀',
  '🌹', '🦋', '🪶', '🔱', '⚜️', '✠', 'Ⓖ', 'Ⓐ', 'Ⓕ', 'Ⓒ',
  '🥅', '🎯', '💎', '🎖️',
]);

/** Fontovi natpisa (§9.2 / §9.3). */
export const FONTS = Object.freeze([
  { id: 'sans', name: 'Sans', family: 'system-ui, sans-serif' },
  { id: 'serif', name: 'Serif', family: 'Georgia, serif' },
  { id: 'slab', name: 'Slab', family: '"Roboto Slab", Rockwell, serif' },
  { id: 'mono', name: 'Mono', family: 'ui-monospace, monospace' },
]);

/** Dizajni dresa (§9.3): 10 opcija. */
export const JERSEY_DESIGNS = Object.freeze([
  { id: 'solid', name: 'Jednobojan' },
  { id: 'stripes', name: 'Vertikalne pruge' },
  { id: 'hoops', name: 'Horizontalne pruge' },
  { id: 'halves', name: 'Polovine' },
  { id: 'sash', name: 'Dijagonalna traka' },
  { id: 'checkers', name: 'Kvadrati' },
  { id: 'sleeves', name: 'Kontrast rukavi' },
  { id: 'pinstripe', name: 'Tanke pruge' },
  { id: 'diagonal', name: 'Dijagonalne polovine' },
  { id: 'collar', name: 'Akcent kragna' },
]);

/** Diskretna paleta za kombinatoriku (UI koristi slobodan izbor boje). */
export const PALETTE = Object.freeze([
  '#d63a3a', '#e0a01e', '#2c6e49', '#1e63d6', '#8b3fd1', '#16a3a3',
  '#e8462f', '#222831', '#f2f2f2', '#0f5132', '#7a1f1f', '#b8860b',
  '#1b3a6b', '#4b1d6e', '#0a7d6e', '#9aa0a6',
]);

/** Broj kombinacija grba (§9.2 "500.000+") s diskretnom paletom. */
export function crestCombinations(paletteSize = PALETTE.length) {
  const bgVariants =
    paletteSize + // solid
    paletteSize * paletteSize + // split-h
    paletteSize * paletteSize; // split-v
  return SHIELD_SHAPES.length * bgVariants * SYMBOLS.length * paletteSize * FONTS.length;
}

const ids = (arr) => arr.map((x) => (typeof x === 'string' ? x : x.id));

/** Podrazumijevana konfiguracija grba. */
export function defaultCrest() {
  return {
    shape: SHIELD_SHAPES[0].id,
    background: 'solid',
    color1: PALETTE[2],
    color2: PALETTE[0],
    symbol: SYMBOLS[0],
    symbolColor: PALETTE[1],
    font: FONTS[0].id,
    text: '',
  };
}

/** Podrazumijevana konfiguracija dresa. */
export function defaultKit() {
  return {
    design: JERSEY_DESIGNS[0].id,
    primary: PALETTE[3],
    secondary: PALETTE[8],
    font: FONTS[0].id,
    sponsor: '',
  };
}

/** Validiraj/sanitiziraj konfiguraciju grba — nepoznate vrijednosti padaju na default. */
export function validateCrest(cfg = {}) {
  const d = defaultCrest();
  return {
    shape: ids(SHIELD_SHAPES).includes(cfg.shape) ? cfg.shape : d.shape,
    background: ids(CREST_BACKGROUNDS).includes(cfg.background) ? cfg.background : d.background,
    color1: cfg.color1 || d.color1,
    color2: cfg.color2 || d.color2,
    symbol: SYMBOLS.includes(cfg.symbol) ? cfg.symbol : d.symbol,
    symbolColor: cfg.symbolColor || d.symbolColor,
    font: ids(FONTS).includes(cfg.font) ? cfg.font : d.font,
    text: typeof cfg.text === 'string' ? cfg.text.slice(0, 20) : d.text,
  };
}

/** Validiraj/sanitiziraj konfiguraciju dresa. */
export function validateKit(cfg = {}) {
  const d = defaultKit();
  return {
    design: ids(JERSEY_DESIGNS).includes(cfg.design) ? cfg.design : d.design,
    primary: cfg.primary || d.primary,
    secondary: cfg.secondary || d.secondary,
    font: ids(FONTS).includes(cfg.font) ? cfg.font : d.font,
    sponsor: typeof cfg.sponsor === 'string' ? cfg.sponsor.slice(0, 16) : d.sponsor,
  };
}

export function fontFamily(fontId) {
  return (FONTS.find((f) => f.id === fontId) || FONTS[0]).family;
}

export function shieldPath(shapeId) {
  return (SHIELD_SHAPES.find((s) => s.id === shapeId) || SHIELD_SHAPES[0]).path;
}

/** Inicijali iz imena kluba (do 3 slova). */
export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}
