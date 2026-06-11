import { useMemo, useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { recommendGroupCount } from '../../lib/tournament';

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 40;

export function TournamentManager() {
  const { activeTournament, createTournament, tournamentIndex } = useTournament();
  const [name, setName] = useState('New Disc Golf Tournament');
  const [playerCount, setPlayerCount] = useState(16);
  const [buyInAmount, setBuyInAmount] = useState(30);
  const [error, setError] = useState('');
  const groupCount = useMemo(() => recommendGroupCount(playerCount), [playerCount]);
  const groupSize = playerCount / groupCount;

  function create() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Tournament name is required.');
      return;
    }
    if (playerCount < MIN_PLAYERS || playerCount > MAX_PLAYERS) {
      setError(`Player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}.`);
      return;
    }

    createTournament({ name: trimmedName, playerCount, buyInAmount });
    setError('');
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Tournaments</h2>
        <span>{tournamentIndex.tournaments.length} managed events</span>
      </div>
      <p className="panel-note">
        The current event stays on its existing data file. New events are drafts in this browser until published, then
        they use separate JSON files and appear for players in the tournament selector.
      </p>
      <div className="content-grid content-grid--two">
        <div className="subpanel">
          <h3>Create Tournament</h3>
          <div className="create-tournament-form">
            <label>
              Name
              <input onChange={(event) => setName(event.target.value)} value={name} />
            </label>
            <label>
              Players
              <input
                max={MAX_PLAYERS}
                min={MIN_PLAYERS}
                onChange={(event) => setPlayerCount(Number(event.target.value))}
                type="number"
                value={playerCount}
              />
            </label>
            <label>
              Buy-in
              <input
                min={0}
                onChange={(event) => setBuyInAmount(Number(event.target.value))}
                type="number"
                value={buyInAmount}
              />
            </label>
            <div className="format-note">
              <strong>{groupCount} groups</strong>
              <span>
                {Number.isInteger(groupSize)
                  ? `${groupSize} players per group`
                  : 'Balanced uneven groups; odd groups use one bye each round'}
              </span>
            </div>
            {error && <p className="form-error">{error}</p>}
            <button onClick={create} type="button">
              Create Tournament
            </button>
          </div>
        </div>
        <div className="subpanel">
          <h3>Managed Events</h3>
          <div className="tournament-list">
            {tournamentIndex.tournaments.map((tournament) => (
              <div className={tournament.id === activeTournament.id ? 'tournament-row tournament-row--active' : 'tournament-row'} key={tournament.id}>
                <div>
                  <strong>{tournament.name}</strong>
                  <span>{tournament.playerCount} players</span>
                </div>
                <span>{tournament.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
