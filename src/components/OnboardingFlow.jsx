/**
 * Fullscreen onboarding tok — prikazuje se nakon registracije, prije Dashboarda.
 * Wrapa postojeći ClubOnboarding s boljim vizualnim kontekstom.
 */
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';
import ClubOnboarding from './ClubOnboarding.jsx';

export default function OnboardingFlow() {
  const signOut = useGameStore((s) => s.signOut);
  const user = useGameStore((s) => s.user);

  return (
    <div className="onboarding-flow">
      {/* Pitch background — isti kao Landing, slabiji */}
      <div className="landing__pitch onboarding-flow__pitch" aria-hidden="true">
        <div className="landing__pitch-inner">
          <div className="landing__halfway" />
          <div className="landing__center-circle" />
          <div className="landing__center-dot" />
          <div className="landing__penalty landing__penalty--left" />
          <div className="landing__penalty landing__penalty--right" />
        </div>
      </div>
      <div className="landing__overlay onboarding-flow__overlay" />

      <div className="onboarding-flow__content">
        <motion.div
          className="onboarding-flow__card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <header className="onboarding-flow__header">
            <div className="landing__logo" style={{ margin: '0 auto 12px' }}>
              <span className="landing__logo-icon">G</span>
            </div>
            <h2 className="onboarding-flow__title">Kreiraj svoj klub</h2>
            <p className="onboarding-flow__sub">
              Dobrodošao, <strong>{user?.email}</strong>!
              Sada osnivamo tvoj klub — samo par koraka.
            </p>
          </header>

          <ClubOnboarding />

          <button className="onboarding-flow__signout" onClick={signOut}>
            Odjavi se
          </button>
        </motion.div>
      </div>
    </div>
  );
}
