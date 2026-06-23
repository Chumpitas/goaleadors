import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { AGENCY_LEVELS, maxActiveSponsors } from '../game/sponsors.js';

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
          {AGENCY_LEVELS[agencyLevel].offers} ponuda · {slots} slot{slots > 1 ? 'a' : ''} · 🪙 {kovanice.toLocaleString('sr')}
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
              <div>
                <strong>{o.brand}</strong>
                <span className="sponsor__sub">{o.typeName} · {o.seasons} sez · {o.perSeason.toLocaleString('sr')} 🪙/sez</span>
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
              <div>
                <strong>{sp.brand}</strong>
                <span className="sponsor__sub">{sp.typeName} · {sp.perSeason.toLocaleString('sr')} 🪙/sez</span>
              </div>
              <span className="sponsor__left">{sp.seasonsLeft} sez preostalo</span>
            </div>
          ))}
          <p className="sponsors__hint">Isplata ide automatski svake sezone (Edicije → +1 sezona).</p>
        </section>
      </div>
    </div>
  );
}
