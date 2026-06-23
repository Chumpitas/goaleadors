import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import CardView from './CardView.jsx';
import { POSITIONS } from '../game/constants.js';
import { RARITIES } from '../game/constants.js';
import { SCOUT_DURATION_HOURS, scoutSlots, isComplete, remainingMs, speedUpCost } from '../game/scouting.js';

const NATIONS = ['', 'Srbija', 'Hrvatska', 'Bosna', 'Španija', 'Engleska', 'Italija', 'Njemačka', 'Francuska'];

function fmt(ms) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}h ${m}m` : m ? `${m}m ${sec}s` : `${sec}s`;
}

export default function ScoutPanel() {
  const level = useGameStore((s) => s.scoutLevel);
  const missions = useGameStore((s) => s.scoutMissions);
  const lopte = useGameStore((s) => s.lopte);
  const startScout = useGameStore((s) => s.startScout);
  const speedUpScout = useGameStore((s) => s.speedUpScout);
  const collectScout = useGameStore((s) => s.collectScout);
  const skipScoutTime = useGameStore((s) => s.skipScoutTime);
  const cancelScout = useGameStore((s) => s.cancelScout);

  const [form, setForm] = useState({ position: 'ATT', rarityFocus: 'rare', minOverall: 70, nationality: '' });
  const [msg, setMsg] = useState('');
  const [found, setFound] = useState(null);
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const start = () => {
    const params = { ...form, minOverall: Number(form.minOverall) };
    if (!params.nationality) delete params.nationality;
    const res = startScout(params);
    setMsg(res.ok ? '' : res.reason);
  };

  const collect = (id) => {
    const res = collectScout(id);
    if (res.ok) setFound(res.card);
    else setMsg(res.reason);
  };

  return (
    <div className="scout">
      <p className="scout__intro">
        Scout mreža (§10.5) · nivo {level} · {missions.length}/{scoutSlots(level)} skauta aktivno
        {' '}· ⚽ {lopte.toLocaleString('sr')}
      </p>

      <div className="scout__form">
        <label>Pozicija
          <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
            {Object.values(POSITIONS).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label>Raritet
          <select value={form.rarityFocus} onChange={(e) => setForm({ ...form, rarityFocus: e.target.value })}>
            {Object.values(RARITIES).map((r) => (
              <option key={r.id} value={r.id}>{r.label} · {SCOUT_DURATION_HOURS[r.id]}h</option>
            ))}
          </select>
        </label>
        <label>Min OVR
          <input type="number" min="0" max="100" value={form.minOverall} onChange={(e) => setForm({ ...form, minOverall: e.target.value })} />
        </label>
        <label>Nacionalnost
          <select value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })}>
            {NATIONS.map((n) => <option key={n} value={n}>{n || 'bilo koja'}</option>)}
          </select>
        </label>
        <button className="scout__start" onClick={start}>Pošalji skauta</button>
      </div>
      {msg && <p className="scout__msg">{msg}</p>}

      <div className="scout__missions">
        {missions.map((m) => {
          const ready = isComplete(m);
          const rem = remainingMs(m);
          return (
            <div key={m.id} className={`scout__mission ${ready ? 'is-ready' : ''}`}>
              <div className="scout__mInfo">
                <strong>{m.params.position} · {m.params.rarityFocus}</strong>
                <span>min OVR {m.params.minOverall}{m.params.nationality ? ` · ${m.params.nationality}` : ''}</span>
                <span>{ready ? 'Spreman!' : `Preostalo: ${fmt(rem)}`}</span>
              </div>
              <div className="scout__mActions">
                {ready ? (
                  <button className="scout__collect" onClick={() => collect(m.id)}>Preuzmi</button>
                ) : (
                  <>
                    <button onClick={() => speedUpScout(m.id)} disabled={lopte < speedUpCost(m)}>Ubrzaj (⚽{speedUpCost(m)})</button>
                    <button onClick={() => skipScoutTime(m.id)}>Preskoči (demo)</button>
                  </>
                )}
                <button className="scout__cancel" onClick={() => cancelScout(m.id)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>

      {found && (
        <div className="scout__found">
          <p>Skaut je pronašao:</p>
          <CardView card={found} />
        </div>
      )}
    </div>
  );
}
