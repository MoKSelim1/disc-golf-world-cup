import { useTournament } from '../context/TournamentContext';
import { computePayout } from '../lib/payout';

export function PayoutPage() {
  const { data } = useTournament();
  const payout = computePayout(data.players.length, data.buyInAmount);

  return (
    <section className="page-stack">
      <div className="panel-heading panel-heading--loose">
        <div>
          <p className="eyebrow">${payout.buyIn} buy-in</p>
          <h2>Payout</h2>
        </div>
        <span>{payout.playerCount} registered players</span>
      </div>
      <div className="stat-grid">
        <article className="stat-card stat-card--large">
          <span>Prize Pool</span>
          <strong>${payout.prizePool}</strong>
        </article>
        <article className="stat-card stat-card--large">
          <span>1st</span>
          <strong>${payout.first}</strong>
        </article>
        <article className="stat-card stat-card--large">
          <span>2nd</span>
          <strong>${payout.second}</strong>
        </article>
        <article className="stat-card stat-card--large">
          <span>3rd</span>
          <strong>${payout.third}</strong>
        </article>
        <article className="stat-card stat-card--large">
          <span>4th</span>
          <strong>{payout.fourth}</strong>
        </article>
      </div>
    </section>
  );
}
