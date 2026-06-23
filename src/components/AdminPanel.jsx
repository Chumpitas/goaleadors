import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { supabase } from '../lib/supabase.js';
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

function PlayersTab() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    supabase
      .from('game_states')
      .select('user_id, state, updated_at')
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { setErr(error.message); }
        else {
          setPlayers((data || []).map((row) => ({
            userId: row.user_id,
            club: row.state?.club?.name || '—',
            country: row.state?.club?.country || '—',
            lopte: Number(row.state?.lopte || 0),
            kovanice: Number(row.state?.kovanice || 0),
            cards: (row.state?.collection || []).length,
            day: row.state?.currentDay || 1,
            updated: row.updated_at,
          })));
        }
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="admin__loading">Učitavam podatke…</p>;
  if (err) return <p className="admin__err">Greška: {err}</p>;
  if (!players.length) return <p className="admin__empty">Nema registrovanih igrača.</p>;

  return (
    <div className="admin__players">
      <p className="admin__count">{players.length} igrač{players.length === 1 ? '' : 'a'}</p>
      <div className="admin__table-wrap">
        <table className="admin__table">
          <thead>
            <tr>
              <th>Klub</th>
              <th>Država</th>
              <th>⚽ Lopte</th>
              <th>🪙 Kovanice</th>
              <th>Karte</th>
              <th>Dan</th>
              <th>Zadnja aktivnost</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.userId}>
                <td><strong>{p.club}</strong></td>
                <td>{p.country}</td>
                <td>{p.lopte.toLocaleString()}</td>
                <td>{p.kovanice.toLocaleString()}</td>
                <td>{p.cards}</td>
                <td>{p.day}</td>
                <td className="admin__date">{new Date(p.updated).toLocaleDateString('sr')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DevTab() {
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
    <>
      <p className="admin__warn">⚙️ Dev alati — zaobilaze cijene i ograničenja.</p>

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
        <h3>Manager Rating</h3>
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
    </>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('players');

  return (
    <div className="admin">
      <div className="admin__tabs">
        <button className={`admin__tab${tab === 'players' ? ' is-active' : ''}`} onClick={() => setTab('players')}>👥 Igrači</button>
        <button className={`admin__tab${tab === 'dev' ? ' is-active' : ''}`} onClick={() => setTab('dev')}>⚙️ Dev alati</button>
      </div>
      {tab === 'players' ? <PlayersTab /> : <DevTab />}
    </div>
  );
}
