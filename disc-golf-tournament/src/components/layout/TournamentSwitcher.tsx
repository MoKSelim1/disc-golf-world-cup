import { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

export function TournamentSwitcher() {
  const { activeTournament, hasUnpublishedChanges, selectTournament, tournamentIndex } = useTournament();
  const [status, setStatus] = useState('');

  async function switchTournament(id: string) {
    if (id === activeTournament.id) return;
    if (hasUnpublishedChanges && !window.confirm('Switch tournaments and discard unpublished local changes?')) return;

    setStatus('Loading...');
    try {
      await selectTournament(id);
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load tournament.');
    }
  }

  return (
    <div className="tournament-switcher">
      <label>
        Tournament
        <select onChange={(event) => switchTournament(event.target.value)} value={activeTournament.id}>
          {tournamentIndex.tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
            </option>
          ))}
        </select>
      </label>
      {status && <span>{status}</span>}
    </div>
  );
}
