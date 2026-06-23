import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { CURRENCIES } from '../game/currency.js';
import { PACKS } from '../game/packs.js';

const LEVELS = [
  { key: 'scoutLevel', label: 'Scout mreža', max: 5 },
  { key: 'trainingCenterLevel', label: 'Trening centar', max: 5 },
  { key: 'medicalLevel', label: 'Medicinski', max: 3 },
  { key: 'agencyLevel', label: 'Agencija', max: 5 },
];
const MANAGER_STATS = [
  { key: 'currentLeagueLevel', label: 'Nivo lige', min: 1, max: 5 },
  { key: 'winsLast30', label: 'Pobjede (30)', min: 0, max: 30 },
  { key: 'totalSeasons', label: 'Sezone', min: 0, max: 60 },
];

export default function AdminPanel() {
  const s = useGameStore();
  const [amt, setAmt] = useState(10000);

  const stats = {
    Kolekcija: s.collection.length,
    Talenti: s.talents.length,
    Legacy: s.legacy.length + s.legacyTalents.length,
    Rivalstva: s.rivalries.length,
    Referrali: s.referrals.length,
    'Dan / sezona': `${s.currentDay} / ${Math.floor((s.currentDay - 1) / 30) + 1}`,
  };

  return (
    <div className="admin">
      <p className="admin__warn">⚙️ Admin / dev alati — zaobilaze cijene i ograničenja. Promjene se odmah čuvaju lokalno.</p>

      <section className="admin__sec">
        <h3>Valute i resursi</h3>
        <div className="admin__row">
          <input type="number" value={amt} onChange={(e) => setAmt(Number(e.target.value))} />
          <button onClick={() => s.adminCredit(CURRENCIES.KOVANICE, amt)}>+ Kovanice</button>
          <button onClick={() => s.adminCredit(CURRENCIES.LOPTE, amt)}>+ Lopte</button>
          <button onClick={() => s.adminAddVeteranTokens(1)}>+1 Veteran token</button>
        </div>
        <p className="admin__bal">🪙 {s.kovanice.toLocaleString('sr')} · ⚽ {s.lopte.toLocaleString('sr')} · Veteran: {s.veteranTokens}</p>
      </section>

      <section className="admin__sec">
        <h3>Karte i kesice</h3>
        <div className="admin__row">
          {Object.values(PACKS).map((p) => (
            <button key={p.code} onClick={() => s.adminOpenPack(p.code)}>Otvori {p.name}</button>
          ))}
        </div>
        <div className="admin__row">
          {['common', 'rare', 'epic', 'legendary'].map((r) => (
            <button key={r} onClick={() => s.adminGrantCards(r, 1)}>+1 {r}</button>
          ))}
        </div>
      </section>

      <section className="admin__sec">
        <h3>Nivoi objekata</h3>
        <div className="admin__levels">
          {LEVELS.map((l) => (
            <label key={l.key}>
              {l.label}
              <select value={s[l.key]} onChange={(e) => s.adminSet({ [l.key]: Number(e.target.value) })}>
                {Array.from({ length: l.max }, (_, i) => i + 1).map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </label>
          ))}
        </div>
      </section>

      <section className="admin__sec">
        <h3>Vrijeme</h3>
        <div className="admin__row">
          <button onClick={() => s.advanceDay(1)}>+1 dan</button>
          <button onClick={() => s.advanceDay(7)}>+7 dana</button>
          <button onClick={() => s.advanceDay(30)}>+1 sezona</button>
        </div>
      </section>

      <section className="admin__sec">
        <h3>Manager Rating (World Cup)</h3>
        <div className="admin__levels">
          {MANAGER_STATS.map((m) => (
            <label key={m.key}>
              {m.label}
              <input type="number" min={m.min} max={m.max} value={s.managerStats[m.key]}
                onChange={(e) => s.adminSetManagerStat(m.key, Number(e.target.value))} />
            </label>
          ))}
        </div>
        <p className="admin__bal">Rating: <strong>{s.managerRating().total}</strong></p>
      </section>

      <section className="admin__sec">
        <h3>Stanje</h3>
        <div className="admin__stats">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="admin__stat"><span>{k}</span><strong>{v}</strong></div>
          ))}
        </div>
        <button className="admin__reset" onClick={() => s.resetGame()}>Reset cijele igre</button>
      </section>
    </div>
  );
}
