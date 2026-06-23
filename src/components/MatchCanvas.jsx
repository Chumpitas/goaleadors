/**
 * Canvas match vizualizacija (§15.1) + interaktivni live meč s izmjenama (§3.8).
 *
 * Faze: setup → first_half (animacija) → halftime (izmjene) → second_half → final
 * Na poluvremenu igrač može zamijeniti karte; druga polovina se resimulira s novom postavom.
 */
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { buildLineup, simulateMatch } from '../game/matchEngine.js';
import { FORMATIONS, STYLES, MENTALITIES } from '../game/tactics.js';
import { outcomeFromScore } from '../game/elo.js';
import { talentToCard } from '../game/talents.js';

// --- Constante za teren ---
const W = 680;
const H = 440;
const PITCH_PAD = 28;
const PW = W - PITCH_PAD * 2;
const PH = H - PITCH_PAD * 2;

// Pozicije igrača na terenu (normalizirane 0–1, x = horizontalno, y = vertikalno)
const FORMATION_POSITIONS = {
  '4-3-3': [
    { pos: 'GK', x: 0.07 },
    { pos: 'DEF', x: 0.25 }, { pos: 'DEF', x: 0.25 }, { pos: 'DEF', x: 0.25 }, { pos: 'DEF', x: 0.25 },
    { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 },
    { pos: 'ATT', x: 0.75 }, { pos: 'ATT', x: 0.75 }, { pos: 'ATT', x: 0.75 },
  ],
  '4-4-2': [
    { pos: 'GK', x: 0.07 },
    { pos: 'DEF', x: 0.25 }, { pos: 'DEF', x: 0.25 }, { pos: 'DEF', x: 0.25 }, { pos: 'DEF', x: 0.25 },
    { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 },
    { pos: 'ATT', x: 0.78 }, { pos: 'ATT', x: 0.78 },
  ],
  '5-4-1': [
    { pos: 'GK', x: 0.07 },
    { pos: 'DEF', x: 0.22 }, { pos: 'DEF', x: 0.22 }, { pos: 'DEF', x: 0.22 }, { pos: 'DEF', x: 0.22 }, { pos: 'DEF', x: 0.22 },
    { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 },
    { pos: 'ATT', x: 0.80 },
  ],
  '3-5-2': [
    { pos: 'GK', x: 0.07 },
    { pos: 'DEF', x: 0.25 }, { pos: 'DEF', x: 0.25 }, { pos: 'DEF', x: 0.25 },
    { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 }, { pos: 'MID', x: 0.50 },
    { pos: 'ATT', x: 0.78 }, { pos: 'ATT', x: 0.78 },
  ],
};

// Fallback formacija za pozicije
function getFormationPositions(formation) {
  return FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
}

function distributeByLine(cards, formation, isHome) {
  const template = getFormationPositions(formation);
  const byPos = { GK: [], DEF: [], MID: [], ATT: [] };
  for (const c of cards) byPos[c.position]?.push(c);

  const result = [];
  const posCount = { GK: 0, DEF: 0, MID: 0, ATT: 0 };

  for (const slot of template) {
    const p = slot.pos;
    const idx = posCount[p] ?? 0;
    posCount[p] = idx + 1;
    const card = byPos[p]?.[idx] || null;
    const lineCards = byPos[p] || [];
    const countInLine = template.filter((t) => t.pos === p).length;
    const yFrac = countInLine > 1 ? (idx + 1) / (countInLine + 1) : 0.5;

    const xFrac = isHome ? slot.x : 1 - slot.x;
    result.push({ card, xFrac, yFrac, pos: p });
  }
  return result;
}

// --- Canvas drawing ---
function drawPitch(ctx) {
  // Teren
  ctx.fillStyle = '#2d7a2d';
  ctx.fillRect(0, 0, W, H);

  // Pruge
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#2d7a2d' : '#287228';
    ctx.fillRect(PITCH_PAD + (i * PW) / 8, PITCH_PAD, PW / 8, PH);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1.5;

  // Linija terena
  ctx.strokeRect(PITCH_PAD, PITCH_PAD, PW, PH);

  // Poluvremenska linija
  ctx.beginPath();
  ctx.moveTo(W / 2, PITCH_PAD);
  ctx.lineTo(W / 2, PITCH_PAD + PH);
  ctx.stroke();

  // Centar krug
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 3, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();

  // Kazneni prostori
  const penW = PW * 0.14;
  const penH = PH * 0.44;
  const penY = H / 2 - penH / 2;

  // Lijevo
  ctx.strokeRect(PITCH_PAD, penY, penW, penH);
  // Desno
  ctx.strokeRect(PITCH_PAD + PW - penW, penY, penW, penH);

  // Golovi
  const goalW = 10;
  const goalH = PH * 0.20;
  const goalY = H / 2 - goalH / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(PITCH_PAD - goalW, goalY, goalW, goalH);
  ctx.fillRect(PITCH_PAD + PW, goalY, goalW, goalH);
  ctx.strokeRect(PITCH_PAD - goalW, goalY, goalW, goalH);
  ctx.strokeRect(PITCH_PAD + PW, goalY, goalW, goalH);
}

function drawPlayers(ctx, homeSlots, awaySlots, highlightTeam) {
  const drawSlots = (slots, color, label) => {
    for (const slot of slots) {
      if (!slot.card) continue;
      const x = PITCH_PAD + slot.xFrac * PW;
      const y = PITCH_PAD + slot.yFrac * PH;

      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = highlightTeam && slot._team !== highlightTeam ? 0.4 : 1.0;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slot.pos, x, y);

      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(x - 18, y + 12, 36, 11);
      ctx.fillStyle = 'white';
      ctx.font = '6.5px sans-serif';
      const name = slot.card.name || slot.card.id || '?';
      ctx.fillText(name.substring(0, 10), x, y + 17.5);
    }
  };

  drawSlots(homeSlots.map((s) => ({ ...s, _team: 'home' })), '#e63946', 'home');
  drawSlots(awaySlots.map((s) => ({ ...s, _team: 'away' })), '#457b9d', 'away');
}

function drawBall(ctx, bx, by) {
  ctx.beginPath();
  ctx.arc(bx, by, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawScore(ctx, homeScore, awayScore, minute) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(W / 2 - 60, 5, 120, 22);
  ctx.fillStyle = 'white';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${homeScore} : ${awayScore}  ${minute}'`, W / 2, 16);
}

function flashGoal(ctx, isHome) {
  const gx = isHome ? PITCH_PAD - 10 : PITCH_PAD + PW;
  const goalY = H / 2 - PH * 0.1;
  const goalH = PH * 0.20;
  ctx.fillStyle = 'rgba(255, 220, 0, 0.6)';
  ctx.fillRect(gx - 5, goalY - 5, 20, goalH + 10);
}

// --- Komponenta ---
const FORMATION_OPTS = Object.keys(FORMATIONS);
const STYLE_OPTS = Object.keys(STYLES);
const MENTALITY_OPTS = Object.keys(MENTALITIES);

export default function MatchCanvas() {
  const pool = useGameStore((s) => s.pool);
  const rewardMatch = useGameStore((s) => s.rewardMatch);
  const signedTalents = useGameStore((s) => s.talents?.filter((t) => t.status === 'signed') || []);

  const [phase, setPhase] = useState('setup'); // setup | playing | halftime | final
  const [tactics, setTactics] = useState({ formation: '4-3-3', style: 'High Press', mentality: 'Attacking' });
  const [awayTactics] = useState({ formation: '5-4-1', style: 'Defensive', mentality: 'Defensive' });
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [minute, setMinute] = useState(0);
  const [eventLog, setEventLog] = useState([]);
  const [reward, setReward] = useState(null);

  // Postava — može se mijenjati na poluvremenu
  const talentCards = useMemo(() => signedTalents.map(talentToCard), [signedTalents]);
  const [homeLineup, setHomeLineup] = useState(null);
  const [awayLineup, setAwayLineup] = useState(null);
  // Karte na klupi (za izmjene)
  const [benchCards, setBenchCards] = useState([]);
  const [pendingSub, setPendingSub] = useState(null); // { outIdx }
  const [subsLeft, setSubsLeft] = useState(3);

  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const ballRef = useRef({ x: W / 2, y: H / 2 });
  const scoreRef = useRef({ home: 0, away: 0 });
  const lineupRef = useRef(null);

  // Postave igrača na terenu
  const homeSlots = useMemo(
    () => homeLineup ? distributeByLine(homeLineup, tactics.formation, true) : [],
    [homeLineup, tactics.formation]
  );
  const awaySlots = useMemo(
    () => awayLineup ? distributeByLine(awayLineup, awayTactics.formation, false) : [],
    [awayLineup, awayTactics.formation]
  );
  const homeSlotsRef = useRef(homeSlots);
  const awaySlotsRef = useRef(awaySlots);
  useEffect(() => { homeSlotsRef.current = homeSlots; }, [homeSlots]);
  useEffect(() => { awaySlotsRef.current = awaySlots; }, [awaySlots]);

  // Inicijalni render terena
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawPitch(ctx);
    drawBall(ctx, W / 2, H / 2);
  }, []);

  // Animacija terena (loop)
  const startRenderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const loop = () => {
      drawPitch(ctx);
      drawPlayers(ctx, homeSlotsRef.current, awaySlotsRef.current, null);
      drawBall(ctx, ballRef.current.x, ballRef.current.y);
      drawScore(ctx, scoreRef.current.home, scoreRef.current.away, ballRef.current.minute || 0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    animRef.current = raf;
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (phase === 'playing' || phase === 'halftime' || phase === 'final') {
      const stop = startRenderLoop();
      return stop;
    }
  }, [phase, startRenderLoop]);

  function animateBallTo(tx, ty, duration, cb) {
    const start = performance.now();
    const sx = ballRef.current.x;
    const sy = ballRef.current.y;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      ballRef.current.x = sx + (tx - sx) * ease;
      ballRef.current.y = sy + (ty - sy) * ease;
      if (t < 1) requestAnimationFrame(tick);
      else { ballRef.current.x = tx; ballRef.current.y = ty; cb?.(); }
    };
    requestAnimationFrame(tick);
  }

  function animateEvent(event, allEvents, idx, currentScore, onDone) {
    const isHome = event.team === 'home';
    // Lopta ide prema golu napadača
    const targetX = isHome
      ? PITCH_PAD + PW - 15
      : PITCH_PAD + 15;
    const targetY = H / 2 + (Math.random() - 0.5) * 60;

    ballRef.current.minute = event.minute;

    animateBallTo(targetX, targetY, 600, () => {
      if (event.isGoal) {
        const sc = { ...currentScore };
        sc[event.team] += 1;
        scoreRef.current = sc;
        // Flash efekat na canvas-u
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          flashGoal(ctx, isHome);
        }
        setTimeout(() => {
          // Vraćamo loptu na centar
          animateBallTo(W / 2, H / 2, 400, () => onDone(sc));
        }, 500);
      } else {
        setTimeout(() => {
          animateBallTo(W / 2, H / 2, 300, () => onDone(currentScore));
        }, 200);
      }
    });
  }

  function replayEvents(events, startScore, onHalftime, onFinal) {
    let idx = 0;
    let currentScore = { ...startScore };

    const next = () => {
      if (idx >= events.length) {
        onFinal(currentScore);
        return;
      }
      const event = events[idx];
      idx++;

      setMinute(typeof event.minute === 'number' ? event.minute : 45);
      setEventLog((prev) => [
        { ...event, score: `${scoreRef.current.home}:${scoreRef.current.away}` },
        ...prev.slice(0, 12),
      ]);

      // Provjeri poluvreme
      const prevEvent = events[idx - 2];
      const prevMinute = prevEvent ? (typeof prevEvent.minute === 'number' ? prevEvent.minute : 0) : 0;
      const curMinute = typeof event.minute === 'number' ? event.minute : 90;
      if (prevMinute <= 45 && curMinute > 45) {
        // Pauza za poluvreme
        onHalftime(currentScore, events.slice(idx - 1), next);
        return;
      }

      animateEvent(event, events, idx, currentScore, (newScore) => {
        currentScore = newScore;
        setScore({ ...newScore });
        scoreRef.current = { ...newScore };
        setTimeout(next, 400);
      });
    };
    next();
  }

  function startMatch() {
    const allCards = [...pool, ...talentCards];
    const hl = buildLineup(allCards, tactics.formation, { extra: talentCards });
    const al = buildLineup(pool, awayTactics.formation);

    // Klupa: karte koje nisu u postavi
    const usedIds = new Set(hl.map((c) => c.id));
    const bench = allCards.filter((c) => !usedIds.has(c.id)).slice(0, 7);

    setHomeLineup(hl);
    setAwayLineup(al);
    setBenchCards(bench);
    lineupRef.current = hl;
    setScore({ home: 0, away: 0 });
    scoreRef.current = { home: 0, away: 0 };
    setEventLog([]);
    setSubsLeft(3);
    setPhase('playing');

    // Simuliraj čitav meč
    const res = simulateMatch(
      { name: 'Domaći', cards: hl, ...tactics, isHome: true, crowdFill: 90 },
      { name: 'Gosti', cards: al, ...awayTactics }
    );

    const events = res.events;

    replayEvents(
      events,
      { home: 0, away: 0 },
      (halfScore, remainingEvents, continueAfterSub) => {
        // Poluvreme
        setScore({ ...halfScore });
        scoreRef.current = { ...halfScore };
        setPhase('halftime');
        // Čuva callback za nastavak
        lineupRef._continueMatch = (newLineup) => {
          setHomeLineup(newLineup);
          setPhase('playing');
          setTimeout(() => {
            replayEvents(
              remainingEvents,
              halfScore,
              (_, _r, _c) => _c(halfScore), // ne očekujemo još jedno poluvreme
              (finalScore) => endMatch(finalScore, res, newLineup, al)
            );
          }, 100);
        };
      },
      (finalScore) => endMatch(finalScore, res, hl, al)
    );
  }

  function endMatch(finalScore, originalResult, hl, al) {
    const outcome = outcomeFromScore(finalScore.home, finalScore.away, 'home');
    const amount = rewardMatch(outcome);
    setReward({ outcome, amount, finalScore });
    setPhase('final');
  }

  function makeSubstitution(lineupCardIdx, benchCard) {
    if (subsLeft <= 0) return;
    const newLineup = [...(homeLineup || [])];
    newLineup[lineupCardIdx] = benchCard;
    const newBench = benchCards.filter((c) => c.id !== benchCard.id);
    newBench.push(homeLineup[lineupCardIdx]);
    setHomeLineup(newLineup);
    setBenchCards(newBench);
    setSubsLeft((n) => n - 1);
    setPendingSub(null);
  }

  function continueToSecondHalf() {
    if (lineupRef._continueMatch) {
      lineupRef._continueMatch(homeLineup);
    }
  }

  const outcomeLabel = reward
    ? reward.finalScore.home > reward.finalScore.away
      ? '🏆 Pobjeda!'
      : reward.finalScore.home < reward.finalScore.away
      ? '❌ Poraz'
      : '🤝 Remi'
    : '';

  return (
    <div className="match-canvas">
      <h2 className="match-canvas__title">Live Meč ⚽</h2>

      {/* Taktike (samo u setup fazi) */}
      {phase === 'setup' && (
        <div className="match-canvas__setup">
          <div className="tactics">
            <h3>Tvoje taktike (Domaći)</h3>
            <label>
              Formacija
              <select value={tactics.formation} onChange={(e) => setTactics({ ...tactics, formation: e.target.value })}>
                {FORMATION_OPTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label>
              Stil
              <select value={tactics.style} onChange={(e) => setTactics({ ...tactics, style: e.target.value })}>
                {STYLE_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label>
              Mentalitet
              <select value={tactics.mentality} onChange={(e) => setTactics({ ...tactics, mentality: e.target.value })}>
                {MENTALITY_OPTS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
          </div>
          <button className="match-canvas__kick" onClick={startMatch}>
            ⚽ Kick Off!
          </button>
        </div>
      )}

      {/* Canvas teren */}
      {phase !== 'setup' && (
        <div className="match-canvas__field-wrap">
          <canvas ref={canvasRef} width={W} height={H} className="match-canvas__canvas" />

          {/* Scoreboard overlay */}
          <div className="match-canvas__hud">
            <span className="match-canvas__team home">Domaći 🔴</span>
            <span className="match-canvas__score">{score.home} : {score.away}</span>
            <span className="match-canvas__team away">🔵 Gosti</span>
            <span className="match-canvas__min">{minute}'</span>
          </div>
        </div>
      )}

      {/* Poluvremenska pauza — izmjene */}
      {phase === 'halftime' && (
        <div className="match-canvas__halftime">
          <h3>⏸ Poluvrijeme — {score.home}:{score.away}</h3>
          <p>Izmjena preostalo: <strong>{subsLeft}</strong> / 3</p>

          <div className="match-canvas__subs">
            <div className="match-canvas__squad">
              <h4>Postava</h4>
              {(homeLineup || []).map((card, i) => (
                <button
                  key={card.id}
                  className={`match-canvas__player${pendingSub?.outIdx === i ? ' selected' : ''}`}
                  onClick={() => subsLeft > 0 && setPendingSub({ outIdx: i })}
                >
                  [{card.position}] {card.name || card.id}
                </button>
              ))}
            </div>
            {pendingSub && (
              <div className="match-canvas__bench">
                <h4>Klupa — odaberi zamjenu za: {homeLineup[pendingSub.outIdx]?.name}</h4>
                {benchCards
                  .filter((c) => c.position === homeLineup[pendingSub.outIdx]?.position)
                  .map((bc) => (
                    <button
                      key={bc.id}
                      className="match-canvas__player match-canvas__player--in"
                      onClick={() => makeSubstitution(pendingSub.outIdx, bc)}
                    >
                      [{bc.position}] {bc.name || bc.id} (OVR {bc.overall ?? '?'})
                    </button>
                  ))}
                {benchCards.filter((c) => c.position === homeLineup[pendingSub.outIdx]?.position).length === 0 && (
                  <p className="match-canvas__no-sub">Nema zamjenskih igrača za tu poziciju.</p>
                )}
                <button className="match-canvas__cancel" onClick={() => setPendingSub(null)}>Otkaži</button>
              </div>
            )}
          </div>

          <button className="match-canvas__kick" onClick={continueToSecondHalf}>
            ▶ Nastavi — Drugi polučas
          </button>
        </div>
      )}

      {/* Event log */}
      {phase !== 'setup' && phase !== 'final' && (
        <div className="match-canvas__log">
          {eventLog.length === 0 && <p className="muted">Čekamo prve šanse…</p>}
          {eventLog.map((e, i) => (
            <div key={i} className={`match-canvas__event${e.isGoal ? ' goal' : ''}`}>
              <span className="min">{e.minute}'</span>
              <span className="team">{e.team === 'home' ? '🔴' : '🔵'}</span>
              <span className="type">{e.typeLabel}</span>
              {e.shooter && <span className="shooter"> — {e.shooter}</span>}
              {e.isGoal && <span className="gol"> ⚽ GOL! {e.score}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Kraj meča */}
      {phase === 'final' && reward && (
        <div className="match-canvas__final">
          <h3 className="match-canvas__result">{outcomeLabel}</h3>
          <p className="match-canvas__final-score">
            Domaći {reward.finalScore.home} : {reward.finalScore.away} Gosti
          </p>
          <p className="match-canvas__reward">
            Zaradio si <strong>{reward.amount.toLocaleString()} Kovanica</strong>
          </p>
          <div className="match-canvas__log">
            {eventLog.map((e, i) => (
              <div key={i} className={`match-canvas__event${e.isGoal ? ' goal' : ''}`}>
                <span className="min">{e.minute}'</span>
                <span className="team">{e.team === 'home' ? '🔴' : '🔵'}</span>
                <span className="type">{e.typeLabel}</span>
                {e.shooter && <span className="shooter"> — {e.shooter}</span>}
                {e.isGoal && <span className="gol"> ⚽ GOL!</span>}
              </div>
            ))}
          </div>
          <button className="match-canvas__kick" onClick={() => {
            setPhase('setup');
            setEventLog([]);
            setScore({ home: 0, away: 0 });
            setReward(null);
            setMinute(0);
            scoreRef.current = { home: 0, away: 0 };
            ballRef.current = { x: W / 2, y: H / 2 };
            // Re-render prazan teren
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              drawPitch(ctx);
              drawBall(ctx, W / 2, H / 2);
            }
          }}>
            🔄 Novi meč
          </button>
        </div>
      )}
    </div>
  );
}
