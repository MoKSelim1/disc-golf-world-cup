import { useTournament } from '../context/TournamentContext';
import { computeGroupStandings } from '../lib/groupStandings';
import { computePayout } from '../lib/payout';
import { formatPlayer, getPlayer, participantLabel } from '../lib/display';

export function DashboardPage() {
  const { data } = useTournament();
  const payout = computePayout(data.players.length, data.buyInAmount);
  const completedGroupMatches = data.groups.flatMap((group) => group.matches).filter((match) => match.winnerId).length;
  const totalGroupMatches = data.groups.flatMap((group) => group.matches).length;
  const groupProgress = totalGroupMatches === 0 ? 0 : Math.round((completedGroupMatches / totalGroupMatches) * 100);
  const champion = data.finalStageMatches.find((match) => match.id === 'final-final')?.winnerId ?? null;
  const championPlayer = getPlayer(data.players, champion);

  return (
    <div className="page-stack">
      <section className="hero-band">
        <div>
          <p className="eyebrow">World Cup style tournament</p>
          <h2>{data.tournamentName}</h2>
          <p>Track standings, matchups, brackets, and payouts for the North Park event.</p>
        </div>
        <div className="hero-metrics">
          <span>{data.players.length} Players</span>
          <span>{data.numGroups} Groups</span>
          <span>${payout.prizePool} Pool</span>
        </div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <span>Group Stage</span>
          <strong>
            {completedGroupMatches}/{totalGroupMatches}
          </strong>
          <div className="progress-track" aria-label={`Group stage ${groupProgress}% complete`}>
            <div className="progress-fill" style={{ width: `${groupProgress}%` }} />
          </div>
        </article>
        <article className="stat-card">
          <span>{championPlayer ? 'Champion' : 'Advancing Spots'}</span>
          <strong>{championPlayer ? formatPlayer(championPlayer) : data.numGroups * 3}</strong>
          {!championPlayer && <small>Top 3 from each group</small>}
        </article>
        <article className="stat-card">
          <span>Last Updated</span>
          <strong>{new Date(data.lastUpdated).toLocaleDateString()}</strong>
        </article>
      </section>

      <section className="section-heading">
        <div>
          <p className="eyebrow">Current Picture</p>
          <h2>Group Standings</h2>
        </div>
        <span>Top 3 advance from each group</span>
      </section>

      <section className="dashboard-groups">
        {data.groups.map((group) => (
          <article className="group-summary-card" key={group.id}>
            <div className="panel-heading">
              <h3>{group.name}</h3>
              <span>{group.matches.filter((match) => match.winnerId).length}/6 matches</span>
            </div>
            <div className="rank-list">
              {computeGroupStandings(group).map((row) => (
                <div className={row.rank === 4 ? 'rank-item rank-item--out' : 'rank-item'} key={row.playerId}>
                  <span className="rank-badge">{row.rank}</span>
                  <span className="player-name">{formatPlayer(getPlayer(data.players, row.playerId))}</span>
                  <span>{row.wins}W</span>
                  <span>{row.totalScore}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h3>Next Knockout Entrants</h3>
          <span>Resolved from current standings</span>
        </div>
        <div className="matchup-preview-grid">
          {data.knockoutMatches.slice(0, 4).map((match) => (
            <article className="matchup-preview" key={match.id}>
              <span>Round 1</span>
              <strong>{participantLabel(match.participant1, data)}</strong>
              <em>vs</em>
              <strong>{participantLabel(match.participant2, data)}</strong>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
