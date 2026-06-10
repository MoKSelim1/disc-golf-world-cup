import { KnockoutBracket } from '../components/common/Bracket';

export function KnockoutPage() {
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
