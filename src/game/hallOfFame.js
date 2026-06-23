// Sezonski Hall of Fame (§14.4) — kompiliran iz dostupnog stanja igre.
import { euroName } from './proLeague.js';

/**
 * Sastavi listu priznanja na kraju sezone (§14.4).
 * @param {object} s - { proSeason, euroResult, ultraGroup, rivalries, clubName }
 * @returns {{ title:string, holder:string }[]}
 */
export function buildHallOfFame({ proSeason, euroResult, ultraGroup, rivalries = [], clubName = 'Moj klub' } = {}) {
  const out = [];

  if (proSeason?.classification?.champion) {
    out.push({ title: 'Šampion 1. lige', holder: proSeason.classification.champion.name });
  }

  if (euroResult) {
    out.push({
      title: `${euroName(euroResult.competition)} — šampion`,
      holder: euroResult.playerWon ? clubName : euroResult.winner?.name || '—',
    });
  }

  // Najduži pobjednički niz (iz rivalstava).
  const bestStreak = rivalries.reduce((m, r) => Math.max(m, r.currentStreak > 0 ? r.currentStreak : 0), 0);
  if (bestStreak > 0) {
    out.push({ title: 'Najduži pobjednički niz', holder: `${clubName} (${bestStreak})` });
  }

  if (ultraGroup) {
    out.push({ title: 'Ultra grupa sezone', holder: ultraGroup.name });
  }

  return out;
}
