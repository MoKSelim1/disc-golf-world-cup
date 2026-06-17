import { useTournament } from '../../context/TournamentContext';
import { computeGroupStandings } from '../../lib/groupStandings';
import { formatPlayer, getPlayer } from '../../lib/display';
import { advancingPerGroup, hasTenPlayerPlayIn, tournamentFormat } from '../../lib/tournament';
import type { Group, GroupMatch, PlayerId, TournamentData } from '../../types/tournament';

interface RemainingGroupGamesProps {
  hideWhenEmpty?: boolean;
}

function matchNumber(group: Group, match: GroupMatch): number {
  return group.matches.findIndex((candidate) => candidate.id === match.id) + 1;
}

function otherPlayerId(match: GroupMatch, playerId: PlayerId): PlayerId {
  return match.player1Id === playerId ? match.player2Id : match.player1Id;
}

function wouldLossEliminate(group: Group, match: GroupMatch, playerId: PlayerId, advancingCount: number): boolean {
  if (advancingCount >= group.playerIds.length) return false;

  const standings = computeGroupStandings(group);
  const winsByPlayer = new Map(standings.map((row) => [row.playerId, row.wins]));
  const futureWinsAvailable = group.matches.filter(
    (candidate) =>
      !candidate.winnerId &&
      candidate.id !== match.id &&
      (candidate.player1Id === playerId || candidate.player2Id === playerId),
  ).length;
  const maxWinsAfterLoss = (winsByPlayer.get(playerId) ?? 0) + futureWinsAvailable;
  const opponentId = otherPlayerId(match, playerId);
  const playersAlreadyClear = group.playerIds.filter((candidateId) => {
    if (candidateId === playerId) return false;
    const projectedWins = (winsByPlayer.get(candidateId) ?? 0) + (candidateId === opponentId ? 1 : 0);
    return projectedWins > maxWinsAfterLoss;
  }).length;

  return playersAlreadyClear >= advancingCount;
}

function winnerEarnsBye(group: Group, match: GroupMatch, playerId: PlayerId): boolean {
  const remainingAfterMatch = group.matches.filter((candidate) => !candidate.winnerId && candidate.id !== match.id).length;
  if (remainingAfterMatch > 0) return false;

  const winsByPlayer = new Map(computeGroupStandings(group).map((row) => [row.playerId, row.wins]));
  const projectedWinnerWins = (winsByPlayer.get(playerId) ?? 0) + 1;
  return group.playerIds
    .filter((candidateId) => candidateId !== playerId)
    .every((candidateId) => (winsByPlayer.get(candidateId) ?? 0) < projectedWinnerWins);
}

function byeRaceApplies(group: Group, match: GroupMatch): boolean {
  const standings = computeGroupStandings(group);
  const leaderWins = standings[0]?.wins ?? 0;
  return [match.player1Id, match.player2Id].some((playerId) => {
    const playerWins = standings.find((row) => row.playerId === playerId)?.wins ?? 0;
    return playerWins + 1 >= leaderWins;
  });
}

function cutLineSwingApplies(group: Group, match: GroupMatch, advancingCount: number): boolean {
  if (advancingCount >= group.playerIds.length) return false;

  const standings = computeGroupStandings(group);
  const cutWins = standings[advancingCount - 1]?.wins ?? 0;
  return [match.player1Id, match.player2Id].some((playerId) => {
    const row = standings.find((standing) => standing.playerId === playerId);
    return Boolean(row && row.rank > advancingCount && row.wins + 1 >= cutWins);
  });
}

function stakeLabels(data: TournamentData, group: Group, match: GroupMatch): string[] {
  const needsDecision =
    match.player1Score !== null &&
    match.player2Score !== null &&
    match.player1Score === match.player2Score;
  if (needsDecision) return ['Tie needs decision'];

  const labels: string[] = [];
  const advancingCount = advancingPerGroup(data);
  const usesByePath = tournamentFormat(data) === 'worldCupTopThree' || hasTenPlayerPlayIn(data);
  const loserCanBeEliminated =
    wouldLossEliminate(group, match, match.player1Id, advancingCount) ||
    wouldLossEliminate(group, match, match.player2Id, advancingCount);

  if (
    usesByePath &&
    (winnerEarnsBye(group, match, match.player1Id) || winnerEarnsBye(group, match, match.player2Id))
  ) {
    labels.push('Winner earns bye');
  } else if (usesByePath && byeRaceApplies(group, match)) {
    labels.push('Bye race');
  }

  if (loserCanBeEliminated) {
    labels.push('Loser eliminated');
  } else if (cutLineSwingApplies(group, match, advancingCount)) {
    labels.push('Cut-line swing');
  }

  return labels.length > 0 ? labels : ['🥱 Low-stakes round'];
}

function stakeChipClass(label: string): string {
  const normalizedLabel = label.toLowerCase();
  if (normalizedLabel.includes('eliminated') || normalizedLabel.includes('tie')) return 'stakes-chip stakes-chip--danger';
  if (normalizedLabel.includes('bye')) return 'stakes-chip stakes-chip--gold';
  return 'stakes-chip';
}

export function RemainingGroupGames({ hideWhenEmpty = false }: RemainingGroupGamesProps) {
  const { data } = useTournament();
  const pendingGroups = data.groups
    .map((group) => ({
      group,
      entries: group.matches.filter((match) => !match.winnerId).sort((a, b) => a.week - b.week || a.id.localeCompare(b.id)),
    }))
    .filter((entry) => entry.entries.length > 0);

  if (hideWhenEmpty && pendingGroups.length === 0) return null;

  return (
    <section className="panel" id="remaining-group-games">
      <div className="panel-heading">
        <h2>Remaining group games</h2>
        <span>Unplayed matchups and unresolved ties, grouped by group with stakes called out</span>
      </div>
      {pendingGroups.length > 0 ? (
        <div className="pending-group-list">
          {pendingGroups.map(({ group, entries }) => (
            <div className="pending-group" key={group.id}>
              <h3>{group.name}</h3>
              <div className="pending-match-list">
                {entries.map((match) => {
                  const labels = stakeLabels(data, group, match);

                  return (
                    <div className="pending-match" key={match.id}>
                      <span>Match {matchNumber(group, match)}</span>
                      <strong>
                        {formatPlayer(getPlayer(data.players, match.player1Id))} vs{' '}
                        {formatPlayer(getPlayer(data.players, match.player2Id))}
                      </strong>
                      <div className="stakes-list" aria-label="Match stakes">
                        {labels.map((label) => (
                          <em
                            className={stakeChipClass(label)}
                            key={label}
                          >
                            {label}
                          </em>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="panel-note">All group-stage games are resolved.</p>
      )}
    </section>
  );
}
