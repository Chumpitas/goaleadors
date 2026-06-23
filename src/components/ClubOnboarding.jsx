import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';
import CrestSVG from './CrestSVG.jsx';
import JerseySVG from './JerseySVG.jsx';
import {
  COUNTRIES,
  SHIELD_SHAPES,
  CREST_BACKGROUNDS,
  SYMBOLS,
  FONTS,
  JERSEY_DESIGNS,
  defaultCrest,
  defaultKit,
} from '../game/cosmetics.js';

const STEPS = [
  { id: 'country',  label: 'Država',     icon: '🌍', hint: 'U kojoj ligi ćeš takmičiti?' },
  { id: 'city',     label: 'Grad',       icon: '🏙️', hint: 'Odakle dolazi tvoj klub?' },
  { id: 'name',     label: 'Ime kluba',  icon: '✏️', hint: 'Kako će se zvati tvoj klub?' },
  { id: 'crest',    label: 'Grb',        icon: '🛡️', hint: 'Dizajniraj grb kluba' },
  { id: 'kit',      label: 'Dres',       icon: '👕', hint: 'Odaberi boje i dizajn dresa' },
  { id: 'stadium',  label: 'Stadion',    icon: '🏟️', hint: 'Kako se zove tvoj stadion?' },
];

const variants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function ClubOnboarding({ initial, onDone }) {
  const setClub = useGameStore((s) => s.setClub);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(
    initial || { country: '', city: '', name: '', crest: defaultCrest(), kit: defaultKit(), stadiumName: '' }
  );

  const patch = (p) => setDraft((d) => ({ ...d, ...p }));
  const patchCrest = (p) => setDraft((d) => ({ ...d, crest: { ...d.crest, ...p } }));
  const patchKit = (p) => setDraft((d) => ({ ...d, kit: { ...d.kit, ...p } }));

  const canNext = [
    !!draft.country,
    !!draft.city,
    draft.name.trim().length >= 2,
    true,
    true,
    draft.stadiumName.trim().length >= 2,
  ][step];

  const finish = () => {
    setClub({ ...draft, stadiumCap: 2000 });
    onDone?.();
  };

  const currentStep = STEPS[step];

  return (
    <div className="club-ob">
      {/* Progress bar */}
      <div className="club-ob__progress">
        <div className="club-ob__progress-fill" style={{ width: `${((step) / (STEPS.length - 1)) * 100}%` }} />
      </div>

      {/* Step indicators */}
      <div className="club-ob__steps">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`club-ob__step ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}
            onClick={() => i < step && setStep(i)}
          >
            <div className="club-ob__step-dot">
              {i < step ? '✓' : s.icon}
            </div>
            <span className="club-ob__step-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="club-ob__main">
        <div className="club-ob__header">
          <h2 className="club-ob__title">{currentStep.icon} {currentStep.label}</h2>
          <p className="club-ob__hint">{currentStep.hint}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="club-ob__body"
          >
            {step === 0 && (
              <div className="club-ob__card-grid">
                {Object.keys(COUNTRIES).map((c) => (
                  <button
                    key={c}
                    className={`club-ob__option-card ${draft.country === c ? 'is-active' : ''}`}
                    onClick={() => patch({ country: c, city: '' })}
                  >
                    <span className="club-ob__option-icon">{countryFlag(c)}</span>
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 1 && (
              <div className="club-ob__card-grid">
                {(COUNTRIES[draft.country] || []).map((city) => (
                  <button
                    key={city}
                    className={`club-ob__option-card ${draft.city === city ? 'is-active' : ''}`}
                    onClick={() => patch({ city })}
                  >
                    <span className="club-ob__option-icon">📍</span>
                    <span>{city}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="club-ob__text-step">
                <input
                  className="club-ob__input"
                  value={draft.name}
                  maxLength={28}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="npr. FC Sarajevo"
                  autoFocus
                />
                <p className="club-ob__input-hint">2–28 znakova</p>
              </div>
            )}

            {step === 3 && (
              <div className="club-ob__builder">
                {/* Preview */}
                <div className="club-ob__preview">
                  <CrestSVG crest={draft.crest} name={draft.name} size={160} />
                  <p className="club-ob__preview-label">{draft.name || 'Tvoj klub'}</p>
                </div>
                {/* Controls */}
                <div className="club-ob__controls">
                  <OptionRow label="Oblik štita">
                    {SHIELD_SHAPES.map((s) => (
                      <button key={s.id} className={`club-ob__pill ${draft.crest.shape === s.id ? 'is-active' : ''}`} onClick={() => patchCrest({ shape: s.id })}>{s.name}</button>
                    ))}
                  </OptionRow>
                  <OptionRow label="Pozadina">
                    {CREST_BACKGROUNDS.map((b) => (
                      <button key={b.id} className={`club-ob__pill ${draft.crest.background === b.id ? 'is-active' : ''}`} onClick={() => patchCrest({ background: b.id })}>{b.name}</button>
                    ))}
                  </OptionRow>
                  <div className="club-ob__colors">
                    <ColorSwatch label="Boja 1" value={draft.crest.color1} onChange={(v) => patchCrest({ color1: v })} />
                    {draft.crest.background !== 'solid' && (
                      <ColorSwatch label="Boja 2" value={draft.crest.color2} onChange={(v) => patchCrest({ color2: v })} />
                    )}
                    <ColorSwatch label="Simbol" value={draft.crest.symbolColor} onChange={(v) => patchCrest({ symbolColor: v })} />
                  </div>
                  <OptionRow label="Simbol">
                    <div className="club-ob__emoji-grid">
                      {SYMBOLS.map((s, i) => (
                        <button key={i} className={`club-ob__emoji ${draft.crest.symbol === s ? 'is-active' : ''}`} onClick={() => patchCrest({ symbol: s })}>{s}</button>
                      ))}
                    </div>
                  </OptionRow>
                  <OptionRow label="Font">
                    {FONTS.map((f) => (
                      <button key={f.id} className={`club-ob__pill ${draft.crest.font === f.id ? 'is-active' : ''}`} style={{ fontFamily: f.family }} onClick={() => patchCrest({ font: f.id })}>{f.name}</button>
                    ))}
                  </OptionRow>
                  <div className="club-ob__field">
                    <label>Natpis (prazno = inicijali)</label>
                    <input className="club-ob__input club-ob__input--sm" value={draft.crest.text} maxLength={20} onChange={(e) => patchCrest({ text: e.target.value })} placeholder={draft.name || 'tekst…'} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="club-ob__builder">
                <div className="club-ob__preview">
                  <JerseySVG kit={draft.kit} size={160} />
                  <p className="club-ob__preview-label">Tvoj dres</p>
                </div>
                <div className="club-ob__controls">
                  <OptionRow label="Dizajn">
                    {JERSEY_DESIGNS.map((d) => (
                      <button key={d.id} className={`club-ob__pill ${draft.kit.design === d.id ? 'is-active' : ''}`} onClick={() => patchKit({ design: d.id })}>{d.name}</button>
                    ))}
                  </OptionRow>
                  <div className="club-ob__colors">
                    <ColorSwatch label="Primarna" value={draft.kit.primary} onChange={(v) => patchKit({ primary: v })} />
                    <ColorSwatch label="Sekundarna" value={draft.kit.secondary} onChange={(v) => patchKit({ secondary: v })} />
                  </div>
                  <OptionRow label="Font broja">
                    {FONTS.map((f) => (
                      <button key={f.id} className={`club-ob__pill ${draft.kit.font === f.id ? 'is-active' : ''}`} style={{ fontFamily: f.family }} onClick={() => patchKit({ font: f.id })}>{f.name}</button>
                    ))}
                  </OptionRow>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="club-ob__text-step">
                <input
                  className="club-ob__input"
                  value={draft.stadiumName}
                  maxLength={28}
                  onChange={(e) => patch({ stadiumName: e.target.value })}
                  placeholder="npr. Arena Sarajevo"
                  autoFocus
                />
                <p className="club-ob__input-hint">Starter kapacitet: 2.000 mjesta</p>

                {/* Summary card */}
                <div className="club-ob__summary">
                  <div className="club-ob__summary-crest">
                    <CrestSVG crest={draft.crest} name={draft.name} size={64} />
                  </div>
                  <div className="club-ob__summary-info">
                    <strong>{draft.name}</strong>
                    <span>{draft.city}, {draft.country}</span>
                  </div>
                  <div className="club-ob__summary-jersey">
                    <JerseySVG kit={draft.kit} size={48} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="club-ob__nav">
        <button
          className="club-ob__btn club-ob__btn--back"
          onClick={() => setStep(step - 1)}
          style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
        >
          ← Nazad
        </button>
        {step < STEPS.length - 1 ? (
          <button className="club-ob__btn club-ob__btn--next" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Dalje →
          </button>
        ) : (
          <button className="club-ob__btn club-ob__btn--finish" disabled={!canNext} onClick={finish}>
            ⚽ Osnuj klub
          </button>
        )}
      </div>
    </div>
  );
}

// Helpers
const FLAGS = { Španija: '🇪🇸', Engleska: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Italija: '🇮🇹', Njemačka: '🇩🇪', Francuska: '🇫🇷' };
function countryFlag(c) { return FLAGS[c] || '🌍'; }

function OptionRow({ label, children }) {
  return (
    <div className="club-ob__option-row">
      <span className="club-ob__option-label">{label}</span>
      <div className="club-ob__option-values">{children}</div>
    </div>
  );
}

function ColorSwatch({ label, value, onChange }) {
  return (
    <label className="club-ob__swatch">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span>{label}</span>
      <span className="club-ob__swatch-hex">{value}</span>
    </label>
  );
}
