import { useState } from 'react';
import { useGameStore } from './store/useGameStore.js';
import AdminPanel from './components/AdminPanel.jsx';
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
import { SAMPLE_CARDS } from './game/sampleCards.js';

const TABS = [
  { id: 'club', label: 'Klub' },
  { id: 'cards', label: 'Karte' },
  { id: 'packs', label: 'Kesice' },
  { id: 'market', label: 'Tržište' },
  { id: 'academy', label: 'Akademija' },
  { id: 'scout', label: 'Scout' },
  { id: 'train', label: 'Trening' },
  { id: 'medical', label: 'Medicinski' },
  { id: 'sponsors', label: 'Sponzori' },
  { id: 'match', label: 'Meč' },
  { id: 'league', label: 'Liga' },
  { id: 'proleague', label: 'Profi liga' },
  { id: 'worldcup', label: 'World Cup' },
  { id: 'editions', label: 'Edicije' },
  { id: 'progress', label: 'Sezona' },
  { id: 'social', label: 'Društvo' },
  { id: 'referral', label: 'Referral' },
  { id: 'affiliate', label: 'Affiliate' },
  { id: 'premium', label: 'Premium' },
  { id: 'admin', label: 'Admin' },
];

export default function App() {
  const [tab, setTab] = useState('club');
  const resetGame = useGameStore((s) => s.resetGame);

  return (
    <main className="app">
      <header className="app__header">
        <h1>Goaleadors</h1>
        <p>Football manager — card game · napredak se čuva lokalno</p>
        <button className="app__reset" onClick={resetGame} title="Obriši sačuvani napredak">Reset</button>
      </header>

      <nav className="app__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`app__tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'club' && <ClubPanel />}

      {tab === 'cards' && (
        <section className="app__grid">
          {SAMPLE_CARDS.map((card) => (
            <CardView key={card.name} card={card} />
          ))}
        </section>
      )}

      {tab === 'packs' && <PackOpening />}
      {tab === 'market' && <MarketPanel />}
      {tab === 'academy' && <AcademyPanel />}
      {tab === 'scout' && <ScoutPanel />}
      {tab === 'train' && <TrainingPanel />}
      {tab === 'medical' && <MedicalPanel />}
      {tab === 'sponsors' && <SponsorsPanel />}
      {tab === 'match' && <MatchSim />}
      {tab === 'league' && <LeagueTable />}
      {tab === 'proleague' && <ProLeaguePanel />}
      {tab === 'worldcup' && <WorldCupPanel />}
      {tab === 'editions' && <EditionsPanel />}
      {tab === 'progress' && <ProgressPanel />}
      {tab === 'social' && <SocialPanel />}
      {tab === 'referral' && <ReferralPanel />}
      {tab === 'affiliate' && <AffiliatePanel />}
      {tab === 'premium' && <PremiumPanel />}
      {tab === 'admin' && <AdminPanel />}
    </main>
  );
}
