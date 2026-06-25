import { useGameStore } from '../store/useGameStore.js';

export default function DashboardPanel({ onNavigate }) {
  const club = useGameStore((s) => s.club);
  const lopte = useGameStore((s) => s.lopte);
  const kovanice = useGameStore((s) => s.kovanice);
  const collection = useGameStore((s) => s.collection);
  const managerStats = useGameStore((s) => s.managerStats);
  const streak = useGameStore((s) => s.streak);
  const talents = useGameStore((s) => s.talents);
  const activeSponsors = useGameStore((s) => s.activeSponsors);

  const level = managerStats?.currentLeagueLevel ?? 1;
  const seasons = managerStats?.totalSeasons ?? 0;
  const signedTalents = talents?.filter((t) => t.status === 'signed') ?? [];

  const leagueNames = ['', 'Amaterska', 'Regionalna', 'Poluprofesionalna', 'Profesionalna', 'Elitna'];
  const leagueName = leagueNames[level] ?? `Liga ${level}`;

  const quickActions = [
    { icon: '⚽', label: 'Odigraj meč', tab: 'match', color: '#22c55e' },
    { icon: '📦', label: 'Otvori kesicu', tab: 'packs', color: '#8b3fd1' },
    { icon: '👥', label: 'Moj tim', tab: 'myteam', color: '#1d4ed8' },
    { icon: '🃏', label: 'Karte', tab: 'cards', color: '#0ea5e9' },
  ];

  return (
    <div className="dash">
      {/* Pozdrav */}
      <div className="dash__greeting">
        <div>
          <h1 className="dash__club-name">{club?.name ?? 'Moj klub'}</h1>
          <p className="dash__sub">{leagueName} · Sezona {seasons + 1}</p>
        </div>
        <div className="dash__streak">
          <span className="dash__streak-num">{streak ?? 0}</span>
          <span className="dash__streak-label">🔥 streak</span>
        </div>
      </div>

      {/* Balans kartice */}
      <div className="dash__balances">
        <div className="dash__bal dash__bal--ball">
          <span className="dash__bal-icon">⚽</span>
          <div>
            <span className="dash__bal-val">{(lopte ?? 0).toLocaleString('sr')}</span>
            <span className="dash__bal-label">Lopte</span>
          </div>
        </div>
        <div className="dash__bal dash__bal--coin">
          <span className="dash__bal-icon">🪙</span>
          <div>
            <span className="dash__bal-val">{(kovanice ?? 0).toLocaleString('sr')}</span>
            <span className="dash__bal-label">Kovanice</span>
          </div>
        </div>
        <div className="dash__bal dash__bal--cards">
          <span className="dash__bal-icon">🃏</span>
          <div>
            <span className="dash__bal-val">{collection?.length ?? 0}</span>
            <span className="dash__bal-label">Karata</span>
          </div>
        </div>
      </div>

      {/* Brze akcije */}
      <div className="dash__section">
        <h2 className="dash__section-title">Brze akcije</h2>
        <div className="dash__actions">
          {quickActions.map((a) => (
            <button
              key={a.tab}
              className="dash__action"
              style={{ '--action-color': a.color }}
              onClick={() => onNavigate(a.tab)}
            >
              <span className="dash__action-icon">{a.icon}</span>
              <span className="dash__action-label">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Status kluba */}
      <div className="dash__section">
        <h2 className="dash__section-title">Status kluba</h2>
        <div className="dash__status-grid">
          <div className="dash__status-card" onClick={() => onNavigate('academy')}>
            <span className="dash__status-icon">🎓</span>
            <span className="dash__status-val">{signedTalents.length}</span>
            <span className="dash__status-label">Talenti</span>
          </div>
          <div className="dash__status-card" onClick={() => onNavigate('sponsors')}>
            <span className="dash__status-icon">💼</span>
            <span className="dash__status-val">{activeSponsors?.length ?? 0}</span>
            <span className="dash__status-label">Sponzori</span>
          </div>
          <div className="dash__status-card" onClick={() => onNavigate('league')}>
            <span className="dash__status-icon">🏆</span>
            <span className="dash__status-val">{level}</span>
            <span className="dash__status-label">Nivo lige</span>
          </div>
          <div className="dash__status-card" onClick={() => onNavigate('progress')}>
            <span className="dash__status-icon">📈</span>
            <span className="dash__status-val">{seasons}</span>
            <span className="dash__status-label">Sezona</span>
          </div>
        </div>
      </div>

      {/* Savjet */}
      <div className="dash__tip">
        <span className="dash__tip-icon">💡</span>
        <span>
          {collection.length < 11
            ? 'Otvori kesicu da dobiješ više igrača za tim!'
            : signedTalents.length === 0
            ? 'Posjeti Akademiju i potpiši talente za budućnost.'
            : 'Odigraj meč i osvoji lopte za nove kesice!'}
        </span>
      </div>
    </div>
  );
}
