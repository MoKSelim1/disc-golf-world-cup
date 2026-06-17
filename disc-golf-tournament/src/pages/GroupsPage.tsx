import { useTournament } from '../context/TournamentContext';
import { computeGroupStandings } from '../lib/groupStandings';
import { formatPlayer, getPlayer } from '../lib/display';
import { MatchCard } from '../components/common/MatchCard';

export function GroupsPage() {
  const { data } = useTournament();
  const pendingMatchesByWeek = data.groups
    .flatMap((group) =>
      group.matches
        .filter((match) => match.player1Score === null || match.player2Score === null)
        .map((match) => ({ group, match })),
    )
    .sort((a, b) =>
      a.match.week - b.match.week ||
      a.group.name.localeCompare(b.group.name) ||
      a.match.id.localeCompare(b.match.id),
    )
    .reduce<
      Array<{
        week: number;
        entries: Array<{
          group: (typeof data.groups)[number];
          match: (typeof data.groups)[number]['matches'][number];
        }>;
      }>
    >((weeks, entry) => {
      const currentWeek = weeks.at(-1);
      if (currentWeek?.week === entry.match.week) {
        currentWeek.entries.push(entry);
      } else {
        weeks.push({ week: entry.match.week, entries: [entry] });
      }
      return weeks;
    }, []);

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading">
          <h2>Remaining group games</h2>
          <span>Unplayed matchups, grouped by week so the pending list is easy to scan</span>
        </div>
        {pendingMatchesByWeek.length > 0 ? (
          <div className="pending-week-list">
            {pendingMatchesByWeek.map((week) => (
              <div className="pending-week" key={week.week}>
                <h3>Week {week.week}</h3>
                <div className="pending-match-list">
                  {week.entries.map(({ group, match }) => (
                    <div className="pending-match" key={match.id}>
                      <span>{group.name}</span>
                      <strong>
                        {formatPlayer(getPlayer(data.players, match.player1Id))} vs{' '}
                        {formatPlayer(getPlayer(data.players, match.player2Id))}
                      </strong>
                      <em>{match.id.toUpperCase()}</em>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="panel-note">All group-stage games have been played.</p>
        )}
      </section>
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
              {group.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  eyebrow={`Week ${match.week}`}
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
