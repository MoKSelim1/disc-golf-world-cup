import { useTournament } from '../../context/TournamentContext';
import { formatPlayer, getPlayer } from '../../lib/display';

export function RemainingGroupGames() {
  const { data } = useTournament();
  const pendingMatchesByWeek = data.groups
    .flatMap((group) =>
      group.matches
        .filter((match) => !match.winnerId)
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
    <section className="panel" id="remaining-group-games">
      <div className="panel-heading">
        <h2>Remaining group games</h2>
        <span>Unplayed matchups and unresolved ties, grouped by week so the pending list is easy to scan</span>
      </div>
      {pendingMatchesByWeek.length > 0 ? (
        <div className="pending-week-list">
          {pendingMatchesByWeek.map((week) => (
            <div className="pending-week" key={week.week}>
              <h3>Week {week.week}</h3>
              <div className="pending-match-list">
                {week.entries.map(({ group, match }) => {
                  const needsDecision =
                    match.player1Score !== null &&
                    match.player2Score !== null &&
                    match.player1Score === match.player2Score;

                  return (
                    <div className="pending-match" key={match.id}>
                      <span>{group.name}</span>
                      <strong>
                        {formatPlayer(getPlayer(data.players, match.player1Id))} vs{' '}
                        {formatPlayer(getPlayer(data.players, match.player2Id))}
                      </strong>
                      <em>{needsDecision ? `${match.id.toUpperCase()} - Tie needs decision` : match.id.toUpperCase()}</em>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="panel-note">All group-stage games are resolved.</p>
      )}
    </section>
  );
}
