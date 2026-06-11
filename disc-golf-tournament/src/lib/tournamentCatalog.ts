import type { TournamentData, TournamentIndex, TournamentStatus, TournamentSummary } from '../types/tournament';

export const TOURNAMENT_INDEX_PUBLIC_PATH = 'data/tournaments/index.json';
export const LEGACY_TOURNAMENT_PUBLIC_PATH = 'data/tournament.json';
export const LEGACY_TOURNAMENT_ID = 'disc-golf-world-cup-2026';

export function isTournamentData(value: unknown): value is TournamentData {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'players' in value &&
      'groups' in value &&
      'tournamentName' in value,
  );
}

export function isTournamentIndex(value: unknown): value is TournamentIndex {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'activeTournamentId' in value &&
      'tournaments' in value &&
      Array.isArray((value as TournamentIndex).tournaments),
  );
}

export function publicPathToRepoPath(path: string): string {
  return `disc-golf-tournament/public/${path.replace(/^\/+/, '')}`;
}

export function repoPathToPublicPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '');
  const prefix = 'disc-golf-tournament/public/';
  if (!normalized.startsWith(prefix)) return null;
  return normalized.slice(prefix.length);
}

export function tournamentDataPath(id: string): string {
  return `data/tournaments/${id}.json`;
}

export function sanitizeTournamentId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || `tournament-${Date.now()}`;
}

export function summarizeTournament(
  data: TournamentData,
  dataPath: string,
  status: TournamentStatus = 'active',
): TournamentSummary {
  return {
    id: data.tournamentId ?? LEGACY_TOURNAMENT_ID,
    name: data.tournamentName,
    status,
    dataPath,
    format: data.format ?? 'worldCupTopThree',
    playerCount: data.players.length,
    lastUpdated: data.lastUpdated,
  };
}

export function buildLegacyIndex(data: TournamentData): TournamentIndex {
  return {
    schemaVersion: 2,
    activeTournamentId: data.tournamentId ?? LEGACY_TOURNAMENT_ID,
    tournaments: [summarizeTournament(data, LEGACY_TOURNAMENT_PUBLIC_PATH, 'active')],
    lastUpdated: data.lastUpdated,
  };
}

export function updateIndexSummary(index: TournamentIndex, summary: TournamentSummary, lastUpdated = new Date().toISOString()): TournamentIndex {
  const tournaments = index.tournaments.some((item) => item.id === summary.id)
    ? index.tournaments.map((item) => (item.id === summary.id ? summary : item))
    : [...index.tournaments, summary];

  return {
    ...index,
    activeTournamentId: summary.id,
    tournaments,
    lastUpdated,
  };
}
