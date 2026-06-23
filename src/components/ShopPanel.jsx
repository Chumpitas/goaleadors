import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { supabase } from '../lib/supabase.js';

const BUNDLES = [
  { id: 'starter', lopte: 100,  eur: 0.99,  label: 'Starter',  bonus: 0,    popular: false },
  { id: 'small',   lopte: 300,  eur: 2.99,  label: 'Mala',     bonus: 0,    popular: false },
  { id: 'medium',  lopte: 750,  eur: 6.99,  label: 'Srednja',  bonus: 50,   popular: true  },
  { id: 'large',   lopte: 1650, eur: 14.99, label: 'Velika',   bonus: 150,  popular: false },
  { id: 'xl',      lopte: 4000, eur: 29.99, label: 'XL',       bonus: 500,  popular: false },
  { id: 'mega',    lopte: 9500, eur: 59.99, label: 'Mega',     bonus: 1500, popular: false },
];

export default function ShopPanel() {
  const user = useGameStore((s) => s.user);
  const lopte = useGameStore((s) => s.lopte);
  const syncFromCloud = useGameStore((s) => s.syncFromCloud);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  async function handleBuy(bundle) {
    if (!user) {
      setError('Moraš biti prijavljen da kupiš Lopte. Idi na tab Nalog.');
      return;
    }
    setError(null);
    setLoading(bundle.id);

    try {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) throw new Error('Nisi prijavljen.');

      const res = await supabase.functions.invoke('stripe-checkout', {
        body: {
          bundleId: bundle.id,
          successUrl: window.location.origin + '/?payment=success',
          cancelUrl: window.location.origin + '/?payment=cancel',
        },
      });

      if (res.error) throw new Error(res.error.message || 'Greška pri kreiranju plaćanja.');
      const { url } = res.data;
      if (!url) throw new Error('Nije vraćen URL za plaćanje.');
      window.location.href = url;
    } catch (e) {
      setError(e.message);
      setLoading(null);
    }
  }

  // Provjeri da li se vraća s Stripe checkoutu
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get('payment');

  return (
    <div className="shop">
      <h2 className="shop__title">Kupi Lopte ⚽</h2>
      <p className="shop__subtitle">
        Trenutni balans: <strong>{lopte} ⚽</strong>
      </p>

      {paymentStatus === 'success' && (
        <div className="shop__notice shop__notice--ok">
          ✅ Plaćanje uspješno! Lopte će biti dodane čim se sinhronizuju.{' '}
          <button className="shop__sync" onClick={syncFromCloud}>Sinhronizuj sada</button>
        </div>
      )}
      {paymentStatus === 'cancel' && (
        <div className="shop__notice shop__notice--warn">
          ❌ Plaćanje otkazano. Pokušaj ponovo kad budeš spreman.
        </div>
      )}

      {error && <div className="shop__notice shop__notice--err">{error}</div>}

      {!user && (
        <div className="shop__notice shop__notice--warn">
          ⚠️ Za kupovinu je potreban nalog. Idi na <strong>tab Nalog</strong> i prijavi se.
        </div>
      )}

      <div className="shop__grid">
        {BUNDLES.map((b) => (
          <div key={b.id} className={`shop__card${b.popular ? ' shop__card--popular' : ''}`}>
            {b.popular && <div className="shop__badge">Najpopularnije</div>}
            <div className="shop__bundle-name">{b.label}</div>
            <div className="shop__lopte">
              ⚽ <span className="shop__lopte-amount">{b.lopte - b.bonus}</span>
              {b.bonus > 0 && (
                <span className="shop__bonus"> +{b.bonus} bonus</span>
              )}
            </div>
            <div className="shop__total">= {b.lopte} Loptica ukupno</div>
            <div className="shop__price">{b.eur.toFixed(2)} €</div>
            <button
              className="shop__buy"
              disabled={loading === b.id || !user}
              onClick={() => handleBuy(b)}
            >
              {loading === b.id ? 'Učitavam…' : 'Kupi'}
            </button>
          </div>
        ))}
      </div>

      <p className="shop__info">
        Plaćanje je sigurno i obrađuje se putem <strong>Stripe</strong>-a.
        Lopte se dodaju automatski nakon potvrde plaćanja.
      </p>
    </div>
  );
}
