import { useEffect, useRef, useState } from 'react';
import { useGameStore } from './store/useGameStore.js';
import AdminPanel from './components/AdminPanel.jsx';
import AccountPanel from './components/AccountPanel.jsx';
import CardView from './components/CardView.jsx';
import PackOpening from './components/PackOpening.jsx';
import MatchSim from './components/MatchSim.jsx';
import LeagueTable from './components/LeagueTable.jsx';
import ClubPanel from './components/ClubPanel.jsx';
import TrainingPanel from './components/TrainingPanel.jsx';
import AcademyPanel from './components/AcademyPanel.jsx';
import ScoutPanel from './components/ScoutPanel.jsx';
import EditionsPanel from './components/EditionsPanel.jsx';
import MedicalPanel from './components/MedicalPanel.jsx';
import SponsorsPanel from './components/SponsorsPanel.jsx';
import ProgressPanel from './components/ProgressPanel.jsx';
import SocialPanel from './components/SocialPanel.jsx';
import ProLeaguePanel from './components/ProLeaguePanel.jsx';
import MarketPanel from './components/MarketPanel.jsx';
import ReferralPanel from './components/ReferralPanel.jsx';
import AffiliatePanel from './components/AffiliatePanel.jsx';
import PremiumPanel from './components/PremiumPanel.jsx';
import WorldCupPanel from './components/WorldCupPanel.jsx';
import ShopPanel from './components/ShopPanel.jsx';
import MatchCanvas from './components/MatchCanvas.jsx';
import { SAMPLE_CARDS } from './game/sampleCards.js';

const TABS = [
  { id: 'club',      label: 'Klub',       icon: '🏠' },
  { id: 'cards',     label: 'Karte',      icon: '🃏' },
  { id: 'packs',     label: 'Kesice',     icon: '📦' },
  { id: 'market',    label: 'Tržište',    icon: '🏪' },
  { id: 'academy',   label: 'Akademija',  icon: '🎓' },
  { id: 'scout',     label: 'Scout',      icon: '🔭' },
  { id: 'train',     label: 'Trening',    icon: '💪' },
  { id: 'medical',   label: 'Medicinski', icon: '⚕️' },
  { id: 'sponsors',  label: 'Sponzori',   icon: '💼' },
  { id: 'match',     label: 'Meč',        icon: '⚽' },
  { id: 'livematch', label: 'Live Meč',   icon: '🎬' },
  { id: 'league',    label: 'Liga',       icon: '🏆' },
  { id: 'proleague', label: 'Profi liga', icon: '⭐' },
  { id: 'worldcup',  label: 'World Cup',  icon: '🌍' },
  { id: 'editions',  label: 'Edicije',    icon: '📅' },
  { id: 'progress',  label: 'Sezona',     icon: '📈' },
  { id: 'social',    label: 'Društvo',    icon: '👥' },
  { id: 'referral',  label: 'Referral',   icon: '🔗' },
  { id: 'affiliate', label: 'Affiliate',  icon: '💰' },
  { id: 'shop',      label: 'Kupi Lopte', icon: '🛒' },
  { id: 'premium',   label: 'Premium',    icon: '💎' },
  { id: 'account',   label: 'Nalog',      icon: '👤' },
  { id: 'admin',     label: 'Admin',      icon: '⚙️' },
];

// Najvažniji tabovi za mobile bottom nav (max 5)
const BOTTOM_TABS = ['club', 'packs', 'match', 'league', 'shop'];

export default function App() {
  const [tab, setTab] = useState('club');
  const resetGame = useGameStore((s) => s.resetGame);
  const initAuth = useGameStore((s) => s.initAuth);
  const lopte = useGameStore((s) => s.lopte);
  const kovanice = useGameStore((s) => s.kovanice);
  const saveTimer = useRef(null);

  useEffect(() => { initAuth(); }, [initAuth]);

  useEffect(() => {
    return useGameStore.subscribe((s, prev) => {
      if (!s.user) return;
      if (s.cloudStatus !== prev.cloudStatus) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => useGameStore.getState().syncToCloud(), 2000);
    });
  }, []);

  const currentTab = TABS.find((t) => t.id === tab) || TABS[0];

  return (
    <div className="app">
      {/* Sidebar — Desktop */}
      <aside className="sidebar">
        <div className="sidebar__logo">G</div>
        <nav className="sidebar__nav">
          {TABS.map((t, i) => {
            // Dodaj separator ispred Admin
            const showDivider = t.id === 'admin';
            return (
              <span key={t.id}>
                {showDivider && <div className="sidebar__divider" />}
                <button
                  className={`sidebar__item${tab === t.id ? ' is-active' : ''}`}
                  onClick={() => setTab(t.id)}
                  title={t.label}
                >
                  <span className="sidebar__icon">{t.icon}</span>
                  <span className="sidebar__label">{t.label}</span>
                </button>
              </span>
            );
          })}
        </nav>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar__title">{currentTab.icon} {currentTab.label}</div>
        <div className="topbar__balances">
          <div className="topbar__bal topbar__bal--green">
            <span className="topbar__icon">⚽</span>
            <span>{lopte?.toLocaleString() ?? 0}</span>
          </div>
          <div className="topbar__bal topbar__bal--gold">
            <span className="topbar__icon">🪙</span>
            <span>{kovanice?.toLocaleString() ?? 0}</span>
          </div>
          <button className="topbar__reset" onClick={resetGame} title="Reset napretka">↺</button>
        </div>
      </header>

      {/* Main content */}
      <main className="content">
        {tab === 'club' && <ClubPanel />}

        {tab === 'cards' && (
          <section className="app__grid">
            {SAMPLE_CARDS.map((card) => (
              <CardView key={card.name} card={card} />
            ))}
          </section>
        )}

        {tab === 'packs'     && <PackOpening />}
        {tab === 'market'    && <MarketPanel />}
        {tab === 'academy'   && <AcademyPanel />}
        {tab === 'scout'     && <ScoutPanel />}
        {tab === 'train'     && <TrainingPanel />}
        {tab === 'medical'   && <MedicalPanel />}
        {tab === 'sponsors'  && <SponsorsPanel />}
        {tab === 'match'     && <MatchSim />}
        {tab === 'livematch' && <MatchCanvas />}
        {tab === 'league'    && <LeagueTable />}
        {tab === 'proleague' && <ProLeaguePanel />}
        {tab === 'worldcup'  && <WorldCupPanel />}
        {tab === 'editions'  && <EditionsPanel />}
        {tab === 'progress'  && <ProgressPanel />}
        {tab === 'social'    && <SocialPanel />}
        {tab === 'referral'  && <ReferralPanel />}
        {tab === 'affiliate' && <AffiliatePanel />}
        {tab === 'shop'      && <ShopPanel />}
        {tab === 'premium'   && <PremiumPanel />}
        {tab === 'account'   && <AccountPanel />}
        {tab === 'admin'     && <AdminPanel />}
      </main>

      {/* Bottom nav — Mobile */}
      <nav className="bottomnav">
        {BOTTOM_TABS.map((id) => {
          const t = TABS.find((x) => x.id === id);
          return (
            <button
              key={id}
              className={`bottomnav__item${tab === id ? ' is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              <span className="bottomnav__icon">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
