import { useTournament } from '../../context/TournamentContext';
import { participantLabel } from '../../lib/display';
import { knockoutSort } from '../../lib/display';
import { ScoreEditor } from './ScoreEditor';

export function KnockoutScoreEntry() {
  const { data, dispatch } = useTournament();

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Knockout Scores</h2>
        <span>Round 1 and Round 2</span>
      </div>
      <div className="admin-match-list">
        {[...data.knockoutMatches].sort(knockoutSort).map((match) => (
          <article className="subpanel" key={match.id}>
            <div className="panel-heading">
              <h3>
                Round {match.round} - {match.label.toUpperCase()}
              </h3>
              <span>Pod {match.podIndex + 1}</span>
            </div>
            <ScoreEditor
              player1={participantLabel(match.participant1, data)}
              player2={participantLabel(match.participant2, data)}
              player1Score={match.player1Score}
              player2Score={match.player2Score}
              onChange={(player1Score, player2Score) =>
                dispatch({ type: 'UPDATE_KNOCKOUT_SCORE', matchId: match.id, player1Score, player2Score })
              }
            />
          </article>
        ))}
      </div>
    </section>
  );
}
