import { useEffect, useRef, useState } from 'react';
import { useGameStore } from './store/useGameStore.js';
import Landing from './components/Landing.jsx';
import OnboardingFlow from './components/OnboardingFlow.jsx';
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

// Svi dostupni tabovi — vidljivost se kontroliše kroz VISIBLE_TABS
const ALL_TABS = [
  { id: 'club',      label: 'Moj klub',    icon: '🏠' },
  { id: 'cards',     label: 'Karte',       icon: '🃏' },
  { id: 'packs',     label: 'Kesice',      icon: '📦' },
  { id: 'match',     label: 'Meč',         icon: '⚽' },
  { id: 'league',    label: 'Liga',        icon: '🏆' },
  { id: 'shop',      label: 'Kupi Lopte',  icon: '🛒' },
  { id: 'account',   label: 'Nalog',       icon: '👤' },
  // --- Otključavaju se progresijom ---
  { id: 'market',    label: 'Tržište',     icon: '🏪',  unlock: 'liga_1' },
  { id: 'train',     label: 'Trening',     icon: '💪',  unlock: 'liga_1' },
  { id: 'medical',   label: 'Medicinski',  icon: '⚕️',  unlock: 'liga_1' },
  { id: 'academy',   label: 'Akademija',   icon: '🎓',  unlock: 'liga_5' },
  { id: 'scout',     label: 'Scout',       icon: '🔭',  unlock: 'liga_5' },
  { id: 'sponsors',  label: 'Sponzori',    icon: '💼',  unlock: 'liga_5' },
  { id: 'livematch', label: 'Live Meč',    icon: '🎬',  unlock: 'liga_5' },
  { id: 'proleague', label: 'Profi liga',  icon: '⭐',  unlock: 'promo' },
  { id: 'editions',  label: 'Edicije',     icon: '📅',  unlock: 'promo' },
  { id: 'progress',  label: 'Sezona',      icon: '📈',  unlock: 'promo' },
  { id: 'social',    label: 'Društvo',     icon: '👥',  unlock: 'promo' },
  { id: 'referral',  label: 'Referral',    icon: '🔗',  unlock: 'promo' },
  { id: 'worldcup',  label: 'World Cup',   icon: '🌍',  unlock: 'promo' },
  { id: 'affiliate', label: 'Affiliate',   icon: '💰',  unlock: 'promo' },
  { id: 'premium',   label: 'Premium',     icon: '💎',  unlock: 'promo' },
  { id: 'admin',     label: 'Admin',       icon: '⚙️',  unlock: 'dev' },
];

// Tabovi uvijek vidljivi (bez unlock uvjeta)
function visibleTabs(devMode = false) {
  return ALL_TABS.filter((t) => {
    if (!t.unlock) return true;                  // uvijek vidljiv
    if (t.unlock === 'dev') return devMode;      // samo u dev modu
    // TODO: provjeriti napredak igrača — za sada samo core tabovi
    return false;
  });
}

// Mobile bottom nav — 5 najvažnijih
const BOTTOM_IDS = ['club', 'packs', 'match', 'league', 'shop'];

export default function App() {
  const user = useGameStore((s) => s.user);
  const club = useGameStore((s) => s.club);
  const initAuth = useGameStore((s) => s.initAuth);
  const lopte = useGameStore((s) => s.lopte);
  const kovanice = useGameStore((s) => s.kovanice);
  const resetGame = useGameStore((s) => s.resetGame);
  const saveTimer = useRef(null);

  const [tab, setTab] = useState('club');
  const [authReady, setAuthReady] = useState(false);
  // Dev mode — drži skriveno, aktivira se s ?dev=1 u URL-u
  const devMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev');

  useEffect(() => {
    initAuth().finally(() => setAuthReady(true));
  }, [initAuth]);

  // Auto-sync u cloud (debounce 2s)
  useEffect(() => {
    return useGameStore.subscribe((s, prev) => {
      if (!s.user) return;
      if (s.cloudStatus !== prev.cloudStatus) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => useGameStore.getState().syncToCloud(), 2000);
    });
  }, []);

  // Loading splash (dok se auth inicijalizuje)
  if (!authReady) {
    return (
      <div className="splash">
        <div className="splash__logo">G</div>
        <div className="splash__dot" />
      </div>
    );
  }

  // 1. Nije prijavljen → Landing (auth)
  if (!user) return <Landing />;

  // 2. Prijavljen ali nema kluba → Onboarding
  if (!club) return <OnboardingFlow />;

  // 3. Prijavljen + klub → Dashboard
  const tabs = visibleTabs(devMode);
  const bottomTabs = BOTTOM_IDS.map((id) => tabs.find((t) => t.id === id)).filter(Boolean);
  const currentTab = tabs.find((t) => t.id === tab) || tabs[0];

  // Ako je aktivni tab bio sakriven, prebaci na prvi vidljivi
  const activeTab = tabs.find((t) => t.id === tab) ? tab : tabs[0]?.id;

  return (
    <div className="app">
      {/* Sidebar — Desktop */}
      <aside className="sidebar">
        <div className="sidebar__logo">G</div>
        <nav className="sidebar__nav">
          {tabs.map((t) => {
            const showDivider = t.id === 'admin';
            return (
              <span key={t.id} style={{ display: 'contents' }}>
                {showDivider && <div className="sidebar__divider" />}
                <button
                  className={`sidebar__item${activeTab === t.id ? ' is-active' : ''}`}
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
        <div className="topbar__title">
          {currentTab?.icon} {currentTab?.label}
        </div>
        <div className="topbar__balances">
          <div className="topbar__bal topbar__bal--green">
            <span className="topbar__icon">⚽</span>
            <span>{(lopte ?? 0).toLocaleString()}</span>
          </div>
          <div className="topbar__bal topbar__bal--gold">
            <span className="topbar__icon">🪙</span>
            <span>{(kovanice ?? 0).toLocaleString()}</span>
          </div>
          <button className="topbar__reset" onClick={resetGame} title="Reset napretka">↺</button>
        </div>
      </header>

      {/* Main content */}
      <main className="content">
        {activeTab === 'club'      && <ClubPanel />}
        {activeTab === 'cards'     && (
          <section className="app__grid">
            {SAMPLE_CARDS.map((card) => <CardView key={card.name} card={card} />)}
          </section>
        )}
        {activeTab === 'packs'     && <PackOpening />}
        {activeTab === 'market'    && <MarketPanel />}
        {activeTab === 'train'     && <TrainingPanel />}
        {activeTab === 'medical'   && <MedicalPanel />}
        {activeTab === 'academy'   && <AcademyPanel />}
        {activeTab === 'scout'     && <ScoutPanel />}
        {activeTab === 'sponsors'  && <SponsorsPanel />}
        {activeTab === 'match'     && <MatchSim />}
        {activeTab === 'livematch' && <MatchCanvas />}
        {activeTab === 'league'    && <LeagueTable />}
        {activeTab === 'proleague' && <ProLeaguePanel />}
        {activeTab === 'worldcup'  && <WorldCupPanel />}
        {activeTab === 'editions'  && <EditionsPanel />}
        {activeTab === 'progress'  && <ProgressPanel />}
        {activeTab === 'social'    && <SocialPanel />}
        {activeTab === 'referral'  && <ReferralPanel />}
        {activeTab === 'affiliate' && <AffiliatePanel />}
        {activeTab === 'shop'      && <ShopPanel />}
        {activeTab === 'premium'   && <PremiumPanel />}
        {activeTab === 'account'   && <AccountPanel />}
        {activeTab === 'admin'     && <AdminPanel />}
      </main>

      {/* Bottom nav — Mobile */}
      <nav className="bottomnav">
        {bottomTabs.map((t) => (
          <button
            key={t.id}
            className={`bottomnav__item${activeTab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="bottomnav__icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
