import { TournamentBracketChart } from '../components/common/TournamentBracketChart';

export function FullBracketPage() {
  return (
    <section className="page-stack full-bracket-page">
      <div className="panel-heading panel-heading--loose">
        <div>
          <p className="eyebrow">Tournament path</p>
          <h2>Full Bracket</h2>
        </div>
        <span>Group stage, knockout paths, and the final four in one view.</span>
      </div>
      <TournamentBracketChart />
    </section>
  );
}
