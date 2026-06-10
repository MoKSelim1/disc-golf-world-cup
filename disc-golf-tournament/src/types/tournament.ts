export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  country: string;
}

export interface GroupMatch {
  id: string;
  week: 1 | 2 | 3;
  player1Id: PlayerId;
  player2Id: PlayerId;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: PlayerId | null;
}

export interface Group {
  id: string;
  name: string;
  playerIds: PlayerId[];
  matches: GroupMatch[];
}

export interface GroupStandingRow {
  playerId: PlayerId;
  wins: number;
  totalScore: number;
  played: number;
  rank: 1 | 2 | 3 | 4;
}

export type ParticipantRef =
  | { type: 'groupSeed'; groupId: string; seed: 2 | 3 }
  | { type: 'groupWinner'; groupId: string }
  | { type: 'matchWinner'; matchId: string }
  | { type: 'player'; playerId: PlayerId }
  | { type: 'tbd' };

export interface KnockoutMatch {
  id: string;
  round: 1 | 2;
  podIndex: number;
  label: 'A' | 'B' | 'seed1' | 'seed2';
  participant1: ParticipantRef;
  participant2: ParticipantRef;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: PlayerId | null;
}

export type FinalRoundName =
  | 'roundOf16'
  | 'quarterfinal'
  | 'semifinal'
  | 'thirdPlace'
  | 'final';

export interface FinalStageMatch {
  id: string;
  roundName: FinalRoundName;
  roundOrder: number;
  participant1: ParticipantRef;
  participant2: ParticipantRef;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: PlayerId | null;
}

export interface PayoutBreakdown {
  prizePool: number;
  buyIn: number;
  playerCount: number;
  first: number;
  second: number;
  third: number;
  fourth: string;
}

export interface TournamentData {
  schemaVersion: number;
  tournamentName: string;
  buyInAmount: number;
  numGroups: number;
  players: Player[];
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
  finalStageMatches: FinalStageMatch[];
  lastUpdated: string;
}
