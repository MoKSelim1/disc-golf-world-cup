import type { Group, KnockoutMatch, ParticipantRef, PlayerId } from '../types/tournament';
import { getSeedFromGroup, scoreWinner } from './groupStandings';

function groupRef(groups: Group[], index: number, seed: 1 | 2 | 3): ParticipantRef {
  const group = groups[index];
  if (!group) return { type: 'tbd' };
  return seed === 1
    ? { type: 'groupWinner', groupId: group.id }
    : { type: 'groupSeed', groupId: group.id, seed };
}

function playerRef(playerId: PlayerId | null): ParticipantRef {
  return playerId ? { type: 'player', playerId } : { type: 'tbd' };
}

function hasScores(match: KnockoutMatch): boolean {
  return match.player1Score !== null && match.player2Score !== null;
}

export interface KnockoutBracketOptions {
  // With two pods, each pod's round-1 "a"/"b" qualifiers normally feed their
  // own pod's seed1 slot and the other pod's seed2 slot. This swaps those two
  // destinations so round 2 pairs each group's seed1 against its own seed2's
  // qualifier path, instead of crossing pods.
  swapRoundTwoFeeds?: boolean;
}

export function generateKnockoutMatches(
  groups: Group[],
  options: KnockoutBracketOptions = {},
): KnockoutMatch[] {
  const numPods = groups.length / 2;
  const matches: KnockoutMatch[] = [];

  for (let podIndex = 0; podIndex < numPods; podIndex += 1) {
    const leftIndex = podIndex;
    const rightIndex = groups.length - 1 - podIndex;

    matches.push({
      id: `ko-r1-pod${podIndex}-a`,
      round: 1,
      podIndex,
      label: 'A',
      participant1: groupRef(groups, leftIndex, 2),
      participant2: groupRef(groups, rightIndex, 3),
      player1Score: null,
      player2Score: null,
      winnerId: null,
    });

    matches.push({
      id: `ko-r1-pod${podIndex}-b`,
      round: 1,
      podIndex,
      label: 'B',
      participant1: groupRef(groups, rightIndex, 2),
      participant2: groupRef(groups, leftIndex, 3),
      player1Score: null,
      player2Score: null,
      winnerId: null,
    });
  }

  const swap = Boolean(options.swapRoundTwoFeeds) && numPods === 2;

  for (let podIndex = 0; podIndex < numPods; podIndex += 1) {
    // Keep the completed Round 1 weak-group pairings intact, but route each
    // qualifier winner to the corrected group-winner path for the next round.
    // With four groups this yields: A vs Match 1, B vs Match 3,
    // C vs Match 2, and D vs Match 4. When `swap` is set, pod 1's "a" and "b"
    // qualifiers trade destinations so each pod's seed1 faces its own pod's
    // seed2 qualifier path instead of crossing into the other pod.
    const seed1MatchId = swap && podIndex === 1 ? `ko-r1-pod${podIndex}-b` : `ko-r1-pod${podIndex}-a`;
    const seed2MatchId =
      swap && podIndex === 0
        ? `ko-r1-pod${numPods - 1 - podIndex}-a`
        : `ko-r1-pod${numPods - 1 - podIndex}-b`;

    matches.push({
      id: `ko-r2-pod${podIndex}-seed1`,
      round: 2,
      podIndex,
      label: 'seed1',
      participant1: groupRef(groups, podIndex * 2, 1),
      participant2: { type: 'matchWinner', matchId: seed1MatchId },
      player1Score: null,
      player2Score: null,
      winnerId: null,
    });

    matches.push({
      id: `ko-r2-pod${podIndex}-seed2`,
      round: 2,
      podIndex,
      label: 'seed2',
      participant1: groupRef(groups, podIndex * 2 + 1, 1),
      participant2: { type: 'matchWinner', matchId: seed2MatchId },
      player1Score: null,
      player2Score: null,
      winnerId: null,
    });
  }

  return matches;
}

export function resolveParticipant(
  ref: ParticipantRef,
  groups: Group[],
  knockoutMatches: KnockoutMatch[],
): PlayerId | null {
  if (ref.type === 'player') return ref.playerId;
  if (ref.type === 'tbd') return null;

  if (ref.type === 'matchWinner') {
    return knockoutMatches.find((match) => match.id === ref.matchId)?.winnerId ?? null;
  }

  const group = groups.find((candidate) => candidate.id === ref.groupId);
  if (!group) return null;

  if (ref.type === 'groupWinner') return getSeedFromGroup(group, 1);
  return getSeedFromGroup(group, ref.seed);
}

export function recomputeKnockoutMatches(
  groups: Group[],
  existingMatches: KnockoutMatch[],
  options: KnockoutBracketOptions = {},
): KnockoutMatch[] {
  const skeleton = generateKnockoutMatches(groups, options);
  const recomputed: KnockoutMatch[] = [];

  skeleton.forEach((match) => {
    const previous = existingMatches.find((candidate) => candidate.id === match.id);
    const player1Score = previous?.player1Score ?? null;
    const player2Score = previous?.player2Score ?? null;

    if (previous && previous.round === 1 && hasScores(previous)) {
      const previousPlayer1Id = resolveParticipant(previous.participant1, groups, existingMatches);
      const previousPlayer2Id = resolveParticipant(previous.participant2, groups, existingMatches);

      recomputed.push({
        ...previous,
        participant1: playerRef(previousPlayer1Id),
        participant2: playerRef(previousPlayer2Id),
        winnerId:
          previousPlayer1Id && previousPlayer2Id
            ? scoreWinner(previousPlayer1Id, previousPlayer2Id, player1Score, player2Score)
            : previous.winnerId,
      });
      return;
    }

    const player1Id = resolveParticipant(match.participant1, groups, recomputed);
    const player2Id = resolveParticipant(match.participant2, groups, recomputed);

    recomputed.push({
      ...match,
      player1Score,
      player2Score,
      winnerId:
        player1Id && player2Id
          ? scoreWinner(player1Id, player2Id, player1Score, player2Score)
          : null,
    });
  });

  return recomputed;
}

export interface RoundTwoOrderOptions {
  // Pairs each pod's seed1 winner against the OTHER pod's seed2 winner (and
  // vice versa) for the next round, instead of each pod's own two winners
  // meeting each other. Mirrors the men's-only round 2 feed swap above so the
  // next round's matchups line up with each match's actual qualifier feed.
  crossPodSemis?: boolean;
}

export function orderRoundTwoMatches(
  matches: KnockoutMatch[],
  options: RoundTwoOrderOptions = {},
): KnockoutMatch[] {
  const sorted = matches
    .filter((match) => match.round === 2)
    .sort((a, b) => {
      if (a.podIndex !== b.podIndex) return a.podIndex - b.podIndex;
      return a.label === 'seed1' ? -1 : 1;
    });

  if (options.crossPodSemis && sorted.length === 4) {
    // sorted = [pod0seed1, pod0seed2, pod1seed1, pod1seed2]
    return [sorted[0], sorted[3], sorted[1], sorted[2]];
  }

  return sorted;
}

export function getKnockoutRoundTwoWinners(
  matches: KnockoutMatch[],
  options: RoundTwoOrderOptions = {},
): PlayerId[] {
  return orderRoundTwoMatches(matches, options)
    .map((match) => match.winnerId)
    .filter((playerId): playerId is PlayerId => Boolean(playerId));
}
