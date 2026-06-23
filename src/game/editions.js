// Edicije karata — kalendar, overlap i penzija (§4).
import { EDITION_THEMES } from './constants.js';

/** Sezona = 30 dana; edicija živi 3 sezone = 90 dana; nova edicija svake sezone (§4.1). */
export const SEASON_DAYS = 30;
export const EDITION_LIFESPAN_DAYS = 90;
/** Dan najave penzije (15 dana upozorenja prije dana 90) (§4.2). */
export const RETIREMENT_WARNING_OFFSET = 75;

export const EDITION_STATUS = Object.freeze({
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  RETIRING: 'retiring', // najavljena penzija (15 dana)
  LEGACY: 'legacy',
});

/** Slug edicije iz teme + indeksa (jedinstven, prva = 'foundations'). */
export function editionCode(theme, index) {
  const slug = theme.toLowerCase().replace(/\s+/g, '-');
  return index === 1 ? 'foundations' : `${slug}-${index}`;
}

/**
 * Izgradi raspored edicija: edicija i izlazi na dan (i-1)*30 + 1, penzija +90 (§4.2).
 * @param {number} count - koliko edicija generisati
 * @returns {object[]} raspored
 */
export function generateEditionSchedule(count) {
  const out = [];
  for (let i = 1; i <= count; i++) {
    const theme = EDITION_THEMES[(i - 1) % EDITION_THEMES.length];
    const releaseDay = (i - 1) * SEASON_DAYS + 1;
    out.push({
      index: i,
      code: editionCode(theme, i),
      theme,
      releaseDay,
      warnDay: releaseDay + RETIREMENT_WARNING_OFFSET,
      retireDay: releaseDay + EDITION_LIFESPAN_DAYS,
    });
  }
  return out;
}

/** Status edicije za zadati dan (§4.2). */
export function editionStatus(edition, currentDay) {
  if (currentDay < edition.releaseDay) return EDITION_STATUS.UPCOMING;
  if (currentDay < edition.warnDay) return EDITION_STATUS.ACTIVE;
  if (currentDay < edition.retireDay) return EDITION_STATUS.RETIRING;
  return EDITION_STATUS.LEGACY;
}

export function daysUntilRetire(edition, currentDay) {
  return edition.retireDay - currentDay;
}

/** Edicije koje su trenutno u prodaji (active + retiring) — uvijek do 3 paralelno (§4.1). */
export function activeEditions(schedule, currentDay) {
  return schedule.filter((e) => {
    const s = editionStatus(e, currentDay);
    return s === EDITION_STATUS.ACTIVE || s === EDITION_STATUS.RETIRING;
  });
}

/** Edicije koje su prešle u Legacy do zadatog dana. */
export function legacyEditions(schedule, currentDay) {
  return schedule.filter((e) => editionStatus(e, currentDay) === EDITION_STATUS.LEGACY);
}

/** Koja je sezona (1-bazno) za zadati dan. */
export function seasonForDay(currentDay) {
  return Math.floor((currentDay - 1) / SEASON_DAYS) + 1;
}
