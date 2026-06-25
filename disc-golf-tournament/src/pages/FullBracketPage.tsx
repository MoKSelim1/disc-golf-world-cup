import { FullBracket } from '../components/common/FullBracket';

export function FullBracketPage() {
  return (
    <section className="page-stack full-bracket-page">
      <div className="panel-heading panel-heading--loose">
        <div>
          <p className="eyebrow">Tournament path</p>
          <h2>Full Bracket</h2>
        </div>
        <span>Knockout paths, final bracket, and third-place match in one view.</span>
      </div>
      <FullBracket />
    </section>
  );
}
