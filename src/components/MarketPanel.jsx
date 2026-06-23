import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import CardView from './CardView.jsx';
import { suggestedPrice, netProceeds, TRADE_FEE_PCT } from '../game/market.js';

export default function MarketPanel() {
  const kovanice = useGameStore((s) => s.kovanice);
  const collection = useGameStore((s) => s.collection);
  const legacyCards = useGameStore((s) => s.legacy);
  const marketListings = useGameStore((s) => s.marketListings);
  const legacyMarketListings = useGameStore((s) => s.legacyMarketListings);
  const myListings = useGameStore((s) => s.myListings);
  const myLegacyListings = useGameStore((s) => s.myLegacyListings);
  const refreshMarket = useGameStore((s) => s.refreshMarket);
  const buyListing = useGameStore((s) => s.buyListing);
  const listCard = useGameStore((s) => s.listCard);
  const sellMyListing = useGameStore((s) => s.sellMyListing);
  const cancelListing = useGameStore((s) => s.cancelListing);

  const [legacy, setLegacy] = useState(false);
  const [prices, setPrices] = useState({});
  const [msg, setMsg] = useState('');

  const market = legacy ? legacyMarketListings : marketListings;
  const mine = legacy ? myLegacyListings : myListings;
  const sellable = legacy ? legacyCards : collection;

  const buy = (id) => { const r = buyListing(id, legacy); setMsg(r.ok ? '' : r.reason); };
  const list = (i, card) => {
    const price = prices[`${legacy}-${i}`] ?? suggestedPrice(card);
    const r = listCard(i, Number(price), legacy);
    setMsg(r.ok ? '' : r.reason);
  };

  return (
    <div className="market">
      <div className="market__head">
        <div className="app__tabs market__sub">
          <button className={`app__tab ${!legacy ? 'is-active' : ''}`} onClick={() => setLegacy(false)}>Transfer</button>
          <button className={`app__tab ${legacy ? 'is-active' : ''}`} onClick={() => setLegacy(true)}>Legacy tržište</button>
        </div>
        <span className="market__meta">🪙 {kovanice.toLocaleString('sr')} · fee {TRADE_FEE_PCT}%</span>
        <button className="prog__btn" onClick={refreshMarket}>Osvježi ponudu</button>
      </div>
      {msg && <p className="market__msg">{msg}</p>}

      <section>
        <h3>{legacy ? 'Legacy kolekcionarske karte' : 'Kupi s tržišta'} ({market.length})</h3>
        {market.length === 0 ? (
          <p className="prog__muted">Klikni „Osvježi ponudu".</p>
        ) : (
          <div className="app__grid">
            {market.map((l) => (
              <div key={l.id} className="market__cell">
                <CardView card={l.card} />
                <button className="market__buy" disabled={kovanice < l.price} onClick={() => buy(l.id)}>
                  Kupi · {l.price.toLocaleString('sr')} 🪙
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {mine.length > 0 && (
        <section>
          <h3>Moji oglasi ({mine.length})</h3>
          <div className="market__listings">
            {mine.map((l) => (
              <div key={l.id} className="market__row">
                <span><strong>{l.card.name}</strong> · {l.card.position} · OVR {l.card.overall}</span>
                <span className="market__price">{l.price.toLocaleString('sr')} 🪙 → neto {netProceeds(l.price).toLocaleString('sr')}</span>
                <div className="market__rowact">
                  <button onClick={() => { const r = sellMyListing(l.id, legacy); setMsg(r.ok ? `Prodato za ${r.net.toLocaleString('sr')} 🪙` : r.reason); }}>Prodaj</button>
                  <button className="market__cancel" onClick={() => cancelListing(l.id, legacy)}>Povuci</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3>Izloži {legacy ? 'Legacy ' : ''}kartu ({sellable.length})</h3>
        {sellable.length === 0 ? (
          <p className="prog__muted">{legacy ? 'Nemaš penzionisanih karata.' : 'Nemaš karata u kolekciji.'}</p>
        ) : (
          <div className="market__listings">
            {sellable.slice(0, 40).map((card, i) => (
              <div key={i} className="market__row">
                <span><strong>{card.name}</strong> · {card.position} · {card.rarity} · OVR {card.overall}</span>
                <input
                  type="number" min="50" className="market__input"
                  value={prices[`${legacy}-${i}`] ?? suggestedPrice(card)}
                  onChange={(e) => setPrices((p) => ({ ...p, [`${legacy}-${i}`]: e.target.value }))}
                />
                <button onClick={() => list(i, card)}>Izloži</button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
