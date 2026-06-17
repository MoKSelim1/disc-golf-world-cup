import { useTournament } from '../context/TournamentContext';
import { computeGroupStandings } from '../lib/groupStandings';
import { formatPlayer, getPlayer } from '../lib/display';
import { MatchCard } from '../components/common/MatchCard';
import { RemainingGroupGames } from '../components/common/RemainingGroupGames';

export function GroupsPage() {
  const { data } = useTournament();
  return (
    <div className="page-stack">
      <RemainingGroupGames />
      {data.groups.map((group) => (
        <section className="panel" key={group.id}>
          <div className="panel-heading">
            <h2>{group.name}</h2>
            <span>Short pads, labeled matchup slots can be played in any order</span>
          </div>
          <div className="content-grid content-grid--two">
            <div>
              <h3>Standings</h3>
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Wins</th>
                    <th>Losses</th>
                    <th>Played</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {computeGroupStandings(group).map((row) => (
                    <tr key={row.playerId}>
                      <td>{row.rank}</td>
                      <td>{formatPlayer(getPlayer(data.players, row.playerId))}</td>
                      <td>{row.wins}</td>
                      <td>{row.losses}</td>
                      <td>{row.played}</td>
                      <td>{row.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="match-grid">
              {group.matches.map((match, index) => (
                <MatchCard
                  key={match.id}
                  eyebrow={`Match ${index + 1}`}
                  title={match.id.toUpperCase()}
                  player1={formatPlayer(getPlayer(data.players, match.player1Id))}
                  player2={formatPlayer(getPlayer(data.players, match.player2Id))}
                  player1Score={match.player1Score}
                  player2Score={match.player2Score}
                  winner={formatPlayer(getPlayer(data.players, match.winnerId))}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
