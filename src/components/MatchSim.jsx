import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';
import { buildLineup, simulateMatch } from '../game/matchEngine.js';
import { FORMATIONS, STYLES, MENTALITIES } from '../game/tactics.js';

const FORMATION_OPTS = Object.keys(FORMATIONS);
const STYLE_OPTS = Object.keys(STYLES);
const MENTALITY_OPTS = Object.keys(MENTALITIES);

function TacticsPicker({ label, value, onChange }) {
  return (
    <div className="tactics">
      <h3>{label}</h3>
      <label>
        Formacija
        <select value={value.formation} onChange={(e) => onChange({ ...value, formation: e.target.value })}>
          {FORMATION_OPTS.map((f) => (
            <option key={f} value={f}>{f} · {FORMATIONS[f].karakter}</option>
          ))}
        </select>
      </label>
      <label>
        Stil
        <select value={value.style} onChange={(e) => onChange({ ...value, style: e.target.value })}>
          {STYLE_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>
        Mentalitet
        <select value={value.mentality} onChange={(e) => onChange({ ...value, mentality: e.target.value })}>
          {MENTALITY_OPTS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
    </div>
  );
}

export default function MatchSim() {
  const pool = useGameStore((s) => s.pool);
  const [home, setHome] = useState({ formation: '4-3-3', style: 'High Press', mentality: 'Attacking' });
  const [away, setAway] = useState({ formation: '5-4-1', style: 'Defensive', mentality: 'Defensive' });
  const [result, setResult] = useState(null);

  // Postave (najbolji OVERALL po liniji) — memoizirane po formaciji.
  const homeLineup = useMemo(() => buildLineup(pool, home.formation), [pool, home.formation]);
  const awayLineup = useMemo(() => buildLineup(pool, away.formation), [pool, away.formation]);

  const play = () => {
    const res = simulateMatch(
      { name: 'Domaći', cards: homeLineup, ...home, isHome: true, crowdFill: 95 },
      { name: 'Gosti', cards: awayLineup, ...away }
    );
    setResult(res);
  };

  return (
    <div className="match">
      <div className="match__tactics">
        <TacticsPicker label="Domaći" value={home} onChange={setHome} />
        <TacticsPicker label="Gosti" value={away} onChange={setAway} />
      </div>

      <button className="match__play" onClick={play}>Simuliraj meč</button>

      {result && (
        <motion.div className="match__result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="scoreboard">
            <span className="scoreboard__name">Domaći</span>
            <span className="scoreboard__score">{result.score.home} : {result.score.away}</span>
            <span className="scoreboard__name">Gosti</span>
          </div>
          <div className="scoreboard__char">{result.character.label}</div>

          <table className="statline">
            <tbody>
              <Row label="Posjed" h={`${result.stats.possession.home}%`} a={`${result.stats.possession.away}%`} />
              <Row label="Šutevi" h={result.stats.shots.home} a={result.stats.shots.away} />
              <Row label="Na gol" h={result.stats.onTarget.home} a={result.stats.onTarget.away} />
              <Row label="Šanse" h={result.stats.chances.home} a={result.stats.chances.away} />
              <Row label="Ocjena" h={result.stats.rating.home} a={result.stats.rating.away} />
            </tbody>
          </table>

          <ul className="feed">
            {result.events.map((e, i) => (
              <li key={i} className={e.isGoal ? 'feed__goal' : ''}>
                <span className="feed__min">{e.minute}'</span>
                <span>
                  {e.isGoal ? '⚽ GOL' : '· šansa'} — {e.team === 'home' ? 'Domaći' : 'Gosti'}
                  {e.shooter ? ` (${e.shooter}, ${e.typeLabel})` : ''}
                  {e.score ? `  ${e.score}` : ''}
                </span>
              </li>
            ))}
            {result.events.length === 0 && <li>Bez šansi — čvrst meč.</li>}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

function Row({ label, h, a }) {
  return (
    <tr>
      <td className="statline__h">{h}</td>
      <td className="statline__label">{label}</td>
      <td className="statline__a">{a}</td>
    </tr>
  );
}
