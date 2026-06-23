import { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/useGameStore.js';
import { buildLineup } from '../game/matchEngine.js';
import { runAmateurSeason, generateAIClubs, playerClubFromLineup } from '../game/amateurSeason.js';
import { mulberry32, hashSeed } from '../game/rng.js';
import { SEASON_DAYS } from '../game/elo.js';

function runSeason(pool, seed) {
  const rng = mulberry32(hashSeed(`liga-${seed}`));
  const lineup = buildLineup(pool, '4-3-3');
  const player = playerClubFromLineup('Moj Klub', lineup);
  // AI klubovi oko ELO igrača -> konkurentna amaterska grupa.
  const ai = generateAIClubs(19, { rng, eloRange: [player.elo - 150, player.elo + 120] });
  return runAmateurSeason({ clubs: [player, ...ai], days: SEASON_DAYS, rng });
}

export default function LeagueTable() {
  const pool = useGameStore((s) => s.pool);
  const [seed, setSeed] = useState(1);
  const [season, setSeason] = useState(() => runSeason(pool, 1));

  const newSeason = () => {
    const next = seed + 1;
    setSeed(next);
    setSeason(runSeason(pool, next));
  };

  const player = season.table.find((c) => c.isPlayer);

  return (
    <div className="league">
      <div className="league__head">
        <p>
          Amaterska sezona · {season.days} dana · top {season.promotedCount} napreduje
          {player && (
            <> · tvoj klub: <strong>{player.rank}.</strong> ({player.promoted ? 'napreduje ✅' : 'ostaje'})</>
          )}
        </p>
        <button className="league__new" onClick={newSeason}>Nova sezona</button>
      </div>

      <table className="ltable">
        <thead>
          <tr>
            <th>#</th><th className="ltable__name">Klub</th>
            <th>O</th><th>P</th><th>R</th><th>I</th><th>Bod</th><th>ELO</th>
          </tr>
        </thead>
        <tbody>
          {season.table.map((c) => (
            <motion.tr
              key={c.id}
              className={`${c.isPlayer ? 'ltable__player' : ''} ${c.promoted ? 'ltable__promo' : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <td>{c.rank}</td>
              <td className="ltable__name">{c.name}{c.isPlayer ? ' ⭐' : ''}</td>
              <td>{c.played}</td><td>{c.w}</td><td>{c.d}</td><td>{c.l}</td>
              <td>{c.points}</td><td>{c.elo}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
      <p className="league__legend">Zelene = zona napredovanja u profesionalnu ligu (§8.1).</p>
    </div>
  );
}
