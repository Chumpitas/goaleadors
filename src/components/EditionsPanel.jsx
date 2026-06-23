import { useGameStore } from '../store/useGameStore.js';
import CardView from './CardView.jsx';
import {
  editionStatus,
  daysUntilRetire,
  seasonForDay,
  EDITION_STATUS,
} from '../game/editions.js';
import { legacyBonuses, LEGACY_RULES } from '../game/legacy.js';

const STATUS_LABEL = {
  [EDITION_STATUS.UPCOMING]: 'najavljena',
  [EDITION_STATUS.ACTIVE]: 'aktivna',
  [EDITION_STATUS.RETIRING]: 'penzija uskoro',
  [EDITION_STATUS.LEGACY]: 'legacy',
};

export default function EditionsPanel() {
  const currentDay = useGameStore((s) => s.currentDay);
  const schedule = useGameStore((s) => s.editionSchedule);
  const legacy = useGameStore((s) => s.legacy);
  const advanceDay = useGameStore((s) => s.advanceDay);

  const bonuses = legacyBonuses(legacy);

  return (
    <div className="editions">
      <div className="editions__clock">
        <span>Dan <strong>{currentDay}</strong> · sezona <strong>{seasonForDay(currentDay)}</strong></span>
        <div className="editions__btns">
          <button onClick={() => advanceDay(1)}>+1 dan</button>
          <button onClick={() => advanceDay(30)}>+1 sezona</button>
        </div>
      </div>

      <div className="editions__list">
        {schedule.map((e) => {
          const status = editionStatus(e, currentDay);
          if (status === EDITION_STATUS.UPCOMING && e.releaseDay > currentDay + 60) return null;
          const dUntil = daysUntilRetire(e, currentDay);
          return (
            <div key={e.code} className={`edition edition--${status}`}>
              <div className="edition__main">
                <strong>{e.theme}</strong>
                <span className="edition__code">{e.code}</span>
              </div>
              <div className="edition__status">
                <span className="edition__badge">{STATUS_LABEL[status]}</span>
                {(status === EDITION_STATUS.ACTIVE || status === EDITION_STATUS.RETIRING) && (
                  <span className="edition__days">penzija za {dUntil} dana</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <section className="legacy">
        <h2>Legacy album (§13)</h2>
        <div className="legacy__bonuses">
          <Bonus label="Prihod" value={`+${bonuses.incomePct}%`} hint={`10 karata iste edicije = +${LEGACY_RULES.incomePctPerEdition}%`} />
          <Bonus label="Navijačka baza" value={`+${bonuses.fanBasePct}%`} hint={`${LEGACY_RULES.totalForFanBase} karata ukupno`} />
          <Bonus label="Kompletne Legendary" value={bonuses.completedLegendaryEditions.length} hint="po ediciji (5/5)" />
          <Bonus label="Titula karte" value={bonuses.titleCards} hint="iz osvojenih titula" />
        </div>

        {legacy.length === 0 ? (
          <p className="legacy__empty">Još nema penzionisanih karata. Napreduj do dana 91 da Foundations ode u Legacy.</p>
        ) : (
          <>
            <p className="legacy__count">{legacy.length} karata u muzeju kluba</p>
            <div className="app__grid">
              {legacy.map((card, i) => (
                <CardView key={i} card={card} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Bonus({ label, value, hint }) {
  return (
    <div className="legacy__bonus">
      <span className="legacy__bval">{value}</span>
      <span className="legacy__blabel">{label}</span>
      <span className="legacy__bhint">{hint}</span>
    </div>
  );
}
