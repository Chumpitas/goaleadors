import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { MAX_OFFERS, maxActiveSponsors } from '../game/sponsors.js';

function payoutLabel(o) {
  return o.payout === 'upfront'
    ? `${o.amount.toLocaleString('sr')} 🪙 odmah`
    : `${o.amount.toLocaleString('sr')} 🪙 na rate (${o.perSeason.toLocaleString('sr')}/sez)`;
}

function bonusChips(o) {
  const chips = [];
  if (o.signingBonus?.pack) chips.push(`+ ${o.signingBonus.pack} kesica`);
  if (o.signingBonus?.lopte) chips.push(`+ ${o.signingBonus.lopte} ⚽`);
  if (o.signingBonus?.kovanice) chips.push(`+ ${o.signingBonus.kovanice} 🪙`);
  if (o.perks?.matchIncomePct) chips.push(`+${o.perks.matchIncomePct}% iz mečeva`);
  if (o.perks?.fanBasePct) chips.push(`+${o.perks.fanBasePct}% navijači`);
  return chips;
}

export default function SponsorsPanel() {
  const agencyLevel = useGameStore((s) => s.agencyLevel);
  const offers = useGameStore((s) => s.sponsorOffers);
  const active = useGameStore((s) => s.activeSponsors);
  const kovanice = useGameStore((s) => s.kovanice);
  const setAgencyLevel = useGameStore((s) => s.setAgencyLevel);
  const generateSponsorOffers = useGameStore((s) => s.generateSponsorOffers);
  const signSponsor = useGameStore((s) => s.signSponsor);
  const [msg, setMsg] = useState('');

  const slots = maxActiveSponsors(agencyLevel);

  const sign = (id) => {
    const res = signSponsor(id);
    setMsg(res.ok ? '' : res.reason);
  };

  return (
    <div className="sponsors">
      <div className="sponsors__head">
        <div className="sponsors__levels">
          Agencija:
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button key={lvl} className={`chip ${lvl === agencyLevel ? 'is-active' : ''}`} onClick={() => setAgencyLevel(lvl)}>
              {lvl}
            </button>
          ))}
        </div>
        <span className="sponsors__meta">
          max {MAX_OFFERS} ponude · {slots} slot{slots > 1 ? 'a' : ''} · 🪙 {kovanice.toLocaleString('sr')}
        </span>
      </div>

      <button className="sponsors__gen" onClick={generateSponsorOffers}>Generiši ponude (nova sezona)</button>
      {msg && <p className="sponsors__msg">{msg}</p>}

      <div className="sponsors__cols">
        <section>
          <h3>Ponude ({offers.length})</h3>
          {offers.length === 0 && <p className="sponsors__empty">Klikni „Generiši ponude".</p>}
          {offers.map((o) => (
            <div key={o.id} className="sponsor">
              <div className="sponsor__body">
                <strong>{o.label} · {o.brand}</strong>
                <span className="sponsor__sub">{o.typeName} · {o.seasons} sez · {payoutLabel(o)}</span>
                <span className="sponsor__desc">{o.desc}</span>
                {bonusChips(o).length > 0 && (
                  <div className="sponsor__chips">
                    {bonusChips(o).map((c, i) => <span key={i} className="sponsor__chip">{c}</span>)}
                  </div>
                )}
              </div>
              <button onClick={() => sign(o.id)} disabled={active.length >= slots}>Potpiši</button>
            </div>
          ))}
        </section>

        <section>
          <h3>Aktivni ({active.length}/{slots})</h3>
          {active.length === 0 && <p className="sponsors__empty">Nema aktivnih ugovora.</p>}
          {active.map((sp) => (
            <div key={sp.id} className="sponsor sponsor--active">
              <div className="sponsor__body">
                <strong>{sp.label} · {sp.brand}</strong>
                <span className="sponsor__sub">
                  {sp.payout === 'installments' ? `${sp.perSeason.toLocaleString('sr')} 🪙/sez` : 'isplaćeno odmah'}
                </span>
                {bonusChips(sp).filter((c) => c.includes('%')).length > 0 && (
                  <div className="sponsor__chips">
                    {bonusChips(sp).filter((c) => c.includes('%')).map((c, i) => <span key={i} className="sponsor__chip">{c}</span>)}
                  </div>
                )}
              </div>
              <span className="sponsor__left">{sp.seasonsLeft} sez</span>
            </div>
          ))}
          <p className="sponsors__hint">Isplata po sezoni ide automatski (Edicije → +1 sezona).</p>
        </section>
      </div>
    </div>
  );
}
