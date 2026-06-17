import { useTournament } from '../../context/TournamentContext';
import { formatPlayer, getPlayer } from '../../lib/display';
import { ScoreEditor } from './ScoreEditor';

export function GroupScoreEntry() {
  const { data, dispatch } = useTournament();
  const allMatches = data.groups.flatMap((group) => group.matches);
  const completedMatches = allMatches.filter((match) => match.winnerId).length;

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Group Scores</h2>
        <span>
          {completedMatches}/{allMatches.length} complete; enter matches in any order
        </span>
      </div>
      <div className="admin-match-list">
        {data.groups.flatMap((group) =>
          group.matches.map((match, index) => (
            <article className="subpanel" key={match.id}>
              <div className="panel-heading">
                <h3>
                  {group.name} - Match {index + 1}
                </h3>
                <span>{match.id}</span>
              </div>
              <ScoreEditor
                player1={formatPlayer(getPlayer(data.players, match.player1Id))}
                player2={formatPlayer(getPlayer(data.players, match.player2Id))}
                player1Score={match.player1Score}
                player2Score={match.player2Score}
                onChange={(player1Score, player2Score) =>
                  dispatch({ type: 'UPDATE_GROUP_SCORE', matchId: match.id, player1Score, player2Score })
                }
              />
            </article>
          )),
        )}
      </div>
    </section>
  );
}
