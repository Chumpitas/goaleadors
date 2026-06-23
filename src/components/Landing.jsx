import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';

export default function Landing() {
  const signIn = useGameStore((s) => s.signIn);
  const signUp = useGameStore((s) => s.signUp);
  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await signUp(email, password);
        if (!res.ok) throw new Error(res.error || 'Greška pri registraciji.');
        if (res.needsConfirm) {
          setMsg({ type: 'ok', text: 'Potvrdi e-mail pa se prijavi.' });
        }
      } else {
        const res = await signIn(email, password);
        if (!res.ok) throw new Error(res.error || 'Pogrešan e-mail ili lozinka.');
      }
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing">
      {/* Pitch background (CSS) */}
      <div className="landing__pitch" aria-hidden="true">
        <div className="landing__pitch-inner">
          <div className="landing__halfway" />
          <div className="landing__center-circle" />
          <div className="landing__center-dot" />
          <div className="landing__penalty landing__penalty--left" />
          <div className="landing__penalty landing__penalty--right" />
          <div className="landing__goal landing__goal--left" />
          <div className="landing__goal landing__goal--right" />
          <div className="landing__stripe" />
        </div>
      </div>

      {/* Dark overlay gradient */}
      <div className="landing__overlay" />

      {/* Content */}
      <div className="landing__content">
        <motion.div
          className="landing__card"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Logo */}
          <div className="landing__logo">
            <img src="/logo-goal.svg" alt="Goaleadors" className="landing__logo-img" />
          </div>
          <p className="landing__tagline">Football manager · card game</p>

          {/* Tabs */}
          <div className="landing__tabs">
            <button
              className={`landing__tab${mode === 'register' ? ' is-active' : ''}`}
              onClick={() => { setMode('register'); setMsg(null); }}
            >
              Registracija
            </button>
            <button
              className={`landing__tab${mode === 'login' ? ' is-active' : ''}`}
              onClick={() => { setMode('login'); setMsg(null); }}
            >
              Prijava
            </button>
          </div>

          <form className="landing__form" onSubmit={handleSubmit}>
            <div className="landing__field">
              <label className="landing__label">E-mail</label>
              <input
                className="landing__input"
                type="email"
                placeholder="tvoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="landing__field">
              <label className="landing__label">Lozinka</label>
              <input
                className="landing__input"
                type="password"
                placeholder={mode === 'register' ? 'Min. 8 znakova' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'register' ? 8 : 1}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>

            {msg && (
              <div className={`landing__msg landing__msg--${msg.type}`}>
                {msg.text}
              </div>
            )}

            <button className="landing__submit" type="submit" disabled={loading}>
              {loading
                ? 'Učitavam…'
                : mode === 'register'
                ? '⚽ Kreiraj nalog'
                : 'Prijavi se'}
            </button>
          </form>

          <p className="landing__switch">
            {mode === 'register' ? 'Već imaš nalog? ' : 'Nemaš nalog? '}
            <button
              className="landing__switch-btn"
              onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setMsg(null); }}
            >
              {mode === 'register' ? 'Prijavi se' : 'Registruj se'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
