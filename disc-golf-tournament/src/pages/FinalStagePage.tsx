import { FinalBracket } from '../components/common/Bracket';

export function FinalStagePage() {
  return (
    <section className="page-stack">
      <div className="panel-heading panel-heading--loose">
        <div>
          <p className="eyebrow">Long tee positions</p>
          <h2>Final Four</h2>
        </div>
        <span>Semifinals, third place, and final.</span>
      </div>
      <FinalBracket />
    </section>
  );
}
