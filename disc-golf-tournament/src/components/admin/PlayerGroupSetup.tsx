import { useTournament } from '../../context/TournamentContext';
import { getPlayer } from '../../lib/display';

export function PlayerGroupSetup() {
  const { data, dispatch } = useTournament();

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Players</h2>
        <span>{data.players.length} roster spots</span>
      </div>
      <div className="content-grid content-grid--two">
        {data.groups.map((group) => (
          <article className="subpanel" key={group.id}>
            <h3>{group.name}</h3>
            <div className="player-editor-list">
              {group.playerIds.map((playerId) => {
                const player = getPlayer(data.players, playerId);
                if (!player) return null;
                return (
                  <div className="player-editor" key={player.id}>
                    <label>
                      Player
                      <input
                        onChange={(event) =>
                          dispatch({ type: 'UPDATE_PLAYER', player: { ...player, name: event.target.value } })
                        }
                        value={player.name}
                      />
                    </label>
                    <label>
                      Country or 2-letter code
                      <input
                        onChange={(event) =>
                          dispatch({ type: 'UPDATE_PLAYER', player: { ...player, country: event.target.value } })
                        }
                        value={player.country}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
