import { useEffect, useState } from 'react';
import type { TournamentData } from '../types/tournament';
import { seedTournament } from '../data/seedTournament';
import { useTournament } from '../context/TournamentContext';

function isTournamentData(value: unknown): value is TournamentData {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'players' in value &&
      'groups' in value &&
      'tournamentName' in value,
  );
}

export function useTournamentData() {
  const { dispatch } = useTournament();
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    let cancelled = false;

    fetch('data/tournament.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((json) => {
        if (cancelled) return;
        dispatch({ type: 'SET_INITIAL_DATA', data: isTournamentData(json) ? json : seedTournament });
        setStatus(isTournamentData(json) ? 'ready' : 'fallback');
      })
      .catch(() => {
        if (cancelled) return;
        dispatch({ type: 'SET_INITIAL_DATA', data: seedTournament });
        setStatus('fallback');
      });

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return status;
}
