import type { Group, GroupMatch, GroupStandingRow, PlayerId } from '../types/tournament';

export function scoreWinner(
  player1Id: PlayerId,
  player2Id: PlayerId,
  player1Score: number | null,
  player2Score: number | null,
): PlayerId | null {
  if (player1Score === null || player2Score === null) return null;
  if (player1Score === player2Score) return null;
  return player1Score < player2Score ? player1Id : player2Id;
}

export function generateGroupSchedule(groupId: string, playerIds: PlayerId[]): GroupMatch[] {
  const [p1, p2, p3, p4] = playerIds;
  const pairings: Array<[1 | 2 | 3, PlayerId, PlayerId]> = [
    [1, p1, p2],
    [1, p3, p4],
    [2, p1, p3],
    [2, p2, p4],
    [3, p1, p4],
    [3, p2, p3],
  ];

  return pairings.map(([week, player1Id, player2Id], index) => ({
    id: `${groupId}-w${week}-m${(index % 2) + 1}`,
    week,
    player1Id,
    player2Id,
    player1Score: null,
    player2Score: null,
    winnerId: null,
  }));
}

export function computeGroupStandings(group: Group): GroupStandingRow[] {
  const rows = new Map<PlayerId, Omit<GroupStandingRow, 'rank'>>();

  group.playerIds.forEach((playerId) => {
    rows.set(playerId, { playerId, wins: 0, totalScore: 0, played: 0 });
  });

  group.matches.forEach((match) => {
    if (match.player1Score === null || match.player2Score === null) return;

    const player1 = rows.get(match.player1Id);
    const player2 = rows.get(match.player2Id);
    if (!player1 || !player2) return;

    player1.totalScore += match.player1Score;
    player2.totalScore += match.player2Score;
    player1.played += 1;
    player2.played += 1;

    const winnerId = scoreWinner(
      match.player1Id,
      match.player2Id,
      match.player1Score,
      match.player2Score,
    );
    if (winnerId) rows.get(winnerId)!.wins += 1;
  });

  return Array.from(rows.values())
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore;
      return group.playerIds.indexOf(a.playerId) - group.playerIds.indexOf(b.playerId);
    })
    .map((row, index) => ({ ...row, rank: (index + 1) as 1 | 2 | 3 | 4 }));
}

export function getSeedFromGroup(group: Group, seed: 1 | 2 | 3): PlayerId | null {
  const row = computeGroupStandings(group).find((standing) => standing.rank === seed);
  return row?.playerId ?? null;
}
