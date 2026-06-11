import type { TournamentData } from '../types/tournament';
import { createGroups, recomputeTournament } from '../lib/tournament';

const players = Array.from({ length: 16 }, (_, index) => ({
  id: `p${index + 1}`,
  name: `Player ${index + 1}`,
  country: 'TBD',
}));

const baseSeed: TournamentData = {
  schemaVersion: 1,
  tournamentId: 'disc-golf-world-cup-2026',
  tournamentName: 'Disc Golf World Cup',
  format: 'worldCupTopThree',
  buyInAmount: 30,
  numGroups: 4,
  players,
  groups: createGroups(
    players.map((player) => player.id),
    4,
  ),
  knockoutMatches: [],
  finalStageMatches: [],
  lastUpdated: '2026-06-10T12:00:00.000Z',
};

export const seedTournament: TournamentData = recomputeTournament(baseSeed);
