export type PlayerId = string;

export interface Player {
  id: PlayerId;
  name: string;
  country: string;
}

export interface GroupMatch {
  id: string;
  week: number;
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
  losses: number;
  totalScore: number;
  played: number;
  rank: number;
}

export type ParticipantRef =
  | { type: 'groupSeed'; groupId: string; seed: number }
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

export type TournamentFormat = 'worldCupTopThree' | 'groupTopTwoFinal';

export interface TournamentData {
  schemaVersion: number;
  tournamentId?: string;
  tournamentName: string;
  format?: TournamentFormat;
  buyInAmount: number;
  numGroups: number;
  players: Player[];
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
  finalStageMatches: FinalStageMatch[];
  rulesMarkdown?: string;
  lastUpdated: string;
}

export type TournamentStatus = 'active' | 'upcoming' | 'complete';

export interface TournamentSummary {
  id: string;
  name: string;
  status: TournamentStatus;
  dataPath: string;
  format: TournamentFormat;
  playerCount: number;
  lastUpdated: string;
}

export interface TournamentIndex {
  schemaVersion: number;
  activeTournamentId: string;
  tournaments: TournamentSummary[];
  lastUpdated: string;
}
