import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import {
  MIN_AGE,
  RESPONSIBLE_GAMBLING_NOTE,
  AFFILIATE_ACTIONS,
  B2B_PACKAGES,
  eligibleBookmakers,
} from '../game/affiliate.js';

export default function AffiliatePanel() {
  const club = useGameStore((s) => s.club);
  const verified = useGameStore((s) => s.affiliateAgeVerified);
  const activations = useGameStore((s) => s.affiliateActivations);
  const devRevenue = useGameStore((s) => s.affiliateDevRevenueEUR);
  const verifyAge = useGameStore((s) => s.verifyAffiliateAge);
  const activate = useGameStore((s) => s.activateAffiliate);
  const deposit = useGameStore((s) => s.affiliateDeposit);
  const [msg, setMsg] = useState('');

  const country = club?.country;
  const bookmakers = eligibleBookmakers(country);
  const actOf = (id) => activations.find((a) => a.bookmakerId === id);

  if (!verified) {
    return (
      <div className="affiliate">
        <div className="aff__gate">
          <h3>Provjera uzrasta ({MIN_AGE}+)</h3>
          <p className="aff__disc">{RESPONSIBLE_GAMBLING_NOTE}</p>
          <p className="aff__geo">Ponude su geo-ograničene — vidiš samo kladionice dostupne u tvojoj državi (§11.5).</p>
          <button className="prog__btn" onClick={verifyAge}>Imam {MIN_AGE}+ godina — prikaži ponude</button>
        </div>
      </div>
    );
  }

  return (
    <div className="affiliate">
      <p className="aff__disc aff__disc--top">{RESPONSIBLE_GAMBLING_NOTE}</p>
      {msg && <p className="social__msg">{msg}</p>}

      {!country ? (
        <p className="prog__muted">Osnuj klub i odaberi državu (Klub tab) da vidiš ponude za svoj region.</p>
      ) : (
        <section>
          <h3>Sponzori kladionice — {country} ({bookmakers.length})</h3>
          {bookmakers.map((b) => {
            const act = actOf(b.id);
            return (
              <div key={b.id} className="aff__book">
                <div className="aff__bhead">
                  <strong>{b.name}</strong>
                  <span className="aff__pkg">{B2B_PACKAGES[b.pkg].name}{b.exclusive ? ' · ekskluzivno u državi' : ''}</span>
                </div>
                {!act ? (
                  <div className="aff__actions">
                    <button onClick={() => { const r = activate(b.id, 'link'); setMsg(r.ok ? '' : r.reason); }}>
                      Već imam nalog (+{AFFILIATE_ACTIONS.link.playerBonus.kovanice.toLocaleString('sr')} 🪙)
                    </button>
                    <button className="aff__reg" onClick={() => { const r = activate(b.id, 'register'); setMsg(r.ok ? '' : r.reason); }}>
                      Registruj se (+{AFFILIATE_ACTIONS.register.playerBonus.kovanice.toLocaleString('sr')} 🪙 + Zlatna)
                    </button>
                  </div>
                ) : (
                  <div className="aff__actions">
                    <span className="aff__done">Aktivirano ({act.mode === 'register' ? 'registracija' : 'povezivanje'}) ✓</span>
                    <button disabled={act.deposited} onClick={() => { const r = deposit(b.id); setMsg(r.ok ? '' : r.reason); }}>
                      {act.deposited ? 'Depozit evidentiran ✓' : `Prvi depozit (+${AFFILIATE_ACTIONS.firstDeposit.playerBonus.kovanice.toLocaleString('sr')} 🪙)`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {bookmakers.length === 0 && <p className="prog__muted">Nema dostupnih kladionica za {country}.</p>}
        </section>
      )}

      <section className="aff__b2b">
        <h3>B2B model (za kladionice)</h3>
        <div className="aff__pkgs">
          {Object.values(B2B_PACKAGES).map((p) => (
            <div key={p.name} className="aff__pkgcard">
              <strong>{p.name}</strong>
              <span>{p.includes}</span>
            </div>
          ))}
        </div>
        <p className="aff__rev">Procijenjen prihod developera (ova sesija): <strong>~{devRevenue}€</strong> (CPA + revenue share)</p>
        <p className="aff__disc">Limit: jedan affiliate po kladionici · bonusi se isplaćuju nakon potvrde kladionice (webhook).</p>
      </section>
    </div>
  );
}
