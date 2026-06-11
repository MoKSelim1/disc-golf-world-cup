import { createContext, useCallback, useContext, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import type {
  FinalStageMatch,
  GroupMatch,
  KnockoutMatch,
  Player,
  TournamentData,
  TournamentIndex,
  TournamentSummary,
} from '../types/tournament';
import { seedTournament } from '../data/seedTournament';
import { createTournamentData, recomputeTournament } from '../lib/tournament';
import {
  buildLegacyIndex,
  isTournamentData,
  sanitizeTournamentId,
  summarizeTournament,
  tournamentDataPath,
  updateIndexSummary,
} from '../lib/tournamentCatalog';

type TournamentAction =
  | { type: 'SET_INITIAL_DATA'; data: TournamentData }
  | { type: 'UPDATE_PLAYER'; player: Player }
  | { type: 'UPDATE_GROUP_SCORE'; matchId: string; player1Score: number | null; player2Score: number | null }
  | { type: 'UPDATE_KNOCKOUT_SCORE'; matchId: string; player1Score: number | null; player2Score: number | null }
  | { type: 'UPDATE_FINAL_SCORE'; matchId: string; player1Score: number | null; player2Score: number | null };

interface TournamentContextValue {
  data: TournamentData;
  tournamentIndex: TournamentIndex;
  activeTournament: TournamentSummary;
  isAdmin: boolean;
  hasUnpublishedChanges: boolean;
  setIsAdmin: (value: boolean) => void;
  setInitialTournament: (index: TournamentIndex, data: TournamentData, activeTournament: TournamentSummary) => void;
  selectTournament: (id: string) => Promise<void>;
  createTournament: (opts: { name: string; playerCount: number; buyInAmount: number }) => void;
  replaceTournamentIndex: (index: TournamentIndex, activeTournament: TournamentSummary) => void;
  markPublished: () => void;
  dispatch: Dispatch<TournamentAction>;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

function updateScores<T extends GroupMatch | KnockoutMatch | FinalStageMatch>(
  matches: T[],
  matchId: string,
  player1Score: number | null,
  player2Score: number | null,
): T[] {
  return matches.map((match) =>
    match.id === matchId ? { ...match, player1Score, player2Score } : match,
  );
}

function reducer(state: TournamentData, action: TournamentAction): TournamentData {
  switch (action.type) {
    case 'SET_INITIAL_DATA':
      return recomputeTournament(action.data);
    case 'UPDATE_PLAYER':
      return {
        ...state,
        players: state.players.map((player) =>
          player.id === action.player.id ? action.player : player,
        ),
      };
    case 'UPDATE_GROUP_SCORE':
      return recomputeTournament({
        ...state,
        groups: state.groups.map((group) => ({
          ...group,
          matches: updateScores(group.matches, action.matchId, action.player1Score, action.player2Score),
        })),
      });
    case 'UPDATE_KNOCKOUT_SCORE':
      return recomputeTournament({
        ...state,
        knockoutMatches: updateScores(state.knockoutMatches, action.matchId, action.player1Score, action.player2Score),
      });
    case 'UPDATE_FINAL_SCORE':
      return recomputeTournament({
        ...state,
        finalStageMatches: updateScores(state.finalStageMatches, action.matchId, action.player1Score, action.player2Score),
      });
    default:
      return state;
  }
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [data, baseDispatch] = useReducer(reducer, seedTournament);
  const [tournamentIndex, setTournamentIndex] = useState<TournamentIndex>(() => buildLegacyIndex(seedTournament));
  const [activeTournament, setActiveTournament] = useState<TournamentSummary>(() => buildLegacyIndex(seedTournament).tournaments[0]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  const dispatch: Dispatch<TournamentAction> = useCallback((action) => {
    baseDispatch(action);
    if (action.type !== 'SET_INITIAL_DATA') setHasUnpublishedChanges(true);
  }, []);

  const setInitialTournament = useCallback(
    (index: TournamentIndex, incomingData: TournamentData, incomingActiveTournament: TournamentSummary) => {
      setTournamentIndex(index);
      setActiveTournament(incomingActiveTournament);
      baseDispatch({ type: 'SET_INITIAL_DATA', data: { ...incomingData, tournamentId: incomingActiveTournament.id } });
      setHasUnpublishedChanges(false);
    },
    [],
  );

  const selectTournament = useCallback(
    async (id: string) => {
      const summary = tournamentIndex.tournaments.find((item) => item.id === id);
      if (!summary) return;

      const response = await fetch(summary.dataPath, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load tournament (${response.status}).`);
      const json = await response.json();
      if (!isTournamentData(json)) throw new Error('Tournament data file is invalid.');

      setActiveTournament(summary);
      baseDispatch({ type: 'SET_INITIAL_DATA', data: { ...json, tournamentId: summary.id } });
      setHasUnpublishedChanges(false);

      const url = new URL(window.location.href);
      url.searchParams.set('tournament', summary.id);
      window.history.replaceState({}, '', url);
    },
    [tournamentIndex],
  );

  const createTournament = useCallback(
    (opts: { name: string; playerCount: number; buyInAmount: number }) => {
      const baseId = sanitizeTournamentId(opts.name);
      const existingIds = new Set(tournamentIndex.tournaments.map((item) => item.id));
      let id = baseId;
      let suffix = 2;
      while (existingIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }

      const newData = createTournamentData({ id, ...opts });
      const summary = summarizeTournament(newData, tournamentDataPath(id), 'upcoming');
      const nextIndex = updateIndexSummary(tournamentIndex, summary);

      setTournamentIndex(nextIndex);
      setActiveTournament(summary);
      baseDispatch({ type: 'SET_INITIAL_DATA', data: newData });
      setHasUnpublishedChanges(true);

      const url = new URL(window.location.href);
      url.searchParams.set('tournament', id);
      window.history.replaceState({}, '', url);
    },
    [tournamentIndex],
  );

  const replaceTournamentIndex = useCallback((index: TournamentIndex, incomingActiveTournament: TournamentSummary) => {
    setTournamentIndex(index);
    setActiveTournament(incomingActiveTournament);
  }, []);

  const value = useMemo(
    () => ({
      data,
      tournamentIndex,
      activeTournament,
      isAdmin,
      hasUnpublishedChanges,
      setIsAdmin,
      setInitialTournament,
      selectTournament,
      createTournament,
      replaceTournamentIndex,
      markPublished: () => setHasUnpublishedChanges(false),
      dispatch,
    }),
    [
      activeTournament,
      createTournament,
      data,
      dispatch,
      hasUnpublishedChanges,
      isAdmin,
      replaceTournamentIndex,
      selectTournament,
      setInitialTournament,
      tournamentIndex,
    ],
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const value = useContext(TournamentContext);
  if (!value) throw new Error('useTournament must be used within TournamentProvider');
  return value;
}
