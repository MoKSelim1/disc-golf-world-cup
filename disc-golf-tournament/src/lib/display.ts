import type { KnockoutMatch, ParticipantRef, Player, PlayerId, TournamentData } from '../types/tournament';
import { countryFlag } from './countries';
import { computeGroupStandings } from './groupStandings';

export function getPlayer(players: Player[], playerId: PlayerId | null | undefined): Player | null {
  if (!playerId) return null;
  return players.find((player) => player.id === playerId) ?? null;
}

export function formatPlayer(player: Player | null): string {
  if (!player) return 'TBD';
  const flag = countryFlag(player.country);
  if (flag) return `${flag} ${player.name}`;
  return player.country && player.country !== 'TBD' ? `${player.name} (${player.country})` : player.name;
}

function groupSeedPlayer(data: TournamentData, groupId: string, seed: 1 | 2 | 3): Player | null {
  const group = data.groups.find((candidate) => candidate.id === groupId);
  if (!group) return null;
  const row = computeGroupStandings(group).find((standing) => standing.rank === seed);
  return getPlayer(data.players, row?.playerId);
}

function matchWinner(data: TournamentData, matchId: string): Player | null {
  const knockout = data.knockoutMatches.find((match) => match.id === matchId);
  if (knockout) return getPlayer(data.players, knockout.winnerId);
  const final = data.finalStageMatches.find((match) => match.id === matchId);
  return getPlayer(data.players, final?.winnerId);
}

export function participantLabel(ref: ParticipantRef, data: TournamentData): string {
  if (ref.type === 'player') return formatPlayer(getPlayer(data.players, ref.playerId));
  if (ref.type === 'groupWinner') return formatPlayer(groupSeedPlayer(data, ref.groupId, 1));
  if (ref.type === 'groupSeed') return formatPlayer(groupSeedPlayer(data, ref.groupId, ref.seed));
  if (ref.type === 'matchWinner') return formatPlayer(matchWinner(data, ref.matchId));
  return 'TBD';
}

export function scoreText(score: number | null): string {
  if (score === null) return '-';
  if (score > 0) return `+${score}`;
  return String(score);
}

export function knockoutSort(a: KnockoutMatch, b: KnockoutMatch): number {
  if (a.round !== b.round) return a.round - b.round;
  if (a.podIndex !== b.podIndex) return a.podIndex - b.podIndex;
  return a.label.localeCompare(b.label);
}
