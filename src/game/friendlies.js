// Prijateljski / direktni mečevi (§14.3) — ne utiču na standings.
import { randInt } from './rng.js';

export const FRIENDLY_TYPES = Object.freeze({
  friendly: { id: 'friendly', label: 'Friendly (prijatelj)', reward: [500, 1000], eloDelta: 0 },
  random: { id: 'random', label: 'Random trening', reward: [200, 300], eloDelta: 0 },
  ai: { id: 'ai', label: 'AI sparring', reward: [100, 100], eloDelta: -30 }, // slabiji protivnik za testiranje
});

/** Roll nagrade (Kovanice) za tip prijateljskog meča. */
export function rollFriendlyReward(type, rng = Math.random) {
  const t = FRIENDLY_TYPES[type];
  if (!t) throw new Error(`Nepoznat tip meča: ${type}`);
  return randInt(rng, t.reward[0], t.reward[1]);
}
