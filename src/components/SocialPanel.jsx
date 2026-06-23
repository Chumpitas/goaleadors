import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { rivalryLevel, derbyBonusPct, streakLabel, MAX_RIVALRIES } from '../game/rivalries.js';
import { ultraLevelFromPoints, groupCapacity, groupUnlock, WEEKLY_ULTRA_CHALLENGES } from '../game/ultras.js';
import { describeReward } from '../game/progression.js';

export default function SocialPanel() {
  const rivalries = useGameStore((s) => s.rivalries);
  const ultraGroup = useGameStore((s) => s.ultraGroup);
  const addRivalry = useGameStore((s) => s.addRivalry);
  const removeRivalry = useGameStore((s) => s.removeRivalry);
  const playDerby = useGameStore((s) => s.playDerby);
  const createUltraGroup = useGameStore((s) => s.createUltraGroup);
  const claimUltraChallenge = useGameStore((s) => s.claimUltraChallenge);

  const [name, setName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [msg, setMsg] = useState('');
  const [lastDerby, setLastDerby] = useState(null);

  const derby = (id) => {
    const res = playDerby(id);
    if (res.ok) {
      setLastDerby(res);
      setMsg('');
    } else setMsg(res.reason);
  };

  return (
    <div className="social">
      <section>
        <h3>Rivalstva ({rivalries.length}/{MAX_RIVALRIES})</h3>
        <div className="social__add">
          <input value={name} maxLength={24} placeholder="Ime rivala" onChange={(e) => setName(e.target.value)} />
          <button onClick={() => { const r = addRivalry(name); setMsg(r.ok ? '' : r.reason); if (r.ok) setName(''); }}>Dodaj</button>
        </div>
        {msg && <p className="social__msg">{msg}</p>}

        {rivalries.map((r) => {
          const lvl = rivalryLevel(r.played);
          return (
            <div key={r.id} className="rival">
              <div className="rival__head">
                <strong>{r.opponent}</strong>
                <span className="rival__lvl">{lvl.name} · +{derbyBonusPct(r.played)}% derby</span>
              </div>
              <div className="rival__stats">
                <span>{r.played} mečeva</span>
                <span className="rival__w">{r.wins}P</span>
                <span className="rival__d">{r.draws}R</span>
                <span className="rival__l">{r.losses}I</span>
                <span>{streakLabel(r.currentStreak)}</span>
                {r.biggestWin != null && <span>najveća +{r.biggestWin}</span>}
              </div>
              <div className="rival__act">
                <button className="rival__play" onClick={() => derby(r.id)}>Odigraj derby</button>
                <button className="rival__rm" onClick={() => removeRivalry(r.id)}>✕</button>
              </div>
            </div>
          );
        })}

        {lastDerby && (
          <p className="social__derby">
            Derby {lastDerby.outcome === 'win' ? 'pobjeda' : lastDerby.outcome === 'draw' ? 'remi' : 'poraz'} {lastDerby.result.score.home}:{lastDerby.result.score.away}
            {' '}· +{lastDerby.reward.toLocaleString('sr')} 🪙 (derby +{lastDerby.bonusPct}%)
          </p>
        )}
      </section>

      <section>
        <h3>Ultra grupa</h3>
        {!ultraGroup ? (
          <div className="social__add">
            <input value={groupName} maxLength={24} placeholder="Ime Ultra grupe" onChange={(e) => setGroupName(e.target.value)} />
            <button onClick={() => createUltraGroup(groupName)}>Osnuj</button>
          </div>
        ) : (
          <div className="ultra">
            <div className="ultra__head">
              <div>
                <strong>{ultraGroup.name}</strong>
                <span className="ultra__lvl">Nivo {ultraLevelFromPoints(ultraGroup.points)} · {ultraGroup.points.toLocaleString('sr')} poena</span>
              </div>
              <span className="ultra__cap">
                {ultraGroup.members.length}/{groupCapacity(ultraLevelFromPoints(ultraGroup.points))} članova · {groupUnlock(ultraLevelFromPoints(ultraGroup.points))}
              </span>
            </div>

            <div className="ultra__members">
              {ultraGroup.members.map((m, i) => (
                <span key={i} className={`ultra__member ultra__member--${m.role.toLowerCase()}`}>{m.name} · {m.role}</span>
              ))}
            </div>

            <div className="ultra__challenges">
              <p className="ultra__sub">Sedmični izazovi (poeni rastu kad pobjeđuješ u derbijima):</p>
              {WEEKLY_ULTRA_CHALLENGES.map((c) => {
                const claimed = ultraGroup.weeklyClaimed.includes(c.id);
                return (
                  <div key={c.id} className="ultra__ch">
                    <span>{c.desc} → {describeReward(c.reward)}</span>
                    <button disabled={claimed} onClick={() => claimUltraChallenge(c.id)}>{claimed ? '✓' : 'Uzmi'}</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
