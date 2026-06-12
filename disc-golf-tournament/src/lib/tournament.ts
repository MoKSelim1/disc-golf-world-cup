import type { Group, Player, PlayerId, TournamentData, TournamentFormat } from '../types/tournament';
import { generateGroupSchedule, scoreWinner } from './groupStandings';
import { getSeedFromGroup } from './groupStandings';
import { getKnockoutRoundTwoWinners, recomputeKnockoutMatches } from './knockoutBracket';
import { recomputeFinalStageMatches } from './finalStage';

export function createGroups(playerIds: string[], numGroups: number): Group[] {
  const groups = Array.from({ length: numGroups }, () => [] as PlayerId[]);
  playerIds.forEach((playerId, index) => {
    groups[index % numGroups].push(playerId);
  });

  return groups.map((groupPlayerIds, index) => {
    const id = `group-${index + 1}`;
    return {
      id,
      name: `Group ${String.fromCharCode(65 + index)}`,
      playerIds: groupPlayerIds,
      matches: generateGroupSchedule(id, groupPlayerIds),
    };
  });
}

export function tournamentFormat(data: TournamentData): TournamentFormat {
  return data.format ?? 'worldCupTopThree';
}

export function hasTenPlayerPlayIn(data: TournamentData): boolean {
  return data.players.length === 10 && data.groups.length === 2;
}

export function advancingPerGroup(data: TournamentData): number {
  if (hasTenPlayerPlayIn(data)) return 3;
  return tournamentFormat(data) === 'groupTopTwoFinal' ? 2 : 3;
}

function groupSeedEntrants(groups: Group[], seedCount: number): PlayerId[] {
  return groups.flatMap((group) =>
    Array.from({ length: seedCount }, (_, index) => getSeedFromGroup(group, index + 1)).filter(
      (playerId): playerId is PlayerId => Boolean(playerId),
    ),
  );
}

export function recomputeTournament(data: TournamentData): TournamentData {
  const groups = data.groups.map((group) => ({
    ...group,
    matches: group.matches.map((match) => ({
      ...match,
      winnerId: scoreWinner(match.player1Id, match.player2Id, match.player1Score, match.player2Score),
    })),
  }));

  const format = tournamentFormat(data);
  const usesKnockoutPlayIn = format === 'worldCupTopThree' || hasTenPlayerPlayIn({ ...data, groups });
  const knockoutMatches = usesKnockoutPlayIn ? recomputeKnockoutMatches(groups, data.knockoutMatches) : [];
  const finalEntrants = usesKnockoutPlayIn ? getKnockoutRoundTwoWinners(knockoutMatches) : groupSeedEntrants(groups, 2);
  const expectedFinalEntrants = usesKnockoutPlayIn
    ? knockoutMatches.filter((match) => match.round === 2).length
    : groups.length * 2;
  const finalStageMatches = recomputeFinalStageMatches(
    finalEntrants,
    data.finalStageMatches,
    expectedFinalEntrants,
  );

  return { ...data, format, groups, knockoutMatches, finalStageMatches };
}

export function regenerateStructure(data: TournamentData, numGroups: number): TournamentData {
  if (numGroups < 1) return data;
  const playerIds = data.players.map((player) => player.id);
  const groups = createGroups(playerIds, numGroups);
  return recomputeTournament({
    ...data,
    numGroups,
    groups,
    knockoutMatches: [],
    finalStageMatches: [],
  });
}

export function recommendGroupCount(playerCount: number): number {
  if (playerCount <= 5) return 1;
  if (playerCount <= 10) return 2;
  if (playerCount <= 24) return 4;
  return 8;
}

export function createPlayers(playerCount: number): Player[] {
  return Array.from({ length: playerCount }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Player ${index + 1}`,
    country: 'TBD',
  }));
}

export function createTournamentData(opts: {
  id: string;
  name: string;
  buyInAmount: number;
  playerCount: number;
}): TournamentData {
  const players = createPlayers(opts.playerCount);
  const numGroups = recommendGroupCount(opts.playerCount);
  return recomputeTournament({
    schemaVersion: 2,
    tournamentId: opts.id,
    tournamentName: opts.name,
    format: 'groupTopTwoFinal',
    buyInAmount: opts.buyInAmount,
    numGroups,
    players,
    groups: createGroups(
      players.map((player) => player.id),
      numGroups,
    ),
    knockoutMatches: [],
    finalStageMatches: [],
    lastUpdated: new Date().toISOString(),
  });
}
