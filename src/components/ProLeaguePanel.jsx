import { useGameStore } from '../store/useGameStore.js';
import { euroName, EURO_SPOTS, PROMOTION_SPOTS, LEAGUE_SIZE } from '../game/proLeague.js';

const EURO_SHORT = { cl: 'LŠ', el: 'LE', conf: 'LK' };

function euroForRank(rank) {
  if (rank >= EURO_SPOTS.cl[0] && rank <= EURO_SPOTS.cl[1]) return 'cl';
  if (rank >= EURO_SPOTS.el[0] && rank <= EURO_SPOTS.el[1]) return 'el';
  if (rank >= EURO_SPOTS.conf[0] && rank <= EURO_SPOTS.conf[1]) return 'conf';
  return null;
}

export default function ProLeaguePanel() {
  const proSeason = useGameStore((s) => s.proSeason);
  const euroResult = useGameStore((s) => s.euroResult);
  const runProSeason = useGameStore((s) => s.runProSeason);
  const runEuropean = useGameStore((s) => s.runEuropean);

  return (
    <div className="proleague">
      <div className="proleague__head">
        <p>1. liga · {LEAGUE_SIZE} klubova · jednokružno (§8.2)</p>
        <button className="prog__btn" onClick={runProSeason}>Simuliraj profi sezonu</button>
      </div>

      {!proSeason ? (
        <p className="prog__muted">Klikni „Simuliraj profi sezonu" da odigraš ligašku sezonu.</p>
      ) : (
        <>
          <p className="proleague__legend">
            Zeleno = promocija (1–{PROMOTION_SPOTS}) · crveno = ispadanje (15–16) · LŠ/LE/LK = evropska mjesta
          </p>
          <table className="ltable">
            <thead>
              <tr><th>#</th><th className="ltable__name">Klub</th><th>O</th><th>P</th><th>R</th><th>I</th><th>GR</th><th>Bod</th><th>EU</th></tr>
            </thead>
            <tbody>
              {proSeason.table.map((c) => {
                const euro = euroForRank(c.rank);
                const promo = c.rank <= PROMOTION_SPOTS;
                const releg = c.rank > LEAGUE_SIZE - 2;
                return (
                  <tr key={c.id} className={`${c.isPlayer ? 'ltable__player' : ''} ${promo ? 'ltable__promo' : ''} ${releg ? 'ltable__releg' : ''}`}>
                    <td>{c.rank}</td>
                    <td className="ltable__name">{c.name}{c.isPlayer ? ' ⭐' : ''}</td>
                    <td>{c.played}</td><td>{c.w}</td><td>{c.d}</td><td>{c.l}</td>
                    <td>{c.gd > 0 ? `+${c.gd}` : c.gd}</td><td>{c.points}</td>
                    <td className={`euro euro--${euro || 'none'}`}>{euro ? EURO_SHORT[euro] : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="proleague__euro">
            {proSeason.euro ? (
              <>
                <p>Kvalifikovao si se: <strong>{euroName(proSeason.euro.competition)}</strong> (mjesto {proSeason.playerRank})</p>
                <button className="prog__btn" onClick={runEuropean}>Igraj {euroName(proSeason.euro.competition)}</button>
              </>
            ) : (
              <p className="prog__muted">Mjesto {proSeason.playerRank} — bez evropske kvalifikacije ove sezone.</p>
            )}
          </div>

          {euroResult && (
            <div className="proleague__bracket">
              <h3>{euroName(euroResult.competition)} — {euroResult.playerWon ? '🏆 OSVOJENO!' : `pobjednik: ${euroResult.winner.name}`}</h3>
              {euroResult.rounds.map((round, i) => (
                <div key={i} className="bracket__round">
                  <span className="bracket__label">Runda {i + 1}</span>
                  {round.map((m, j) => (
                    <span key={j} className="bracket__match">{m.a} {m.score} {m.b} → {m.winner}</span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
