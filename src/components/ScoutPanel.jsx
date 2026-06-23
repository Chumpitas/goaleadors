import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { POSITIONS } from '../game/constants.js';
import {
  maxConcurrentScouts,
  availablePotentials,
  regionTargetingAllowed,
  missionCost,
  missionDurationMs,
  isComplete,
  remainingMs,
} from '../game/scouting.js';
import {
  POTENTIAL_TYPES,
  REGIONS,
  signingCost,
  trainingSlotsForLevel,
  isExpired,
  MAX_TALENTS_PER_CLUB,
} from '../game/talents.js';
import { abilityById } from '../game/abilities.js';

const POTENTIAL_LABEL = { fast: 'Fast', standard: 'Standard', high: 'High', exceptional: 'Exceptional' };

function fmt(ms) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : m ? `${m}m` : `${s % 60}s`;
}

export default function ScoutPanel() {
  const level = useGameStore((s) => s.scoutLevel);
  const trainingLevel = useGameStore((s) => s.trainingCenterLevel);
  const missions = useGameStore((s) => s.scoutMissions);
  const talents = useGameStore((s) => s.talents);
  const kovanice = useGameStore((s) => s.kovanice);
  const setScoutLevel = (lvl) => useGameStore.setState({ scoutLevel: lvl });
  const startScout = useGameStore((s) => s.startScout);
  const resolveScout = useGameStore((s) => s.resolveScout);
  const signTalent = useGameStore((s) => s.signTalent);
  const releaseTalent = useGameStore((s) => s.releaseTalent);
  const setTalentTrainingSlot = useGameStore((s) => s.setTalentTrainingSlot);
  const pruneExpiredTalents = useGameStore((s) => s.pruneExpiredTalents);
  const skipScoutTime = useGameStore((s) => s.skipScoutTime);
  const cancelScout = useGameStore((s) => s.cancelScout);

  const potentials = availablePotentials(level);
  const [form, setForm] = useState({ position: 'ATT', potentialType: 'standard', region: 'any' });
  const [msg, setMsg] = useState('');
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => { pruneExpiredTalents(); tick((n) => n + 1); }, 1000);
    return () => clearInterval(t);
  }, [pruneExpiredTalents]);

  // forma potencijala mora ostati u dozvoljenom skupu za nivo
  useEffect(() => {
    if (!potentials.includes(form.potentialType)) setForm((f) => ({ ...f, potentialType: potentials[0] }));
  }, [level]); // eslint-disable-line

  const available = talents.filter((t) => t.status === 'available' && !isExpired(t));
  const signed = talents.filter((t) => t.status === 'signed');
  const slotsTotal = trainingSlotsForLevel(trainingLevel);
  const slotsUsed = signed.reduce((n, t) => n + (t.trainingSlot === 2 ? 2 : t.trainingSlot === 1 ? 1 : 0), 0);

  const start = () => {
    const params = { ...form };
    if (!regionTargetingAllowed(level) || params.region === 'any') delete params.region;
    const res = startScout(params);
    setMsg(res.ok ? '' : res.reason);
  };

  const sign = (id) => {
    const res = signTalent(id);
    setMsg(res.ok ? '' : res.reason);
  };

  const pot = POTENTIAL_TYPES[form.potentialType];

  return (
    <div className="scout">
      <div className="scout__top">
        <div className="scout__levels">
          Scout mreža:
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button key={lvl} className={`chip ${lvl === level ? 'is-active' : ''}`} onClick={() => setScoutLevel(lvl)}>{lvl}</button>
          ))}
        </div>
        <span className="scout__meta">{missions.length}/{maxConcurrentScouts(level)} skauta · 🪙 {kovanice.toLocaleString('sr')}</span>
      </div>

      <div className="scout__form">
        <label>Pozicija
          <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
            {Object.values(POSITIONS).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label>Potencijal
          <select value={form.potentialType} onChange={(e) => setForm({ ...form, potentialType: e.target.value })}>
            {potentials.map((p) => <option key={p} value={p}>{POTENTIAL_LABEL[p]}</option>)}
          </select>
        </label>
        {regionTargetingAllowed(level) && (
          <label>Regija
            <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
              <option value="any">bilo koja</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        )}
        <button className="scout__start" onClick={start}>
          Pošalji ({missionCost(form.potentialType).toLocaleString('sr')} 🪙)
        </button>
      </div>
      <p className="scout__hint">
        {POTENTIAL_LABEL[form.potentialType]}: {Math.round(pot.successChance * 100)}% uspjeh · OVR {pot.startOVRRange[0]}–{pot.startOVRRange[1]} → max {pot.maxOVRCeiling} · ~{fmt(missionDurationMs(form.potentialType, level))}
      </p>
      {msg && <p className="scout__msg">{msg}</p>}

      {missions.length > 0 && (
        <div className="scout__missions">
          {missions.map((m) => {
            const ready = isComplete(m);
            return (
              <div key={m.id} className={`scout__mission ${ready ? 'is-ready' : ''}`}>
                <div className="scout__mInfo">
                  <strong>{m.position} · {POTENTIAL_LABEL[m.potentialType]}{m.region !== 'any' ? ` · ${m.region}` : ''}</strong>
                  <span>{ready ? 'Skaut se vratio' : `Preostalo: ${fmt(remainingMs(m))}`}</span>
                </div>
                <div className="scout__mActions">
                  {ready ? (
                    <button className="scout__collect" onClick={() => { const r = resolveScout(m.id); setMsg(r.success ? '⚡ Pronađen talent!' : 'Misija bez rezultata.'); }}>Otvori</button>
                  ) : (
                    <button onClick={() => skipScoutTime(m.id)}>Preskoči (demo)</button>
                  )}
                  <button className="scout__cancel" onClick={() => cancelScout(m.id)}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {available.length > 0 && (
        <section className="talents">
          <h3>Dostupni talenti · potpiši dok ne istekne (48h)</h3>
          <div className="talents__grid">
            {available.map((t) => (
              <TalentCard key={t.id} t={t} footer={
                <div className="talent__act">
                  <span className="talent__win">⏳ {fmt(remainingMs({ completesAt: t.availableUntil }))}</span>
                  <button onClick={() => sign(t.id)}>Potpiši ({signingCost(t.potential).toLocaleString('sr')} 🪙)</button>
                </div>
              } />
            ))}
          </div>
        </section>
      )}

      <section className="talents">
        <h3>Moji talenti ({signed.length}/{MAX_TALENTS_PER_CLUB}) · trening slotovi {slotsUsed}/{slotsTotal}</h3>
        {signed.length === 0 ? (
          <p className="talents__empty">Nemaš potpisanih talenata. Pošalji skauta i potpiši pronađenog.</p>
        ) : (
          <div className="talents__grid">
            {signed.map((t) => (
              <TalentCard key={t.id} t={t} footer={
                <div className="talent__act">
                  <select value={t.trainingSlot ?? 0} onChange={(e) => { const r = setTalentTrainingSlot(t.id, Number(e.target.value) || null); if (!r.ok) setMsg(r.reason); }}>
                    <option value={0}>bez treninga (+2/sez)</option>
                    <option value={1}>standard (+5/sez)</option>
                    <option value={2}>focus (+8/sez)</option>
                  </select>
                  <button className="talent__release" onClick={() => releaseTalent(t.id)}>Otpusti</button>
                </div>
              } />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TalentCard({ t, footer }) {
  return (
    <div className="talent">
      <div className="talent__head">
        <span className="talent__ovr">{t.overall}</span>
        <div className="talent__id">
          <strong>{t.name}</strong>
          <span>{t.position} · {t.nationality} · {t.region}</span>
        </div>
      </div>
      <div className="talent__stats">
        <span>SHO {t.shooting}</span><span>PAS {t.passing}</span>
        <span>TAC {t.tackling}</span><span>PAC {t.pace}</span>
      </div>
      <div className="talent__sub">
        <span className={`talent__pot talent__pot--${t.potential}`}>{t.potential}</span>
        <span>{t.seasonsRemaining} sez</span>
      </div>
      {t.abilities.length > 0 && (
        <div className="talent__abilities">
          {t.abilities.map((id) => <span key={id}>{abilityById(id)?.name || id}</span>)}
        </div>
      )}
      {footer}
    </div>
  );
}
