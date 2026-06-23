import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import {
  PREMIUM_PRICES,
  stadiumsForCountry,
  HISTORIC_CRESTS,
  SPECIAL_KITS,
} from '../game/cosmeticsPremium.js';

export default function PremiumPanel() {
  const club = useGameStore((s) => s.club);
  const lopte = useGameStore((s) => s.lopte);
  const owned = useGameStore((s) => s.ownedCosmetics);
  const buyStadium = useGameStore((s) => s.buyLegendaryStadium);
  const buyCosmetic = useGameStore((s) => s.buyPremiumCosmetic);
  const [msg, setMsg] = useState('');

  const country = club?.country;
  const stadiums = stadiumsForCountry(country);

  return (
    <div className="premium">
      <p className="premium__bar">⚽ Lopte: <strong>{lopte.toLocaleString('sr')}</strong> · Legendary tier (§9.4)</p>
      {msg && <p className="social__msg">{msg}</p>}

      <section>
        <h3>Legendarni stadioni — 1-of-1 po državi {country ? `(${country})` : ''}</h3>
        {!country ? (
          <p className="prog__muted">Osnuj klub i odaberi državu da vidiš stadione svoje države.</p>
        ) : (
          <div className="prem__grid">
            {stadiums.map((st) => {
              const mine = owned.stadiumId === st.id;
              const taken = st.preTaken && !mine;
              return (
                <div key={st.id} className={`prem__card ${taken ? 'is-taken' : ''} ${mine ? 'is-mine' : ''}`}>
                  <span className="prem__name">🏟️ {st.name}</span>
                  {taken ? (
                    <span className="prem__taken">ZAUZETO</span>
                  ) : mine ? (
                    <span className="prem__owned">Tvoj stadion ✓</span>
                  ) : (
                    <button disabled={lopte < PREMIUM_PRICES.stadium} onClick={() => { const r = buyStadium(st.id); setMsg(r.ok ? '' : r.reason); }}>
                      Kupi · {PREMIUM_PRICES.stadium} ⚽
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3>Historijski grbovi · {PREMIUM_PRICES.crest} ⚽</h3>
        <div className="prem__grid">
          {HISTORIC_CRESTS.map((c) => {
            const mine = owned.crestId === c.id;
            return (
              <div key={c.id} className={`prem__card ${mine ? 'is-mine' : ''}`}>
                <span className="prem__art" style={{ color: c.hex }}>{c.symbol}</span>
                <span className="prem__name">{c.name}</span>
                {mine ? <span className="prem__owned">U vlasništvu ✓</span> : (
                  <button disabled={lopte < PREMIUM_PRICES.crest} onClick={() => { const r = buyCosmetic('crest', c.id); setMsg(r.ok ? '' : r.reason); }}>Kupi</button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3>Special dresovi (gradijenti) · {PREMIUM_PRICES.kit} ⚽</h3>
        <div className="prem__grid">
          {SPECIAL_KITS.map((k) => {
            const mine = owned.kitId === k.id;
            return (
              <div key={k.id} className={`prem__card ${mine ? 'is-mine' : ''}`}>
                <span className="prem__kit" style={{ background: `linear-gradient(135deg, ${k.from}, ${k.to})` }} />
                <span className="prem__name">{k.name}</span>
                {mine ? <span className="prem__owned">U vlasništvu ✓</span> : (
                  <button disabled={lopte < PREMIUM_PRICES.kit} onClick={() => { const r = buyCosmetic('kit', k.id); setMsg(r.ok ? '' : r.reason); }}>Kupi</button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
