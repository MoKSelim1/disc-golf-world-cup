import { useEffect, useState } from 'react';
import { seedTournament } from '../data/seedTournament';
import { useTournament } from '../context/TournamentContext';
import {
  buildLegacyIndex,
  isTournamentData,
  isTournamentIndex,
  LEGACY_TOURNAMENT_PUBLIC_PATH,
  TOURNAMENT_INDEX_PUBLIC_PATH,
} from '../lib/tournamentCatalog';

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export function useTournamentData() {
  const { setInitialTournament } = useTournament();
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const indexJson = await fetchJson(TOURNAMENT_INDEX_PUBLIC_PATH);
        if (!isTournamentIndex(indexJson)) throw new Error('Invalid tournament index');

        const requestedId = new URLSearchParams(window.location.search).get('tournament');
        const summary =
          indexJson.tournaments.find((item) => item.id === requestedId) ??
          indexJson.tournaments.find((item) => item.id === indexJson.activeTournamentId) ??
          indexJson.tournaments[0];
        if (!summary) throw new Error('Tournament index is empty');

        const dataJson = await fetchJson(summary.dataPath);
        if (!isTournamentData(dataJson)) throw new Error('Invalid tournament data');
        if (cancelled) return;

        setInitialTournament(indexJson, { ...dataJson, tournamentId: summary.id }, summary);
        setStatus('ready');
      } catch {
        try {
          const legacyJson = await fetchJson(LEGACY_TOURNAMENT_PUBLIC_PATH);
          const data = isTournamentData(legacyJson) ? legacyJson : seedTournament;
          if (cancelled) return;
          setInitialTournament(buildLegacyIndex(data), data, buildLegacyIndex(data).tournaments[0]);
          setStatus(isTournamentData(legacyJson) ? 'ready' : 'fallback');
        } catch {
          if (cancelled) return;
          setInitialTournament(buildLegacyIndex(seedTournament), seedTournament, buildLegacyIndex(seedTournament).tournaments[0]);
          setStatus('fallback');
        }
      }
    }

    load().catch(() => {
      if (cancelled) return;
      setInitialTournament(buildLegacyIndex(seedTournament), seedTournament, buildLegacyIndex(seedTournament).tournaments[0]);
      setStatus('fallback');
    });

    return () => {
      cancelled = true;
    };
  }, [setInitialTournament]);

  return status;
}
