// OVERALL rating per position (§2.2).
// Each formula is a weighted sum of attributes; weights sum to 1.0.
import { POSITIONS } from './constants.js';

/**
 * Per-position weighting of attributes (§2.2).
 *   ATT: Shooting 50% + Pace 25% + Passing 20% + Tackling 5%
 *   MID: Passing 40% + Shooting 25% + Pace 20% + Tackling 15%
 *   DEF: Tackling 45% + Pace 25% + Passing 20% + Shooting 10%
 *   GK : Reflexes 45% + Positioning 35% + Passing 15% + Pace 5%
 */
export const OVERALL_WEIGHTS = Object.freeze({
  [POSITIONS.ATT]: { shooting: 0.5, pace: 0.25, passing: 0.2, tackling: 0.05 },
  [POSITIONS.MID]: { passing: 0.4, shooting: 0.25, pace: 0.2, tackling: 0.15 },
  [POSITIONS.DEF]: { tackling: 0.45, pace: 0.25, passing: 0.2, shooting: 0.1 },
  [POSITIONS.GK]: { reflexes: 0.45, positioning: 0.35, passing: 0.15, pace: 0.05 },
});

/**
 * Compute a card's OVERALL for its position.
 * @param {object} card - must have `position` and an `attributes` map (0–100).
 * @returns {number} rounded OVERALL on a 0–100 scale.
 */
export function computeOverall(card) {
  const weights = OVERALL_WEIGHTS[card.position];
  if (!weights) {
    throw new Error(`Unknown position: ${card.position}`);
  }
  const attrs = card.attributes || {};
  let total = 0;
  for (const [attr, weight] of Object.entries(weights)) {
    total += (attrs[attr] ?? 0) * weight;
  }
  return Math.round(total);
}
