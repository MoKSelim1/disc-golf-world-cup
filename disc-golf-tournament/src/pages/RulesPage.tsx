import { useTournament } from '../context/TournamentContext';
import { renderRulesMarkdown, rulesMarkdownForTournament } from '../lib/rules';

export function RulesPage() {
  const { data } = useTournament();
  const rulesMarkdown = rulesMarkdownForTournament(data);

  return (
    <section className="page-stack rules-page">
      <div className="panel-heading panel-heading--loose">
        <div>
          <p className="eyebrow">Tournament Format</p>
          <h2>Rules</h2>
        </div>
        <span>Configured by the tournament admin</span>
      </div>
      <article className="panel prose">{renderRulesMarkdown(rulesMarkdown)}</article>
    </section>
  );
}
