import type { FinalRoundName, FinalStageMatch, PlayerId } from '../types/tournament';
import { scoreWinner } from './groupStandings';

function mainRoundName(entrantCount: number, roundIndex: number, totalRounds: number): FinalRoundName {
  if (roundIndex === totalRounds - 1) return 'final';
  if (roundIndex === totalRounds - 2) return 'semifinal';
  if (roundIndex === totalRounds - 3) return 'quarterfinal';
  return 'roundOf16';
}

function roundsForEntrants(entrantCount: number): number {
  return Math.max(1, Math.ceil(Math.log2(Math.max(2, entrantCount))));
}

export function generateFinalStageMatches(entrantCount: number): FinalStageMatch[] {
  const totalRounds = roundsForEntrants(entrantCount);
  const matches: FinalStageMatch[] = [];
  let matchesInRound = Math.max(1, Math.ceil(entrantCount / 2));

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    for (let order = 0; order < matchesInRound; order += 1) {
      const id = roundIndex === totalRounds - 1 ? 'final-final' : `final-r${roundIndex + 1}-m${order}`;
      matches.push({
        id,
        roundName: mainRoundName(entrantCount, roundIndex, totalRounds),
        roundOrder: order,
        participant1: { type: 'tbd' },
        participant2: { type: 'tbd' },
        player1Score: null,
        player2Score: null,
        winnerId: null,
      });
    }
    matchesInRound = Math.max(1, Math.ceil(matchesInRound / 2));
  }

  if (entrantCount >= 4) {
    matches.push({
      id: 'final-3rd',
      roundName: 'thirdPlace',
      roundOrder: 0,
      participant1: { type: 'tbd' },
      participant2: { type: 'tbd' },
      player1Score: null,
      player2Score: null,
      winnerId: null,
    });
  }

  return matches;
}

function loserOf(match: FinalStageMatch): PlayerId | null {
  if (!match.winnerId || match.player1Score === null || match.player2Score === null) return null;
  const p1 = match.participant1.type === 'player' ? match.participant1.playerId : null;
  const p2 = match.participant2.type === 'player' ? match.participant2.playerId : null;
  if (!p1 || !p2) return null;
  return match.winnerId === p1 ? p2 : p1;
}

export function recomputeFinalStageMatches(
  entrants: PlayerId[],
  existingMatches: FinalStageMatch[],
  expectedEntrantCount = 4,
): FinalStageMatch[] {
  const entrantCount = Math.max(2, entrants.length, expectedEntrantCount);
  const skeleton = generateFinalStageMatches(entrantCount);
  const byId = new Map(existingMatches.map((match) => [match.id, match]));
  const matches = skeleton.map((match) => {
    const previous = byId.get(match.id);
    return {
      ...match,
      player1Score: previous?.player1Score ?? null,
      player2Score: previous?.player2Score ?? null,
    };
  });

  const mainRounds = Array.from(new Set(matches.filter((match) => match.roundName !== 'thirdPlace').map((match) => match.roundName)));
  let currentEntrants = entrants;

  for (const roundName of mainRounds) {
    const roundMatches = matches.filter((match) => match.roundName === roundName);

    roundMatches.forEach((match, index) => {
      const player1Id = currentEntrants[index * 2] ?? null;
      const player2Id = currentEntrants[index * 2 + 1] ?? null;
      match.participant1 = player1Id ? { type: 'player', playerId: player1Id } : { type: 'tbd' };
      match.participant2 = player2Id ? { type: 'player', playerId: player2Id } : { type: 'tbd' };
      match.winnerId =
        player1Id && player2Id
          ? scoreWinner(player1Id, player2Id, match.player1Score, match.player2Score)
          : null;
    });

    currentEntrants = roundMatches
      .map((match) => match.winnerId)
      .filter((playerId): playerId is PlayerId => Boolean(playerId));
  }

  const semifinals = matches.filter((match) => match.roundName === 'semifinal');
  const thirdPlace = matches.find((match) => match.roundName === 'thirdPlace');
  if (thirdPlace && semifinals.length === 2) {
    const player1Id = loserOf(semifinals[0]);
    const player2Id = loserOf(semifinals[1]);
    thirdPlace.participant1 = player1Id ? { type: 'player', playerId: player1Id } : { type: 'tbd' };
    thirdPlace.participant2 = player2Id ? { type: 'player', playerId: player2Id } : { type: 'tbd' };
    thirdPlace.winnerId =
      player1Id && player2Id
        ? scoreWinner(player1Id, player2Id, thirdPlace.player1Score, thirdPlace.player2Score)
        : null;
  }

  return matches;
}
