export function RulesPage() {
  return (
    <section className="page-stack rules-page">
      <div className="panel-heading panel-heading--loose">
        <div>
          <p className="eyebrow">Tournament Format</p>
          <h2>Rules</h2>
        </div>
        <span>Guaranteed 3 group-stage matches</span>
      </div>
      <article className="panel prose">
        <h3>Entry</h3>
        <p>$30 buy-in paid via PayPal to enriquevazquez2001@gmail.com.</p>
        <p>Each player represents a selected country or team name.</p>
        <h3>Group Stage</h3>
        <p>Groups of four play a round robin at North Park from short pads.</p>
        <p>Week labels identify the planned matchups only; group-stage matches may be played in any order.</p>
        <p>Standings are ordered by match wins, then lower aggregate score.</p>
        <p>Group winners receive a bye into Knockout Round 2. Second and third place advance to Knockout Round 1.</p>
        <h3>Knockout Stage</h3>
        <p>Second-place finishers face third-place finishers from paired groups. Round 1 winners meet group winners in Round 2.</p>
        <h3>Final Four</h3>
        <p>The final stage uses long tee positions with semifinals, a third-place match, and the championship final.</p>
      </article>
    </section>
  );
}
