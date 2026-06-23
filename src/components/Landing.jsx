import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';

export default function Landing() {
  const signIn = useGameStore((s) => s.signIn);
  const signUp = useGameStore((s) => s.signUp);
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (mode === 'register' && !agreed) {
      setMsg({ type: 'err', text: 'Prihvati uvjete korištenja.' });
      return;
    }
    setMsg(null);
    setLoading(true);
    try {
      if (mode === 'register') {
        const res = await signUp(email, password);
        if (!res.ok) throw new Error(res.error || 'Greška pri registraciji.');
        if (res.needsConfirm) setMsg({ type: 'ok', text: 'Potvrdi e-mail pa se prijavi.' });
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
    <div className="landing2">
      {/* Top — dark hero with logo */}
      <div className="landing2__hero">
        <img src="/logo-goal.svg" alt="Goaleadors" className="landing2__logo" />
      </div>

      {/* Bottom — yellow sheet */}
      <motion.div
        className="landing2__sheet"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
      >
        {/* Tabs */}
        <div className="landing2__tabs">
          <button
            className={`landing2__tab${mode === 'login' ? ' is-active' : ''}`}
            onClick={() => { setMode('login'); setMsg(null); }}
          >
            PRIJAVA
          </button>
          <button
            className={`landing2__tab${mode === 'register' ? ' is-active' : ''}`}
            onClick={() => { setMode('register'); setMsg(null); }}
          >
            REGISTRACIJA
          </button>
        </div>

        <form className="landing2__form" onSubmit={handleSubmit}>
          <div className="landing2__field">
            <label className="landing2__label">EMAIL</label>
            <input
              className="landing2__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="landing2__field">
            <label className="landing2__label">LOZINKA</label>
            <input
              className="landing2__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 8 : 1}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
          </div>

          {mode === 'register' && (
            <label className="landing2__checkbox">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>I accept the Terms of Service and Privacy Policy</span>
            </label>
          )}

          {msg && (
            <div className={`landing2__msg landing2__msg--${msg.type}`}>
              {msg.text}
            </div>
          )}

          <button className="landing2__submit" type="submit" disabled={loading}>
            {loading ? 'Učitavam…' : mode === 'login' ? 'PRIJAVI SE' : 'REGISTRUJ SE'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
