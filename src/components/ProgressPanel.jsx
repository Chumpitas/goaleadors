import { useGameStore } from '../store/useGameStore.js';
import {
  STREAK_REWARDS,
  SEASON_PASS_WEEKS,
  PREMIUM_PASS_COST_LOPTE,
  describeReward,
} from '../game/progression.js';

const STREAK_MILES = Object.keys(STREAK_REWARDS).map(Number);

export default function ProgressPanel() {
  const streak = useGameStore((s) => s.streak);
  const challenges = useGameStore((s) => s.dailyChallenges);
  const premium = useGameStore((s) => s.seasonPassPremium);
  const claimed = useGameStore((s) => s.passClaimed);
  const lopte = useGameStore((s) => s.lopte);
  const dailyLogin = useGameStore((s) => s.dailyLogin);
  const completeChallenge = useGameStore((s) => s.completeChallenge);
  const buyPremiumPass = useGameStore((s) => s.buyPremiumPass);
  const claimPassReward = useGameStore((s) => s.claimPassReward);

  const nextMile = STREAK_MILES.find((m) => m > streak);

  return (
    <div className="progress">
      <section className="prog__streak">
        <div>
          <h3>Login streak</h3>
          <p className="prog__big">{streak} <span>dana</span></p>
          {nextMile && <p className="prog__hint">Sljedeća nagrada na {nextMile} dana: {STREAK_REWARDS[nextMile].label}</p>}
        </div>
        <button className="prog__btn" onClick={dailyLogin}>Dnevni login (+1)</button>
      </section>

      <section>
        <h3>Dnevni izazovi</h3>
        {challenges.length === 0 ? (
          <p className="prog__muted">Klikni „Dnevni login" da dobiješ današnje izazove.</p>
        ) : (
          challenges.map((c) => (
            <div key={c.id} className={`challenge ${c.done ? 'is-done' : ''}`}>
              <div>
                <strong>{c.desc}</strong>
                <span className="challenge__reward">{describeReward(c.reward)}</span>
              </div>
              <button disabled={c.done} onClick={() => completeChallenge(c.id)}>{c.done ? '✓' : 'Ispuni'}</button>
            </div>
          ))
        )}
      </section>

      <section>
        <div className="pass__head">
          <h3>Sezonski pass (30 dana)</h3>
          {premium ? (
            <span className="pass__active">Premium aktivan ✦</span>
          ) : (
            <button className="prog__btn" disabled={lopte < PREMIUM_PASS_COST_LOPTE} onClick={buyPremiumPass}>
              Kupi Premium ({PREMIUM_PASS_COST_LOPTE} ⚽)
            </button>
          )}
        </div>

        <div className="pass__grid">
          {SEASON_PASS_WEEKS.map((w) => (
            <div key={w.week} className="pass__week">
              <div className="pass__wk">Sedmica {w.week}</div>
              <PassReward label="Free" reward={w.free} claimed={claimed.free.includes(w.week)} onClaim={() => claimPassReward(w.week, 'free')} />
              <PassReward label="Premium" reward={w.premium} locked={!premium} claimed={claimed.premium.includes(w.week)} onClaim={() => claimPassReward(w.week, 'premium')} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PassReward({ label, reward, claimed, locked, onClaim }) {
  return (
    <div className={`pass__row ${label === 'Premium' ? 'pass__row--prem' : ''}`}>
      <span className="pass__label">{label}</span>
      <span className="pass__desc">{describeReward(reward)}</span>
      <button disabled={claimed || locked} onClick={onClaim}>
        {claimed ? '✓' : locked ? '🔒' : 'Uzmi'}
      </button>
    </div>
  );
}
