import { useTournament } from '../../context/TournamentContext';
import { finalMatchTitle, finalRoundTitle, participantLabel } from '../../lib/display';
import { ScoreEditor } from './ScoreEditor';

export function FinalStageScoreEntry() {
  const { data, dispatch } = useTournament();
  const completedMatches = data.finalStageMatches.filter((match) => match.winnerId).length;

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Final Stage Scores</h2>
        <span>
          {completedMatches}/{data.finalStageMatches.length} complete
        </span>
      </div>
      <div className="admin-match-list">
        {data.finalStageMatches.map((match) => (
          <article className="subpanel" key={match.id}>
            <div className="panel-heading">
              <h3>{finalMatchTitle(match.roundName, match.roundOrder)}</h3>
              <span>{finalRoundTitle(match.roundName)}</span>
            </div>
            <ScoreEditor
              player1={participantLabel(match.participant1, data)}
              player2={participantLabel(match.participant2, data)}
              player1Score={match.player1Score}
              player2Score={match.player2Score}
              onChange={(player1Score, player2Score) =>
                dispatch({ type: 'UPDATE_FINAL_SCORE', matchId: match.id, player1Score, player2Score })
              }
            />
          </article>
        ))}
      </div>
    </section>
  );
}
