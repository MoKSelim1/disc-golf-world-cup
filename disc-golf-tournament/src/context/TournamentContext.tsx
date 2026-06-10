import { createContext, useCallback, useContext, useMemo, useReducer, useState, type Dispatch, type ReactNode } from 'react';
import type { FinalStageMatch, GroupMatch, KnockoutMatch, Player, TournamentData } from '../types/tournament';
import { seedTournament } from '../data/seedTournament';
import { recomputeTournament } from '../lib/tournament';

type TournamentAction =
  | { type: 'SET_INITIAL_DATA'; data: TournamentData }
  | { type: 'UPDATE_PLAYER'; player: Player }
  | { type: 'UPDATE_GROUP_SCORE'; matchId: string; player1Score: number | null; player2Score: number | null }
  | { type: 'UPDATE_KNOCKOUT_SCORE'; matchId: string; player1Score: number | null; player2Score: number | null }
  | { type: 'UPDATE_FINAL_SCORE'; matchId: string; player1Score: number | null; player2Score: number | null };

interface TournamentContextValue {
  data: TournamentData;
  isAdmin: boolean;
  hasUnpublishedChanges: boolean;
  setIsAdmin: (value: boolean) => void;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  const dispatch: Dispatch<TournamentAction> = useCallback((action) => {
    baseDispatch(action);
    if (action.type !== 'SET_INITIAL_DATA') setHasUnpublishedChanges(true);
  }, []);

  const value = useMemo(
    () => ({
      data,
      isAdmin,
      hasUnpublishedChanges,
      setIsAdmin,
      markPublished: () => setHasUnpublishedChanges(false),
      dispatch,
    }),
    [data, hasUnpublishedChanges, isAdmin],
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const value = useContext(TournamentContext);
  if (!value) throw new Error('useTournament must be used within TournamentProvider');
  return value;
}
