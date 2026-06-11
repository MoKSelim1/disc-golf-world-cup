import { FinalBracket } from '../components/common/Bracket';
import { useTournament } from '../context/TournamentContext';

export function FinalStagePage() {
  const { data } = useTournament();
  const mainMatches = data.finalStageMatches.filter((match) => match.roundName !== 'thirdPlace');
  const firstRound = mainMatches[0]?.roundName ?? 'final';

  return (
    <section className="page-stack">
      <div className="panel-heading panel-heading--loose">
        <div>
          <p className="eyebrow">Long tee positions</p>
          <h2>{firstRound === 'final' ? 'Championship Final' : 'Final Bracket'}</h2>
        </div>
        <span>{data.finalStageMatches.length} scheduled matches.</span>
      </div>
      <FinalBracket />
    </section>
  );
}
