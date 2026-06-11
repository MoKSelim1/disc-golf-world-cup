import { KnockoutBracket } from '../components/common/Bracket';
import { useTournament } from '../context/TournamentContext';

export function KnockoutPage() {
  const { data } = useTournament();

  if (data.knockoutMatches.length === 0) {
    return (
      <section className="page-stack">
        <div className="panel-heading panel-heading--loose">
          <div>
            <p className="eyebrow">Direct qualification</p>
            <h2>No Knockout Stage</h2>
          </div>
          <span>Top group finishers advance directly to the final bracket.</span>
        </div>
        <section className="panel">
          <p className="panel-note">
            This format supports flexible player counts by balancing groups and using byes inside odd-sized groups.
          </p>
        </section>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="panel-heading panel-heading--loose">
        <div>
          <p className="eyebrow">Short pads</p>
          <h2>Knockout Stage</h2>
        </div>
        <span>Round 1 qualifiers meet group winners in Round 2.</span>
      </div>
      <KnockoutBracket />
    </section>
  );
}
