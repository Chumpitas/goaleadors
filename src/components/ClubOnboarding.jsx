import { useState } from 'react';
import { motion } from 'framer-motion';
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

// Onboarding tok (§9.1): Država -> Grad -> Ime -> Grb -> Dres -> Stadion
const STEPS = ['Država', 'Grad', 'Ime kluba', 'Grb', 'Dres', 'Stadion'];

export default function ClubOnboarding({ initial, onDone }) {
  const setClub = useGameStore((s) => s.setClub);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(
    initial || {
      country: '',
      city: '',
      name: '',
      crest: defaultCrest(),
      kit: defaultKit(),
      stadiumName: '',
    }
  );

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setCrest = (patch) => setDraft((d) => ({ ...d, crest: { ...d.crest, ...patch } }));
  const setKit = (patch) => setDraft((d) => ({ ...d, kit: { ...d.kit, ...patch } }));

  const canNext = [
    !!draft.country,
    !!draft.city,
    draft.name.trim().length >= 2,
    true,
    true,
    draft.stadiumName.trim().length >= 2,
  ][step];

  const finish = () => {
    setClub({ ...draft, stadiumCap: 2000 }); // starter stadion (§7)
    onDone?.();
  };

  return (
    <div className="onb">
      <ol className="onb__steps">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'is-active' : i < step ? 'is-done' : ''}>{s}</li>
        ))}
      </ol>

      <motion.div key={step} className="onb__body" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
        {step === 0 && (
          <Choices
            label="Odaberi državu (§8.5)"
            options={Object.keys(COUNTRIES)}
            value={draft.country}
            onChange={(country) => set({ country, city: '' })}
          />
        )}

        {step === 1 && (
          <Choices
            label={`Gradovi — ${draft.country}`}
            options={COUNTRIES[draft.country] || []}
            value={draft.city}
            onChange={(city) => set({ city })}
          />
        )}

        {step === 2 && (
          <label className="onb__field">
            Ime kluba
            <input value={draft.name} maxLength={28} onChange={(e) => set({ name: e.target.value })} placeholder="npr. FC Madrid" />
          </label>
        )}

        {step === 3 && (
          <div className="onb__builder">
            <div className="onb__preview"><CrestSVG crest={draft.crest} name={draft.name} size={180} /></div>
            <div className="onb__controls">
              <Picker label="Oblik štita" options={SHIELD_SHAPES} value={draft.crest.shape} onChange={(shape) => setCrest({ shape })} />
              <Picker label="Pozadina" options={CREST_BACKGROUNDS} value={draft.crest.background} onChange={(background) => setCrest({ background })} />
              <ColorRow label="Boja 1" value={draft.crest.color1} onChange={(color1) => setCrest({ color1 })} />
              {draft.crest.background !== 'solid' && (
                <ColorRow label="Boja 2" value={draft.crest.color2} onChange={(color2) => setCrest({ color2 })} />
              )}
              <SymbolGrid value={draft.crest.symbol} onChange={(symbol) => setCrest({ symbol })} />
              <ColorRow label="Boja simbola" value={draft.crest.symbolColor} onChange={(symbolColor) => setCrest({ symbolColor })} />
              <Picker label="Font natpisa" options={FONTS} value={draft.crest.font} onChange={(font) => setCrest({ font })} />
              <label className="onb__field">
                Natpis (prazno = inicijali)
                <input value={draft.crest.text} maxLength={20} onChange={(e) => setCrest({ text: e.target.value })} placeholder={draft.name} />
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="onb__builder">
            <div className="onb__preview"><JerseySVG kit={draft.kit} size={180} /></div>
            <div className="onb__controls">
              <Picker label="Dizajn" options={JERSEY_DESIGNS} value={draft.kit.design} onChange={(design) => setKit({ design })} />
              <ColorRow label="Primarna" value={draft.kit.primary} onChange={(primary) => setKit({ primary })} />
              <ColorRow label="Sekundarna" value={draft.kit.secondary} onChange={(secondary) => setKit({ secondary })} />
              <Picker label="Font" options={FONTS} value={draft.kit.font} onChange={(font) => setKit({ font })} />
              <p className="onb__hint">Sponzor se dodjeljuje automatski preko ugovora (§9.3).</p>
            </div>
          </div>
        )}

        {step === 5 && (
          <label className="onb__field">
            Ime stadiona
            <input value={draft.stadiumName} maxLength={28} onChange={(e) => set({ stadiumName: e.target.value })} placeholder="npr. Stadion Maracana" />
            <span className="onb__hint">Starter stadion — kapacitet 2.000 (§7).</span>
          </label>
        )}
      </motion.div>

      <div className="onb__nav">
        {step > 0 && <button className="onb__back" onClick={() => setStep(step - 1)}>Nazad</button>}
        {step < STEPS.length - 1 ? (
          <button className="onb__next" disabled={!canNext} onClick={() => setStep(step + 1)}>Dalje</button>
        ) : (
          <button className="onb__next" disabled={!canNext} onClick={finish}>Osnuj klub</button>
        )}
      </div>
    </div>
  );
}

function Choices({ label, options, value, onChange }) {
  return (
    <div className="onb__field">
      <span>{label}</span>
      <div className="onb__choices">
        {options.map((o) => (
          <button key={o} className={`chip ${value === o ? 'is-active' : ''}`} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function Picker({ label, options, value, onChange }) {
  return (
    <label className="onb__field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </label>
  );
}

function ColorRow({ label, value, onChange }) {
  return (
    <label className="onb__color">
      <span>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SymbolGrid({ value, onChange }) {
  return (
    <div className="onb__field">
      <span>Simbol</span>
      <div className="onb__symbols">
        {SYMBOLS.map((s, i) => (
          <button key={i} className={`sym ${value === s ? 'is-active' : ''}`} onClick={() => onChange(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
}
