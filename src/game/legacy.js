// Legacy album i bonusi (§13) — penzionisane karte i njihovi trajni efekti.

/** Pragovi i iznosi Legacy bonusa (§13.2). */
export const LEGACY_RULES = Object.freeze({
  sameEditionForIncome: 10, // 10 karata iste edicije -> +1% prihod
  incomePctPerEdition: 1,
  totalForFanBase: 50, // 50 karata ukupno -> +2% navijačka baza
  fanBasePct: 2,
  legendaryPerEdition: 5, // kompletna Legendary kolekcija edicije (5)
});

/** Grupiši karte po editionId. */
function groupByEdition(cards) {
  return cards.reduce((acc, c) => {
    const k = c.editionId || 'unknown';
    (acc[k] ||= []).push(c);
    return acc;
  }, {});
}

/**
 * Izračunaj trajne Legacy bonuse iz penzionisanih karata (§13.2).
 * @param {object[]} legacyCards
 * @returns {{ incomePct:number, fanBasePct:number, completedLegendaryEditions:string[], titleCards:number, byEdition:object }}
 */
export function legacyBonuses(legacyCards = []) {
  const byEdition = groupByEdition(legacyCards);

  let incomePct = 0;
  const completedLegendaryEditions = [];

  for (const [code, cards] of Object.entries(byEdition)) {
    if (cards.length >= LEGACY_RULES.sameEditionForIncome) {
      incomePct += LEGACY_RULES.incomePctPerEdition;
    }
    const legendaries = cards.filter((c) => c.rarity === 'legendary').length;
    if (legendaries >= LEGACY_RULES.legendaryPerEdition) {
      completedLegendaryEditions.push(code);
    }
  }

  const fanBasePct = legacyCards.length >= LEGACY_RULES.totalForFanBase ? LEGACY_RULES.fanBasePct : 0;
  const titleCards = legacyCards.filter((c) => c.titleCard).length;

  return { incomePct, fanBasePct, completedLegendaryEditions, titleCards, byEdition };
}
