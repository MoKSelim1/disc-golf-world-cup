import type { FinalStageMatch, KnockoutMatch } from '../../types/tournament';
import { MatchCard } from './MatchCard';
import { knockoutSort, participantLabel, formatPlayer, getPlayer } from '../../lib/display';
import { useTournament } from '../../context/TournamentContext';

export function KnockoutBracket() {
  const { data } = useTournament();
  const rounds = [1, 2].map((round) =>
    data.knockoutMatches.filter((match) => match.round === round).sort(knockoutSort),
  );

  return (
    <div className="bracket-scroll">
      <div className="bracket">
        {rounds.map((matches, index) => (
          <section className="bracket-round" key={index}>
            <h3>{index === 0 ? 'Knockout Round 1' : 'Knockout Round 2'}</h3>
            {matches.map((match: KnockoutMatch) => (
              <MatchCard
                key={match.id}
                eyebrow={`Pod ${match.podIndex + 1}`}
                title={match.label.toUpperCase()}
                player1={participantLabel(match.participant1, data)}
                player2={participantLabel(match.participant2, data)}
                player1Score={match.player1Score}
                player2Score={match.player2Score}
                winner={formatPlayer(getPlayer(data.players, match.winnerId))}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export function FinalBracket() {
  const { data } = useTournament();
  const roundNames = ['quarterfinal', 'semifinal', 'final', 'thirdPlace'] as const;

  return (
    <div className="bracket-scroll">
      <div className="bracket">
        {roundNames.map((roundName) => {
          const matches = data.finalStageMatches
            .filter((match: FinalStageMatch) => match.roundName === roundName)
            .sort((a, b) => a.roundOrder - b.roundOrder);
          if (matches.length === 0) return null;
          return (
            <section className="bracket-round" key={roundName}>
              <h3>{roundName === 'thirdPlace' ? 'Third Place' : roundName}</h3>
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  eyebrow="Final Stage"
                  title={match.roundName === 'final' ? 'Final' : `Match ${match.roundOrder + 1}`}
                  player1={participantLabel(match.participant1, data)}
                  player2={participantLabel(match.participant2, data)}
                  player1Score={match.player1Score}
                  player2Score={match.player2Score}
                  winner={formatPlayer(getPlayer(data.players, match.winnerId))}
                />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}
