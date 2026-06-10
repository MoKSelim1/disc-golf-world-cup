import type { Group, TournamentData } from '../types/tournament';
import { generateGroupSchedule, scoreWinner } from './groupStandings';
import { getKnockoutRoundTwoWinners, recomputeKnockoutMatches } from './knockoutBracket';
import { recomputeFinalStageMatches } from './finalStage';

export function createGroups(playerIds: string[], numGroups: number): Group[] {
  return Array.from({ length: numGroups }, (_, index) => {
    const id = `group-${index + 1}`;
    const groupPlayerIds = playerIds.slice(index * 4, index * 4 + 4);
    return {
      id,
      name: `Group ${String.fromCharCode(65 + index)}`,
      playerIds: groupPlayerIds,
      matches: generateGroupSchedule(id, groupPlayerIds),
    };
  });
}

export function recomputeTournament(data: TournamentData): TournamentData {
  const groups = data.groups.map((group) => ({
    ...group,
    matches: group.matches.map((match) => ({
      ...match,
      winnerId: scoreWinner(match.player1Id, match.player2Id, match.player1Score, match.player2Score),
    })),
  }));

  const knockoutMatches = recomputeKnockoutMatches(groups, data.knockoutMatches);
  const finalEntrants = getKnockoutRoundTwoWinners(knockoutMatches);
  const finalStageMatches = recomputeFinalStageMatches(finalEntrants, data.finalStageMatches);

  return { ...data, groups, knockoutMatches, finalStageMatches };
}

export function regenerateStructure(data: TournamentData, numGroups: number): TournamentData {
  if (numGroups < 2 || numGroups % 2 !== 0) return data;
  const playerIds = data.players.slice(0, numGroups * 4).map((player) => player.id);
  const groups = createGroups(playerIds, numGroups);
  return recomputeTournament({
    ...data,
    numGroups,
    groups,
    knockoutMatches: [],
    finalStageMatches: [],
  });
}
