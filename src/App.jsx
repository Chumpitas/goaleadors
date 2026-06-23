import { useState } from 'react';
import CardView from './components/CardView.jsx';
import PackOpening from './components/PackOpening.jsx';
import MatchSim from './components/MatchSim.jsx';
import LeagueTable from './components/LeagueTable.jsx';
import ClubPanel from './components/ClubPanel.jsx';
import TrainingPanel from './components/TrainingPanel.jsx';
import AcademyPanel from './components/AcademyPanel.jsx';
import ScoutPanel from './components/ScoutPanel.jsx';
import EditionsPanel from './components/EditionsPanel.jsx';
import { SAMPLE_CARDS } from './game/sampleCards.js';

const TABS = [
  { id: 'club', label: 'Klub' },
  { id: 'cards', label: 'Karte' },
  { id: 'packs', label: 'Kesice' },
  { id: 'academy', label: 'Akademija' },
  { id: 'scout', label: 'Scout' },
  { id: 'train', label: 'Trening' },
  { id: 'match', label: 'Meč' },
  { id: 'league', label: 'Liga' },
  { id: 'editions', label: 'Edicije' },
];

export default function App() {
  const [tab, setTab] = useState('club');

  return (
    <main className="app">
      <header className="app__header">
        <h1>Goaleadors</h1>
        <p>Phase 1 — card, pack & match systems</p>
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
      {tab === 'academy' && <AcademyPanel />}
      {tab === 'scout' && <ScoutPanel />}
      {tab === 'train' && <TrainingPanel />}
      {tab === 'match' && <MatchSim />}
      {tab === 'league' && <LeagueTable />}
      {tab === 'editions' && <EditionsPanel />}
    </main>
  );
}
