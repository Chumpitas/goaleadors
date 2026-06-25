import { useState, useEffect, useRef } from "react";
import { CARD_IMAGES } from "../game/cardImages.js";

const RARITY_CONFIG = {
  common:    { label: "COMMON",    bg: "linear-gradient(160deg,#1F2937,#374151)", border: "#6B7280", glow: "rgba(107,114,128,0.4)", particle: "#9CA3AF", text: "#9CA3AF" },
  rare:      { label: "RARE",      bg: "linear-gradient(160deg,#1A1500,#2D2200)", border: "#C9A84C", glow: "rgba(201,168,76,0.5)",  particle: "#C9A84C", text: "#C9A84C" },
  epic:      { label: "EPIC",      bg: "linear-gradient(160deg,#1A0A2E,#2D1054)", border: "#7C3AED", glow: "rgba(124,58,237,0.6)", particle: "#A78BFA", text: "#A78BFA" },
  legendary: { label: "LEGENDARY", bg: "linear-gradient(160deg,#1A0000,#3D0000)", border: "#C9A84C", glow: "rgba(220,38,38,0.7)",  particle: "#FCD34D", text: "#FCD34D" },
};

const ATTR_LABELS = { shooting: "SHO", passing: "PAS", tackling: "TAC", pace: "PAC", reflexes: "REF", positioning: "POS" };

// ─── Sound synthesis (Web Audio API) ─────────────────────────────────────────
function createAudioCtx() {
  try { return new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
}

function playTone(ctx, freq, type, dur, vol = 0.3, delay = 0) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + dur);
}

function soundPackShake(ctx) {
  if (!ctx) return;
  [0, 0.08, 0.16, 0.24].forEach((d) => playTone(ctx, 120, "sawtooth", 0.06, 0.2, d));
}

function soundPackBurst(ctx) {
  if (!ctx) return;
  // Burst = white noise via buffer
  try {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch {}
  // Rising tone
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.3);
  g.gain.setValueAtTime(0.3, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  osc.start(); osc.stop(ctx.currentTime + 0.4);
}

function soundCardFlip(ctx, rarity) {
  if (!ctx) return;
  const freqs = { common: [600, 800], rare: [700, 1000], epic: [500, 1200], legendary: [400, 1600] };
  const [f1, f2] = freqs[rarity] || freqs.common;
  playTone(ctx, f1, "sine", 0.05, 0.15);
  playTone(ctx, f2, "sine", 0.12, 0.2, 0.04);
}

function soundLegendary(ctx) {
  if (!ctx) return;
  // Dramatic chord
  [261, 329, 392, 523].forEach((f, i) => playTone(ctx, f, "sine", 1.5, 0.15, i * 0.08));
  [261, 329, 392, 523].forEach((f, i) => playTone(ctx, f * 2, "triangle", 0.8, 0.08, 0.5 + i * 0.05));
}

// ─── Particle burst ───────────────────────────────────────────────────────────
function Particle({ x, y, color, angle, speed, size }) {
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      width: size, height: size, borderRadius: "50%", background: color,
      animation: "particle-fly 0.8s ease-out forwards",
      "--angle": `${angle}deg`, "--speed": `${speed}px`, pointerEvents: "none",
    }} />
  );
}

function ParticleBurst({ active, x, y, color, count = 20 }) {
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    if (!active) return;
    const p = Array.from({ length: count }, (_, i) => ({
      id: i, x, y, angle: (360 / count) * i + Math.random() * 20,
      speed: 60 + Math.random() * 80, size: 4 + Math.random() * 6, color,
    }));
    setParticles(p);
    const t = setTimeout(() => setParticles([]), 900);
    return () => clearTimeout(t);
  }, [active]);
  return <>{particles.map((p) => <Particle key={p.id} {...p} />)}</>;
}

// ─── Card back ────────────────────────────────────────────────────────────────
function CardBack({ onClick, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 80); return () => clearTimeout(t); }, []);
  return (
    <div onClick={onClick} style={{
      width: 100, height: 148, borderRadius: 10, cursor: "pointer",
      background: "linear-gradient(160deg,#0F172A,#1E293B)",
      border: "2px solid #C9A84C", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 5,
      transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.9)",
      opacity: visible ? 1 : 0,
      transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      boxShadow: "0 0 12px rgba(201,168,76,0.2)", flexShrink: 0, overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(201,168,76,0.03) 10px,rgba(201,168,76,0.03) 20px)" }} />
      <div style={{ fontSize: 24, filter: "drop-shadow(0 0 8px #C9A84C)" }}>⚽</div>
      <div style={{ color: "#C9A84C", fontSize: 9, letterSpacing: 2, fontWeight: 700 }}>GOALEADORS</div>
      <div style={{ fontSize: 8, color: "#4B5563", letterSpacing: 1 }}>TAP TO REVEAL</div>
    </div>
  );
}

// ─── Card front ───────────────────────────────────────────────────────────────
function CardFront({ card, animIn }) {
  const cfg = RARITY_CONFIG[card.rarity] || RARITY_CONFIG.common;
  const attrKeys = card.position === "GK"
    ? ["reflexes", "positioning", "passing", "pace"]
    : ["shooting", "passing", "tackling", "pace"];
  const initials = card.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{
      width: 100, height: 148, borderRadius: 10, background: cfg.bg,
      border: `2px solid ${cfg.border}`,
      display: "flex", flexDirection: "column", padding: "5px 6px", gap: 2,
      boxShadow: `0 0 18px ${cfg.glow}, 0 0 36px ${cfg.glow}`,
      transform: animIn ? "scale(1) rotateY(0deg)" : "scale(0.8) rotateY(90deg)",
      opacity: animIn ? 1 : 0, transition: "all 0.45s cubic-bezier(0.34,1.56,0.64,1)",
      flexShrink: 0, position: "relative", overflow: "hidden",
    }}>
      {card.rarity === "legendary" && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(60deg,transparent,transparent 15px,rgba(201,168,76,0.04) 15px,rgba(201,168,76,0.04) 16px)", animation: "shimmer 2s linear infinite" }} />
      )}
      {/* Top */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 8, color: cfg.text, fontWeight: 700, letterSpacing: 1 }}>{cfg.label}</span>
        <span style={{ fontSize: 8, color: "#9CA3AF", fontWeight: 700 }}>{card.position}</span>
      </div>
      {/* Avatar */}
      {CARD_IMAGES[card.name]
        ? <div style={{ height: 52, borderRadius: 6, margin: "1px 0", overflow: "hidden", flexShrink: 0 }}>
            <img src={CARD_IMAGES[card.name]} alt={card.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} />
          </div>
        : <div style={{
            height: 42, borderRadius: 6, margin: "1px 0",
            background: `linear-gradient(180deg, ${cfg.border}22, ${cfg.border}44)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${cfg.border}33`, fontSize: 18, fontWeight: 800, color: "#fff",
          }}>{initials}</div>
      }
      {/* Name + OVR */}
      <div style={{ fontSize: 10, color: "#F0EAD6", fontWeight: 700, letterSpacing: 0.3, lineHeight: 1.1, textAlign: "center" }}>{card.name}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: "center" }}>
        <span style={{ fontSize: 7, color: "#6B7280", fontWeight: 600 }}>OVR</span>
        <span style={{ fontSize: 14, color: cfg.text, fontWeight: 900, lineHeight: 1 }}>{card.overall}</span>
      </div>
      {/* Attrs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 4px" }}>
        {attrKeys.map((k) => (
          <div key={k} style={{ display: "flex", gap: 2, alignItems: "baseline" }}>
            <span style={{ fontSize: 6, color: "#6B7280", fontWeight: 600 }}>{ATTR_LABELS[k]}</span>
            <span style={{ fontSize: 9, color: "#D1D5DB", fontWeight: 700 }}>{card.attributes?.[k] ?? "—"}</span>
          </div>
        ))}
      </div>
      {/* Abilities */}
      {card.abilities?.length > 0 && (
        <div style={{ borderTop: `1px solid ${cfg.border}44`, paddingTop: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          {card.abilities.slice(0, 2).map((a) => (
            <div key={a.id || a} style={{ display: "flex", gap: 2, alignItems: "center" }}>
              <span style={{ fontSize: 7 }}>⚡</span>
              <span style={{ fontSize: 6, color: cfg.text, fontWeight: 600 }}>{a.name || a}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pack visual ──────────────────────────────────────────────────────────────
function StarterPackVisual({ shaking }) {
  return (
    <div style={{
      width: 180, height: 250, borderRadius: 18, cursor: "pointer",
      background: "linear-gradient(160deg,#0a2a0a,#1a5a1a,#2d8a2d)",
      border: "3px solid #22c55e",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12,
      boxShadow: "0 0 50px rgba(34,197,94,0.6), 0 0 100px rgba(34,197,94,0.3)",
      animation: shaking ? "pack-shake 0.4s ease-in-out" : "pack-float 3s ease-in-out infinite",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(45deg,transparent,transparent 8px,rgba(34,197,94,0.05) 8px,rgba(34,197,94,0.05) 9px)" }} />
      <div style={{ fontSize: 56, filter: "drop-shadow(0 0 16px #22c55e)" }}>⚽</div>
      <div style={{ color: "white", fontSize: 13, letterSpacing: 3, fontWeight: 800, textShadow: "0 0 12px rgba(255,255,255,0.5)" }}>STARTER PACK</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", letterSpacing: 2, fontWeight: 600 }}>23 KARTE</div>
      <div style={{ fontSize: 10, color: "rgba(34,197,94,0.8)", letterSpacing: 2, animation: "pulse-text 1.5s ease-in-out infinite" }}>TAP TO OPEN</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StarterPackOpening({ cards, onDone }) {
  const [phase, setPhase] = useState("intro"); // intro | shaking | burst | reveal | done
  const [flipped, setFlipped] = useState([]);
  const [burstActive, setBurstActive] = useState(false);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(null);
  const [legendaryReveal, setLegendaryReveal] = useState(null); // card object
  const [legendaryVisible, setLegendaryVisible] = useState(false);
  const audioCtx = useRef(null);

  function getAudio() {
    if (!audioCtx.current) audioCtx.current = createAudioCtx();
    // Resume on user gesture
    if (audioCtx.current?.state === "suspended") audioCtx.current.resume();
    return audioCtx.current;
  }

  function handleOpen() {
    if (phase !== "intro") return;
    const ctx = getAudio();
    soundPackShake(ctx);
    setPhase("shaking");
    setTimeout(() => {
      soundPackBurst(ctx);
      setBurstActive(true);
      setPhase("burst");
      setTimeout(() => { setBurstActive(false); setPhase("reveal"); }, 600);
    }, 500);
  }

  function handleCardFlip(index) {
    if (flipped.includes(index)) return;
    const card = cards[index];
    const ctx = getAudio();

    if (card.rarity === "legendary") {
      soundLegendary(ctx);
      setLegendaryReveal(card);
      setTimeout(() => setLegendaryVisible(true), 300);
      setTimeout(() => {
        setLegendaryReveal(null);
        setLegendaryVisible(false);
        setFlipped((p) => [...p, index]);
        setCurrentRevealIndex(index);
        setTimeout(() => setCurrentRevealIndex(null), 800);
      }, 2800);
    } else {
      soundCardFlip(ctx, card.rarity);
      setFlipped((p) => [...p, index]);
      setCurrentRevealIndex(index);
      setTimeout(() => setCurrentRevealIndex(null), 700);
    }

    if (flipped.length + 1 >= cards.length) {
      setTimeout(() => setPhase("done"), 700);
    }
  }

  function handleRevealAll() {
    const ctx = getAudio();
    const remaining = cards.map((_, i) => i).filter((i) => !flipped.includes(i));
    remaining.forEach((i, n) => {
      setTimeout(() => {
        soundCardFlip(ctx, cards[i].rarity);
        setFlipped((p) => [...p, i]);
      }, n * 80);
    });
    setTimeout(() => setPhase("done"), remaining.length * 80 + 300);
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#060a0f",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "Inter, sans-serif", padding: "20px 12px",
      position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @keyframes pack-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pack-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px) rotate(-3deg)} 40%{transform:translateX(8px) rotate(3deg)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
        @keyframes pulse-text { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes shimmer { 0%{background-position:0 0} 100%{background-position:60px 60px} }
        @keyframes legendary-pulse { 0%,100%{box-shadow:0 0 20px rgba(220,38,38,0.7),0 0 40px rgba(201,168,76,0.4)} 50%{box-shadow:0 0 50px rgba(220,38,38,1),0 0 100px rgba(201,168,76,0.8)} }
        @keyframes particle-fly {
          0%{transform:translate(0,0) scale(1);opacity:1}
          100%{transform:translate(calc(cos(var(--angle)*3.14/180)*var(--speed)*1px),calc(sin(var(--angle)*3.14/180)*var(--speed)*1px)) scale(0);opacity:0}
        }
        @keyframes label-drop { 0%{transform:translateY(-30px);opacity:0} 100%{transform:translateY(0);opacity:1} }
        @keyframes bg-flash { 0%{opacity:0} 30%{opacity:1} 100%{opacity:0} }
        @keyframes star-drift { 0%{transform:translateY(0)} 100%{transform:translateY(-100vh)} }
      `}</style>

      {/* Starfield */}
      {[...Array(25)].map((_, i) => (
        <div key={i} style={{
          position: "fixed", left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`,
          width: 1 + (i % 2), height: 1 + (i % 2), borderRadius: "50%",
          background: "white", opacity: 0.15 + (i % 3) * 0.1,
          animation: `star-drift ${8 + (i % 7) * 2}s linear infinite`,
          animationDelay: `${-(i * 0.5) % 10}s`, pointerEvents: "none",
        }} />
      ))}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 32, fontWeight: 900, color: "#22c55e", letterSpacing: 5, lineHeight: 1, textShadow: "0 0 20px rgba(34,197,94,0.5)" }}>
          GOALEADORS
        </div>
        <div style={{ fontSize: 11, color: "#4B5563", letterSpacing: 4, marginTop: 4, fontWeight: 600 }}>
          DOBRODOŠAO U SVOJU EKIPU
        </div>
      </div>

      {/* INTRO */}
      {phase === "intro" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <p style={{ color: "#6B7280", fontSize: 13, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
            Svaki menadžer počinje s osnovnim kadrom. Tvoje startne karte čekaju — otvori paket i upoznaj tim!
          </p>
          <StarterPackVisual shaking={false} onClick={handleOpen} />
          <button onClick={handleOpen} style={{
            marginTop: 8, padding: "13px 36px", fontWeight: 800, fontSize: 15, letterSpacing: 3,
            background: "linear-gradient(135deg,#166534,#22c55e)", color: "white",
            border: "none", borderRadius: 10, cursor: "pointer",
            boxShadow: "0 0 24px rgba(34,197,94,0.4)", transition: "transform 0.2s",
          }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            OTVORI STARTER PACK
          </button>
        </div>
      )}

      {/* SHAKING */}
      {phase === "shaking" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
          <StarterPackVisual shaking={true} />
        </div>
      )}

      {/* BURST */}
      {phase === "burst" && (
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 200, height: 200 }}>
          <div style={{
            width: 50, height: 50, borderRadius: "50%", background: "#22c55e",
            boxShadow: "0 0 80px #22c55e", animation: "bg-flash 0.6s ease-out forwards",
          }} />
          <ParticleBurst active={burstActive} x="50%" y="50%" color="#22c55e" count={28} />
        </div>
      )}

      {/* REVEAL */}
      {(phase === "reveal" || phase === "done") && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: 700, padding: "0 8px" }}>
            <span style={{ fontSize: 12, color: "#6B7280", letterSpacing: 2, fontWeight: 600 }}>
              {flipped.length < cards.length ? `${flipped.length}/${cards.length} OTKRIVENO` : "SVE KARTE OTKRIVENE ✅"}
            </span>
            {flipped.length < cards.length && phase === "reveal" && (
              <button onClick={handleRevealAll} style={{
                padding: "5px 14px", fontSize: 11, fontWeight: 700, letterSpacing: 1,
                background: "transparent", color: "#6B7280", border: "1px solid #374151",
                borderRadius: 6, cursor: "pointer",
              }}>OTKRIJ SVE</button>
            )}
          </div>

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center", maxWidth: 760, padding: "0 4px" }}>
            {cards.map((card, index) => (
              <div key={index} style={{ position: "relative" }}>
                {currentRevealIndex === index && (
                  <div style={{
                    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10,
                    background: RARITY_CONFIG[card.rarity]?.glow || "transparent",
                    animation: "bg-flash 0.5s ease-out forwards",
                  }} />
                )}
                {flipped.includes(index)
                  ? <CardFront card={card} animIn={true} />
                  : <CardBack onClick={() => handleCardFlip(index)} index={index} />
                }
              </div>
            ))}
          </div>

          {phase === "done" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 8 }}>
              <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 600, letterSpacing: 1 }}>
                ✅ {cards.length} karata dodano u tvoju kolekciju!
              </div>
              <button onClick={onDone} style={{
                padding: "13px 40px", fontWeight: 800, fontSize: 15, letterSpacing: 3,
                background: "linear-gradient(135deg,#166534,#22c55e)", color: "white",
                border: "none", borderRadius: 10, cursor: "pointer",
                boxShadow: "0 0 24px rgba(34,197,94,0.4)", transition: "transform 0.2s",
              }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                IDI NA DASHBOARD →
              </button>
            </div>
          )}
        </div>
      )}

      {/* LEGENDARY OVERLAY */}
      {legendaryReveal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: legendaryVisible ? "rgba(0,0,0,0.95)" : "rgba(139,0,0,0.8)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 20,
          transition: "background 0.3s",
        }}>
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 300, height: 400, background: "radial-gradient(ellipse at top,rgba(201,168,76,0.2),transparent 70%)", pointerEvents: "none" }} />
          {legendaryVisible && (
            <>
              <div style={{ fontSize: 26, letterSpacing: 8, color: "#FCD34D", fontWeight: 900, textShadow: "0 0 20px rgba(252,211,77,0.8)", animation: "label-drop 0.5s ease-out forwards" }}>
                ⭐ LEGENDARY ⭐
              </div>
              <div style={{ animation: "legendary-pulse 1s ease-in-out infinite", borderRadius: 12 }}>
                <CardFront card={legendaryReveal} animIn={true} />
              </div>
              <div style={{ fontSize: 10, color: "rgba(252,211,77,0.6)", letterSpacing: 3, animation: "pulse-text 1s ease-in-out infinite" }}>
                TAP ANYWHERE TO CONTINUE
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
