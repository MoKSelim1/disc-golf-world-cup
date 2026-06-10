import { useTournament } from '../../context/TournamentContext';
import { participantLabel } from '../../lib/display';
import { ScoreEditor } from './ScoreEditor';

export function FinalStageScoreEntry() {
  const { data, dispatch } = useTournament();

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Final Stage Scores</h2>
        <span>Long tee positions</span>
      </div>
      <div className="admin-match-list">
        {data.finalStageMatches.map((match) => (
          <article className="subpanel" key={match.id}>
            <div className="panel-heading">
              <h3>{match.roundName === 'thirdPlace' ? 'Third Place' : match.roundName}</h3>
              <span>{match.id}</span>
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
