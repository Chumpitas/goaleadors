// Referral program (§17).

/** Generiši referral kod iz imena (npr. "FC Madrid" → "FCMAD42"). */
export function generateReferralCode(name = 'GOAL', rng = Math.random) {
  const slug = (name.toUpperCase().replace(/[^A-Z0-9]/g, '') || 'GOAL').slice(0, 5);
  return `${slug}${Math.floor(rng() * 90 + 10)}`;
}

/** Nagrade po događaju (§17.2). Pozivač = `inviter`, novi igrač = `invitee`. */
export const REFERRAL_EVENTS = Object.freeze({
  register: { label: 'Registracija prijatelja', inviter: { pack: 'zlatna' }, invitee: {} },
  played7: { label: 'Prijatelj odigra 7 mečeva (validacija)', inviter: { kovanice: 3000 }, invitee: { pack: 'zlatna' } },
  firstPack: { label: 'Prijatelj otvori prvu kesicu', inviter: { kovanice: 500 }, invitee: {} },
  proLeague: { label: 'Prijatelj dostigne profesionalnu ligu', inviter: { pack: 'dijamantska' }, invitee: { pack: 'dijamantska' } },
  firstLopte: { label: 'Prijatelj kupi prvi pack Loptica', inviter: { loptePct: 10 }, invitee: {} },
});

/** Pretpostavljena vrijednost prvog paketa Loptica (za loptePct nagradu). */
export const SAMPLE_LOPTE_PURCHASE = 700;

/** Mečevi koje novi igrač mora odigrati prije validacije (§17.5). */
export const VALIDATION_MATCHES = 7;

/** Tier sistem (§17.3). */
export const REFERRAL_TIERS = Object.freeze([
  { name: 'Scout', min: 1, max: 4, mult: 1.0 },
  { name: 'Agent', min: 5, max: 14, mult: 1.25 },
  { name: 'Director', min: 15, max: 29, mult: 1.5, cosmetic: true },
  { name: 'Legenda', min: 30, max: Infinity, mult: 2.0, cosmetic: true, title: true, monthlyDiamond: true },
]);

export function referralTier(validatedCount) {
  return REFERRAL_TIERS.find((t) => validatedCount >= t.min && validatedCount <= t.max) || { name: 'Početnik', min: 0, max: 0, mult: 1.0 };
}

export function tierMultiplier(validatedCount) {
  return referralTier(validatedCount).mult;
}

/** Drugi nivo referral lanca daje 20% standardnih nagrada (§17.4). */
export const SECOND_LEVEL_PCT = 20;

/**
 * Skaliraj numeričke nagrade (Kovanice/Lopte) multiplikatorom; kesice se ne skaliraju.
 * loptePct se prvo pretvori u Lopte iz SAMPLE_LOPTE_PURCHASE.
 */
export function resolveInviterReward(reward = {}, mult = 1) {
  const out = {};
  if (reward.kovanice) out.kovanice = Math.round(reward.kovanice * mult);
  if (reward.lopte) out.lopte = Math.round(reward.lopte * mult);
  if (reward.loptePct) out.lopte = Math.round((SAMPLE_LOPTE_PURCHASE * reward.loptePct / 100) * mult);
  if (reward.pack) out.pack = reward.pack;
  return out;
}
