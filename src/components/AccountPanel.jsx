import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';

const STATUS_LABEL = { idle: '—', loading: 'učitavam…', saving: 'snimam…', saved: 'sinhronizovano ✓', error: 'greška' };

export default function AccountPanel() {
  const enabled = useGameStore((s) => s.authEnabled);
  const user = useGameStore((s) => s.user);
  const cloudStatus = useGameStore((s) => s.cloudStatus);
  const signIn = useGameStore((s) => s.signIn);
  const signUp = useGameStore((s) => s.signUp);
  const signOut = useGameStore((s) => s.signOut);
  const syncToCloud = useGameStore((s) => s.syncToCloud);
  const syncFromCloud = useGameStore((s) => s.syncFromCloud);

  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');

  if (!enabled) {
    return (
      <div className="account">
        <div className="account__card">
          <h3>Backend nije konfigurisan</h3>
          <p>Da uključiš oblak (auth + cloud-save), postavi u <code>.env.local</code>:</p>
          <pre className="account__pre">VITE_SUPABASE_URL=...{'\n'}VITE_SUPABASE_ANON_KEY=...</pre>
          <p className="account__hint">Pa primijeni migraciju <code>supabase/migrations/0001_game_states.sql</code>. Dok nije postavljeno, igra radi lokalno (localStorage).</p>
        </div>
      </div>
    );
  }

  const submit = async () => {
    const fn = mode === 'in' ? signIn : signUp;
    const r = await fn(email, pw);
    if (!r.ok) setMsg(r.reason);
    else if (r.needsConfirm) setMsg('Provjeri email za potvrdu naloga.');
    else setMsg('');
  };

  return (
    <div className="account">
      <div className="account__card">
        {user ? (
          <>
            <h3>Prijavljen</h3>
            <p className="account__email">{user.email}</p>
            <p className="account__status">Cloud: {STATUS_LABEL[cloudStatus]}</p>
            <div className="account__actions">
              <button onClick={() => syncToCloud()}>Sačuvaj u oblak</button>
              <button onClick={() => syncFromCloud()}>Učitaj iz oblaka</button>
              <button className="account__out" onClick={() => signOut()}>Odjava</button>
            </div>
            <p className="account__hint">Napredak se automatski sinhronizuje s oblakom dok si prijavljen.</p>
          </>
        ) : (
          <>
            <div className="account__tabs">
              <button className={mode === 'in' ? 'is-active' : ''} onClick={() => setMode('in')}>Prijava</button>
              <button className={mode === 'up' ? 'is-active' : ''} onClick={() => setMode('up')}>Registracija</button>
            </div>
            <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="lozinka" value={pw} onChange={(e) => setPw(e.target.value)} />
            <button className="account__submit" onClick={submit}>{mode === 'in' ? 'Prijavi se' : 'Registruj se'}</button>
            {msg && <p className="account__msg">{msg}</p>}
          </>
        )}
      </div>
    </div>
  );
}
