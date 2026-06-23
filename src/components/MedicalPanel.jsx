import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import {
  dailyRecovery,
  emergencyHealsPerWeek,
  energyStatus,
  canPlay,
  ENERGY_MAX,
  MEDICAL_RECOVERY_BONUS,
} from '../game/fatigue.js';

const STATUS_COLOR = { spremna: '#2c8c5e', umorna: '#e0a01e', iscrpljena: '#e8462f' };

export default function MedicalPanel() {
  const collection = useGameStore((s) => s.collection);
  const medicalLevel = useGameStore((s) => s.medicalLevel);
  const healsUsed = useGameStore((s) => s.emergencyHealsUsed);
  const setMedicalLevel = useGameStore((s) => s.setMedicalLevel);
  const drainCardEnergy = useGameStore((s) => s.drainCardEnergy);
  const emergencyHeal = useGameStore((s) => s.emergencyHeal);
  const advanceDay = useGameStore((s) => s.advanceDay);
  const [msg, setMsg] = useState('');

  const limit = emergencyHealsPerWeek(medicalLevel);

  const heal = (i) => {
    const res = emergencyHeal(i);
    if (!res.ok) setMsg(res.reason);
    else setMsg('');
  };

  return (
    <div className="medical">
      <div className="medical__head">
        <div className="medical__levels">
          Medicinski centar:
          {[1, 2, 3].map((lvl) => (
            <button key={lvl} className={`chip ${lvl === medicalLevel ? 'is-active' : ''}`} onClick={() => setMedicalLevel(lvl)}>
              Nivo {lvl}
            </button>
          ))}
        </div>
        <div className="medical__info">
          <span>Oporavak: <strong>{dailyRecovery(medicalLevel)}%/dan</strong> (+{MEDICAL_RECOVERY_BONUS[medicalLevel]}%)</span>
          <span>Hitno liječenje: <strong>{healsUsed}/{limit}</strong> ove sedmice</span>
          <button className="medical__rest" onClick={() => advanceDay(1)}>+1 dan (oporavak)</button>
        </div>
      </div>
      {msg && <p className="medical__msg">{msg}</p>}

      {collection.length === 0 ? (
        <p className="medical__empty">Nemaš karata. Osnuj klub ili otvori kesicu.</p>
      ) : (
        <div className="medical__grid">
          {collection.map((c, i) => {
            const energy = c.energy ?? ENERGY_MAX;
            const status = energyStatus(energy);
            return (
              <div key={i} className="medical__cell">
                <div className="medical__name">{c.name} <span className="medical__pos">{c.position}</span></div>
                <div className="medical__bar">
                  <div className="medical__fill" style={{ width: `${energy}%`, background: STATUS_COLOR[status] }} />
                </div>
                <div className="medical__row">
                  <span style={{ color: STATUS_COLOR[status] }}>{Math.round(energy)}% · {status}</span>
                </div>
                <div className="medical__actions">
                  <button onClick={() => drainCardEnergy(i)}>Odigraj (−20%)</button>
                  <button
                    disabled={healsUsed >= limit || energy >= ENERGY_MAX}
                    onClick={() => heal(i)}
                  >
                    Hitno
                  </button>
                </div>
                {!canPlay(energy) && <span className="medical__warn">ne može igrati (&lt;10%)</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
