import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { WORLD_CUP_NATIONS, WC_GROUPS, WC_EDITION_CONFIG } from '../game/worldCup.js';

const PLACEMENT_LABEL = {
  winner: '🥇 Prvak svijeta!', runnerUp: '🥈 Finale (drugo mjesto)', third: '🥉 Treće mjesto',
  sf: 'Polufinale', qf: 'Četvrtfinale', group: 'Ispao u grupnoj fazi',
};

const RATING_MAX = { leagueLevel: 1200, winRate30: 1500, europeanResults: 1000, seasonsPlayed: 500 };
const RATING_LABEL = { leagueLevel: 'Nivo lige', winRate30: 'Win rate (30)', europeanResults: 'Evropa', seasonsPlayed: 'Sezone' };

export default function WorldCupPanel() {
  const managerRating = useGameStore((s) => s.managerRating());
  const veteranTokens = useGameStore((s) => s.veteranTokens);
  const application = useGameStore((s) => s.wcApplication);
  const qualified = useGameStore((s) => s.wcQualified);
  const result = useGameStore((s) => s.wcResult);
  const trophies = useGameStore((s) => s.wcTrophies);
  const applyWorldCup = useGameStore((s) => s.applyWorldCup);
  const runQualification = useGameStore((s) => s.runQualification);
  const runWorldCup = useGameStore((s) => s.runWorldCup);

  const [picks, setPicks] = useState(['Brazil', '', '']);
  const [msg, setMsg] = useState('');

  const setPick = (i, v) => setPicks((p) => p.map((x, idx) => (idx === i ? v : x)));

  return (
    <div className="wc">
      <section className="wc__rating">
        <div className="wc__rhead">
          <h3>Manager Rating</h3>
          <span className="wc__total">{managerRating.total}</span>
        </div>
        {Object.entries(managerRating.breakdown).map(([k, v]) => (
          <div key={k} className="wc__bar">
            <span className="wc__blabel">{RATING_LABEL[k]}</span>
            <div className="wc__btrack"><div className="wc__bfill" style={{ width: `${Math.min(100, (v / RATING_MAX[k]) * 100)}%` }} /></div>
            <span className="wc__bval">{v}/{RATING_MAX[k]}</span>
          </div>
        ))}
        <p className="wc__hint">Poboljšaj: viša liga, bolji win-rate (30 mečeva), evropski rezultati, više sezona. Veteran tokeni: <strong>{veteranTokens}</strong>{trophies.length ? ` · trofeji: ${trophies.join(', ')}` : ''}</p>
      </section>

      <section>
        <h3>Prijava za selektora (max 3 nacije po prioritetu)</h3>
        <div className="wc__picks">
          {[0, 1, 2].map((i) => (
            <select key={i} value={picks[i]} onChange={(e) => setPick(i, e.target.value)}>
              <option value="">{i === 0 ? '— prioritet 1 —' : '— opciono —'}</option>
              {WORLD_CUP_NATIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          ))}
          <button className="prog__btn" onClick={() => { const r = applyWorldCup(picks); setMsg(r.ok ? 'Prijava poslata.' : r.reason); }}>Prijavi se</button>
        </div>
        {msg && <p className="wc__msg">{msg}</p>}
        {application && (
          <div className="wc__qual">
            <p>Prijavljen za: <strong>{application.nations.join(' › ')}</strong></p>
            {!qualified ? (
              <button className="prog__btn" onClick={() => { const r = runQualification(); setMsg(r.qualified ? '✅ Kvalifikovan!' : '❌ Nisi prošao kvalifikacije — poboljšaj rating.'); }}>
                Pokreni kvalifikacije
              </button>
            ) : (
              <button className="prog__btn" onClick={() => runWorldCup()}>Pokreni World Cup ({application.nations[0]})</button>
            )}
          </div>
        )}
      </section>

      {result && (
        <section className="wc__result">
          <h3>World Cup — {result.nation}: {PLACEMENT_LABEL[result.placement]}</h3>
          <p>🏆 Prvak: <strong>{result.winner}</strong> · 🥈 {result.runnerUp} · 🥉 {result.thirdPlace}</p>
          <div className="wc__bracket">
            <div><strong>Finale:</strong> {result.knockout.final.a} {result.knockout.final.score} {result.knockout.final.b} → {result.knockout.final.winner}</div>
            <div><strong>Za 3. mjesto:</strong> {result.knockout.third.a} {result.knockout.third.score} {result.knockout.third.b} → {result.knockout.third.winner}</div>
          </div>
        </section>
      )}

      <section className="wc__info">
        <h3>Format & WC edicija</h3>
        <div className="wc__groups">
          {Object.entries(WC_GROUPS).map(([g, nations]) => (
            <div key={g} className="wc__group"><strong>Grupa {g}</strong>{nations.map((n) => <span key={n}>{n}</span>)}</div>
          ))}
        </div>
        <p className="wc__hint">
          WC edicija: {WC_EDITION_CONFIG.totalCards} karata, min {WC_EDITION_CONFIG.cardsPerNation}/naciji, +30% Epic šanse, traje {WC_EDITION_CONFIG.duration} sezone.
          Top 2 iz svake grupe → knockout (četvrtfinale → polufinale → 3. mjesto → finale).
        </p>
      </section>
    </div>
  );
}
