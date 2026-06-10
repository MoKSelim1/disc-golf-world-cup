import type { PayoutBreakdown } from '../types/tournament';

export function computePayout(playerCount: number, buyIn: number): PayoutBreakdown {
  const prizePool = playerCount * buyIn;
  return {
    prizePool,
    buyIn,
    playerCount,
    first: Math.round(prizePool * 0.5),
    second: Math.round(prizePool * 0.3),
    third: Math.round(prizePool * 0.2),
    fourth: '1 free disc',
  };
}
