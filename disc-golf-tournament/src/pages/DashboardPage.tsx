import { useMemo, useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { computeGroupStandings } from '../lib/groupStandings';
import { computePayout } from '../lib/payout';
import { formatPlayer, getPlayer, participantLabel } from '../lib/display';
import { RemainingGroupGames } from '../components/common/RemainingGroupGames';
import { advancingPerGroup } from '../lib/tournament';
import type { Group, TournamentData } from '../types/tournament';

type DashboardStage = 'groups' | 'knockout' | 'finals' | 'complete';

const stageCopy: Record<DashboardStage, { label: string; eyebrow: string; description: string }> = {
  groups: {
    label: 'Group Stage',
    eyebrow: 'Live qualifying picture',
    description: 'Group cards prioritize current cut lines, remaining scorecards, wins, losses, and games played.',
  },
  knockout: {
    label: 'Knockout Stage',
    eyebrow: 'Play-in bracket is live',
    description: 'Group results are set. The dashboard now follows the knockout paths feeding the final bracket.',
  },
  finals: {
    label: 'Final Bracket',
    eyebrow: 'Medal chase',
    description: 'The qualifying path is resolved and the dashboard shifts focus to the final bracket.',
  },
  complete: {
    label: 'Tournament Complete',
    eyebrow: 'Champion crowned',
    description: 'All brackets are complete. Use the dashboard as the final tournament snapshot.',
  },
};

function completedMatches(matches: Array<{ winnerId: string | null }>) {
  return matches.filter((match) => match.winnerId).length;
}

function stageForTournament(data: TournamentData): DashboardStage {
  const groupMatches = data.groups.flatMap((group) => group.matches);
  const groupsComplete = groupMatches.length > 0 && completedMatches(groupMatches) === groupMatches.length;
  const knockoutComplete =
    data.knockoutMatches.length === 0 || completedMatches(data.knockoutMatches) === data.knockoutMatches.length;
  const finalComplete = Boolean(data.finalStageMatches.find((match) => match.id === 'final-final')?.winnerId);

  if (finalComplete) return 'complete';
  if (!groupsComplete) return 'groups';
  if (!knockoutComplete) return 'knockout';
  return 'finals';
}

function nextGroupMatch(group: Group) {
  const index = group.matches.findIndex((match) => !match.winnerId);
  return index >= 0 ? { match: group.matches[index], number: index + 1 } : null;
}

export function DashboardPage() {
  const { data } = useTournament();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const payout = computePayout(data.players.length, data.buyInAmount);
  const advancingCount = advancingPerGroup(data);
  const allGroupMatches = data.groups.flatMap((group) => group.matches);
  const completedGroupMatches = completedMatches(allGroupMatches);
  const totalGroupMatches = allGroupMatches.length;
  const groupProgress = totalGroupMatches === 0 ? 0 : Math.round((completedGroupMatches / totalGroupMatches) * 100);
  const knockoutProgress =
    data.knockoutMatches.length === 0
      ? 100
      : Math.round((completedMatches(data.knockoutMatches) / data.knockoutMatches.length) * 100);
  const finalProgress =
    data.finalStageMatches.length === 0
      ? 0
      : Math.round((completedMatches(data.finalStageMatches) / data.finalStageMatches.length) * 100);
  const currentStage = stageForTournament(data);
  const champion = data.finalStageMatches.find((match) => match.id === 'final-final')?.winnerId ?? null;
  const championPlayer = getPlayer(data.players, champion);
  const visibleGroups = selectedGroupId === 'all' ? data.groups : data.groups.filter((group) => group.id === selectedGroupId);
  const stage = stageCopy[currentStage];
  const cutLineDrama = useMemo(
    () =>
      data.groups.map((group) => {
        const standings = computeGroupStandings(group);
        const bubble = standings[advancingCount - 1];
        const chaser = standings[advancingCount];
        return {
          group,
          bubble,
          chaser,
          remaining: group.matches.length - completedMatches(group.matches),
          standings,
        };
      }),
    [data.groups, advancingCount],
  );
  const hottestGroup = [...cutLineDrama].sort((a, b) => b.remaining - a.remaining)[0];

  return (
    <div className="page-stack dashboard-page">
      <section className="dashboard-hero">
        <div className="dashboard-hero__copy">
          <p className="eyebrow">{stage.eyebrow}</p>
          <h2>{data.tournamentName}</h2>
          <p>{stage.description}</p>
          <div className="hero-metrics">
            <span>{data.players.length} Players</span>
            <span>{data.numGroups} Groups</span>
            <span>${payout.prizePool} Pool</span>
          </div>
        </div>
        <div className="stage-card" aria-label={`Current stage: ${stage.label}`}>
          <span className="stage-card__label">Now showing</span>
          <strong>{stage.label}</strong>
          <div className="stage-timeline" aria-hidden="true">
            {(['groups', 'knockout', 'finals', 'complete'] as DashboardStage[]).map((item) => (
              <span
                className={
                  item === currentStage
                    ? 'stage-timeline__dot stage-timeline__dot--active'
                    : 'stage-timeline__dot'
                }
                key={item}
              />
            ))}
          </div>
          <small>
            {championPlayer
              ? `${formatPlayer(championPlayer)} lifted the cup.`
              : `${totalGroupMatches - completedGroupMatches} group scorecards left before the cut fully settles.`}
          </small>
        </div>
      </section>

      <section className="stat-grid stat-grid--dashboard">
        <article className="stat-card stat-card--progress">
          <span>Group Stage</span>
          <strong>
            {completedGroupMatches}/{totalGroupMatches}
          </strong>
          <div className="progress-track" aria-label={`Group stage ${groupProgress}% complete`}>
            <div className="progress-fill" style={{ width: `${groupProgress}%` }} />
          </div>
          <small>{groupProgress}% complete</small>
        </article>
        <article className="stat-card stat-card--progress">
          <span>{data.knockoutMatches.length > 0 ? 'Knockout' : 'Direct Path'}</span>
          <strong>{data.knockoutMatches.length > 0 ? `${knockoutProgress}%` : 'Bypass'}</strong>
          <div className="progress-track" aria-label={`Knockout stage ${knockoutProgress}% complete`}>
            <div className="progress-fill progress-fill--gold" style={{ width: `${knockoutProgress}%` }} />
          </div>
          <small>{data.knockoutMatches.length > 0 ? `${data.knockoutMatches.length} matches` : 'Top seeds go straight through'}</small>
        </article>
        <article className="stat-card stat-card--progress">
          <span>{championPlayer ? 'Champion' : 'Final Bracket'}</span>
          <strong>{championPlayer ? formatPlayer(championPlayer) : `${finalProgress}%`}</strong>
          <div className="progress-track" aria-label={`Final bracket ${finalProgress}% complete`}>
            <div className="progress-fill progress-fill--blue" style={{ width: `${finalProgress}%` }} />
          </div>
          <small>{championPlayer ? 'Tournament complete' : `${data.finalStageMatches.length} scheduled matches`}</small>
        </article>
        <article className="stat-card stat-card--spotlight">
          <span>Cut Line Watch</span>
          <strong>{hottestGroup ? hottestGroup.group.name : 'TBD'}</strong>
          <small>
            {hottestGroup?.bubble && hottestGroup?.chaser
              ? `${formatPlayer(getPlayer(data.players, hottestGroup.bubble.playerId))} holds the line; ${formatPlayer(
                  getPlayer(data.players, hottestGroup.chaser.playerId),
                )} is chasing.`
              : `Top ${advancingCount} from each group advance.`}
          </small>
        </article>
      </section>

      <RemainingGroupGames hideWhenEmpty />

      <section className="panel dashboard-control-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Interactive dashboard</p>
            <h3>Group Stage Command Center</h3>
          </div>
          <span>Top {advancingCount} advance from each group</span>
        </div>
        <div className="group-filter" aria-label="Filter dashboard groups">
          <button
            className={selectedGroupId === 'all' ? 'group-filter__button group-filter__button--active' : 'group-filter__button'}
            type="button"
            onClick={() => setSelectedGroupId('all')}
          >
            All Groups
          </button>
          {data.groups.map((group) => (
            <button
              className={selectedGroupId === group.id ? 'group-filter__button group-filter__button--active' : 'group-filter__button'}
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
            >
              {group.name}
            </button>
          ))}
        </div>
      </section>

      <section className="dashboard-groups dashboard-groups--sleek">
        {visibleGroups.map((group) => {
          const standings = computeGroupStandings(group);
          const completed = completedMatches(group.matches);
          const nextMatch = nextGroupMatch(group);
          return (
            <article className="group-summary-card group-summary-card--feature" key={group.id}>
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">{completed === group.matches.length ? 'Locked table' : 'Live table'}</p>
                  <h3>{group.name}</h3>
                </div>
                <span>{completed}/{group.matches.length} matches</span>
              </div>
              <div className="group-card-progress">
                <div className="progress-track" aria-label={`${group.name} ${Math.round((completed / group.matches.length) * 100)}% complete`}>
                  <div className="progress-fill" style={{ width: `${Math.round((completed / group.matches.length) * 100)}%` }} />
                </div>
              </div>
              <div className="rank-table-heading" aria-hidden="true">
                <span>Seed</span>
                <span>Player</span>
                <span>W-L</span>
                <span>GP</span>
                <span>Total</span>
              </div>
              <div className="rank-list">
                {standings.map((row) => (
                  <div
                    className={row.rank > advancingCount ? 'rank-item rank-item--out rank-item--rich' : 'rank-item rank-item--rich'}
                    key={row.playerId}
                  >
                    <span className="rank-badge">{row.rank}</span>
                    <span className="player-name">{formatPlayer(getPlayer(data.players, row.playerId))}</span>
                    <span className="rank-stat">{row.wins}-{row.losses}</span>
                    <span className="rank-stat">{row.played}</span>
                    <span className="rank-stat">{row.totalScore}</span>
                  </div>
                ))}
              </div>
              <div className="next-match-card">
                <span>{nextMatch ? `Next match · Match ${nextMatch.number}` : 'Group complete'}</span>
                <strong>
                  {nextMatch
                    ? `${formatPlayer(getPlayer(data.players, nextMatch.match.player1Id))} vs ${formatPlayer(
                        getPlayer(data.players, nextMatch.match.player2Id),
                      )}`
                    : 'All scorecards are posted'}
                </strong>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel bracket-preview-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Dynamic bracket preview</p>
            <h3>{data.knockoutMatches.length > 0 ? 'Next Knockout Entrants' : 'Final Bracket Entrants'}</h3>
          </div>
          <span>{data.knockoutMatches.length > 0 ? 'Resolved from current standings' : `Top ${advancingCount} per group`}</span>
        </div>
        {data.knockoutMatches.length > 0 ? (
          <div className="matchup-preview-grid">
            {data.knockoutMatches.slice(0, 4).map((match) => (
              <article className="matchup-preview matchup-preview--sleek" key={match.id}>
                <span>Round {match.round}</span>
                <strong>{participantLabel(match.participant1, data)}</strong>
                <em>vs</em>
                <strong>{participantLabel(match.participant2, data)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <div className="matchup-preview-grid">
            {data.groups.flatMap((group) =>
              computeGroupStandings(group)
                .slice(0, advancingCount)
                .map((row) => (
                  <article className="matchup-preview matchup-preview--sleek" key={`${group.id}-${row.playerId}`}>
                    <span>{group.name} seed {row.rank}</span>
                    <strong>{formatPlayer(getPlayer(data.players, row.playerId))}</strong>
                    <em>{row.wins}-{row.losses} · {row.played} GP</em>
                  </article>
                )),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
