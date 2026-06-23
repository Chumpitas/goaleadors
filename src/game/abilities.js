// Special abilities catalog (§2.6).
//
// Ability types:
//   - individual  : affects only the card that holds it
//   - aura        : affects the whole team / a group (stackable with diminishing returns)
//   - situational : activates in specific match moments
//   - kontra      : counters opponent abilities (Legendary-only)
//
// Each ability carries a human-readable `base` effect and its trained `enhanced`
// version (§2.6 "ojačana verzija"). Structured fields (positions, stack, counters,
// trigger) are provided where the spec defines them, for the match engine to consume.

export const ABILITY_TYPES = Object.freeze({
  INDIVIDUAL: 'individual',
  AURA: 'aura',
  SITUATIONAL: 'situational',
  KONTRA: 'kontra',
});

/** Individual abilities — affect only the holding card. */
export const INDIVIDUAL_ABILITIES = Object.freeze([
  { id: 'dead_ball', name: 'Dead Ball', positions: ['MID', 'ATT'], base: '+25% konverzija slobodnjaka/penala', enhanced: '+40%' },
  { id: 'aerial_threat', name: 'Aerial Threat', positions: ['DEF', 'ATT'], base: '+30% konverzija udarca glavom', enhanced: '+50%' },
  { id: 'dribbler', name: 'Dribbler', positions: ['ATT', 'MID'], base: '+20% prolaz kroz duel', enhanced: '+35%' },
  { id: 'iron_wall', name: 'Iron Wall', positions: ['DEF'], base: '-20% vjerovatnoća šanse kroz DEF liniju', enhanced: '-35%' },
  { id: 'clutch', name: 'Clutch', positions: ['any'], base: 'kad je neriješeno ili minus, +15% svim statovima', enhanced: '+25%' },
  { id: 'speedster', name: 'Speedster', positions: ['ATT', 'DEF'], base: 'PACE se računa s 1.3× težinom u AR', enhanced: '1.5×' },
  { id: 'long_shot', name: 'Long Shot', positions: ['MID', 'ATT'], base: 'šutevi s ivice šesnaesterca +15% konverzija', enhanced: '+28%' },
  { id: 'penalty_king', name: 'Penalty King', positions: ['ATT', 'MID'], base: 'penali imaju 80% konverziju flat', enhanced: '90%' },
  { id: 'sweeper', name: 'Sweeper', positions: ['GK'], base: 'GK pokriva prostor iza DEF, -10% šansi protivnika', enhanced: '-18%' },
  { id: 'wall', name: 'Wall', positions: ['GK'], base: 'GK na slobodnjacima +25% REFLEXES', enhanced: '+40%' },
]);

/** Aura abilities — affect the team/group, stackable with diminishing returns. */
export const AURA_ABILITIES = Object.freeze([
  { id: 'captain', name: 'Captain', base: 'cijeli tim +5 na sve statove', enhanced: '+8', stack: ['+3', '+1'] },
  { id: 'nationalist', name: 'Nationalist', base: 'isti sunarodnjaci +10 OVERALL', enhanced: '+16', stack: ['+5', '+2'] },
  { id: 'playmaker', name: 'Playmaker', base: 'sve MID karte +12 PASSING', enhanced: '+20', stack: ['+6', '+2'] },
  { id: 'target_man', name: 'Target Man', base: 'sve ATT karte +10% konverzija šansi', enhanced: '+16%', stack: ['+5%', '+2%'] },
  { id: 'libero', name: 'Libero', base: 'sve DEF karte +10 TACKLING', enhanced: '+16', stack: ['+5', '+2'] },
  { id: 'ultras_favourite', name: 'Ultras Favourite', base: 'domaći teren, cijeli tim +6% AR', enhanced: '+10%', stack: ['+3%', '+1%'] },
  { id: 'conductor', name: 'Conductor', base: 'vezna karta daje +5 PASSING svim ATT', enhanced: '+8', stack: null },
  { id: 'veteran_presence', name: 'Veteran Presence', base: 'ako je Veteran token, mlađe karte +8 OVERALL', enhanced: '+12', stack: null },
]);

/** Situational abilities — activate under specific match conditions. */
export const SITUATIONAL_ABILITIES = Object.freeze([
  { id: 'big_game_player', name: 'Big Game Player', trigger: 'evropska takmičenja', base: '+20% svim statovima', enhanced: '+32%' },
  { id: 'derby_king', name: 'Derby King', trigger: 'meč rivalstva', base: '+25% svim statovima', enhanced: '+40%' },
  { id: 'supersub', name: 'Supersub', trigger: 'prvih 15 min nakon izmjene', base: '130% ratinga', enhanced: '150%' },
  { id: 'pressure_proof', name: 'Pressure Proof', trigger: 'zadnjih 15 min meča', base: 'ne gubi od umora', enhanced: '+10% statova' },
  { id: 'comeback_king', name: 'Comeback King', trigger: 'tim gubi 1+ gol', base: '+20% AR cijelom timu', enhanced: '+30%' },
  { id: 'fortress', name: 'Fortress', trigger: 'domaći + gubiš 0:1', base: 'DR +25% za ostatak', enhanced: '+40%' },
  { id: 'ice_veins', name: 'Ice Veins', trigger: 'penali/slobodnjaci u zadnjih 10 min', base: '+35% konverzija', enhanced: '+55%' },
  { id: 'poacher', name: 'Poacher', trigger: '3+ šanse bez gola', base: 'sljedeća šansa +40% konverzija', enhanced: '+60%' },
  { id: 'engine', name: 'Engine', trigger: 'High Press taktika', base: 'umor -30% sporije', enhanced: '-50%' },
  { id: 'underdog', name: 'Underdog', trigger: 'protivnik 10+ overall viši', base: '+15% AR i DR', enhanced: '+25%' },
]);

/** Kontra abilities — neutralize opponent abilities (Legendary-only, §2.6). */
export const KONTRA_ABILITIES = Object.freeze([
  { id: 'disruptor', name: 'Disruptor', counters: 'sve Aura abilities protivnika', base: '-40% efikasnosti', enhanced: '-65%' },
  { id: 'aerial_duel', name: 'Aerial Duel', counters: 'aerial_threat', base: 'potpuno neutralize + kontira +15%', enhanced: 'potpuno neutralize' },
  { id: 'press_breaker', name: 'Press Breaker', counters: 'High Press stil', base: '-60% efekta', enhanced: 'potpuno neutralize' },
  { id: 'shadow', name: 'Shadow', counters: 'dribbler', base: '-50% efekta', enhanced: 'potpuno neutralize' },
  { id: 'set_piece_stopper', name: 'Set Piece Stopper', counters: ['dead_ball', 'ice_veins', 'penalty_king'], base: '-35% efikasnosti', enhanced: '-55%' },
  { id: 'anti_captain', name: 'Anti-Captain', counters: 'captain', base: 'Captain aura -50%', enhanced: '-80%' },
  { id: 'crowd_silencer', name: 'Crowd Silencer', counters: ['ultras_favourite', 'navijački bonus'], base: 'navijački bonus -60%', enhanced: 'potpuno neutralize' },
  { id: 'tactician', name: 'Tactician', counters: '5+ odbrambenih u formaciji', base: 'ATT dobija +20%', enhanced: '+32%' },
]);

/** Synergy combinations that grant a bonus (§2.6). */
export const SYNERGIES = Object.freeze([
  { combo: ['captain', 'nationalist'], bonus: 'Nationalist efekat se udvostručuje za sunarodnjake' },
  { combo: ['supersub', 'clutch'], bonus: 'Oba aktivna simultano s +20% boost' },
  { combo: ['poacher', 'dead_ball'], bonus: 'Dead Ball +extra 15% dok je Poacher aktivan' },
  { combo: ['engine', 'high_press'], bonus: 'Umor -50% sporije umjesto -30%' },
  { combo: ['disruptor', 'crowd_silencer'], bonus: 'Protivnik gubi auru i navijački bonus + moralni malus -5% DR' },
  { combo: ['derby_king', 'ice_veins'], bonus: 'Penali/slobodnjaci u rivalstvu = flat 85% konverzija' },
  { combo: ['underdog', 'comeback_king'], bonus: 'Oba aktivna simultano = +35% AR i DR' },
]);

/** Per-rarity ability slot composition (§2.6). */
export const ABILITY_LOADOUT_BY_RARITY = Object.freeze({
  common: [],
  rare: [ABILITY_TYPES.INDIVIDUAL],
  epic: [ABILITY_TYPES.INDIVIDUAL, 'aura_or_situational'],
  legendary: ['aura_or_situational', ABILITY_TYPES.KONTRA],
});

/** Flat index of every ability by id, with its type attached. */
export const ALL_ABILITIES = Object.freeze(
  [
    ...INDIVIDUAL_ABILITIES.map((a) => ({ ...a, type: ABILITY_TYPES.INDIVIDUAL })),
    ...AURA_ABILITIES.map((a) => ({ ...a, type: ABILITY_TYPES.AURA })),
    ...SITUATIONAL_ABILITIES.map((a) => ({ ...a, type: ABILITY_TYPES.SITUATIONAL })),
    ...KONTRA_ABILITIES.map((a) => ({ ...a, type: ABILITY_TYPES.KONTRA })),
  ].reduce((acc, a) => {
    acc[a.id] = a;
    return acc;
  }, {})
);

/** Look up any ability definition by id. */
export function abilityById(id) {
  return ALL_ABILITIES[id] || null;
}
