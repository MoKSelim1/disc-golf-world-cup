import { useTournament } from '../context/TournamentContext';
import { computeGroupStandings } from '../lib/groupStandings';
import { computePayout } from '../lib/payout';
import { formatPlayer, getPlayer, participantLabel } from '../lib/display';

export function DashboardPage() {
  const { data } = useTournament();
  const payout = computePayout(data.players.length, data.buyInAmount);
  const completedGroupMatches = data.groups.flatMap((group) => group.matches).filter((match) => match.winnerId).length;
  const totalGroupMatches = data.groups.flatMap((group) => group.matches).length;
  const champion = data.finalStageMatches.find((match) => match.id === 'final-final')?.winnerId ?? null;

  return (
    <div className="page-stack">
      <section className="hero-band">
        <div>
          <p className="eyebrow">World Cup style tournament</p>
          <h2>{data.tournamentName}</h2>
          <p>Group Stage to Knockout Stage to Final Four at North Park.</p>
        </div>
        <div className="hero-metrics">
          <span>{data.players.length} Players</span>
          <span>{data.numGroups} Groups</span>
          <span>${payout.prizePool} Pool</span>
        </div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <span>Group Stage</span>
          <strong>
            {completedGroupMatches}/{totalGroupMatches}
          </strong>
        </article>
        <article className="stat-card">
          <span>Champion</span>
          <strong>{formatPlayer(getPlayer(data.players, champion))}</strong>
        </article>
        <article className="stat-card">
          <span>Last Updated</span>
          <strong>{new Date(data.lastUpdated).toLocaleDateString()}</strong>
        </article>
      </section>

      <section className="content-grid content-grid--two">
        {data.groups.map((group) => (
          <article className="panel" key={group.id}>
            <div className="panel-heading">
              <h3>{group.name}</h3>
              <span>Top 3 advance</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Wins</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {computeGroupStandings(group).map((row) => (
                  <tr key={row.playerId}>
                    <td>{row.rank}</td>
                    <td>{formatPlayer(getPlayer(data.players, row.playerId))}</td>
                    <td>{row.wins}</td>
                    <td>{row.totalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Next Knockout Entrants</h3>
          <span>Resolved from current standings</span>
        </div>
        <div className="pill-list">
          {data.knockoutMatches.slice(0, 4).map((match) => (
            <span className="pill" key={match.id}>
              {participantLabel(match.participant1, data)} vs {participantLabel(match.participant2, data)}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
