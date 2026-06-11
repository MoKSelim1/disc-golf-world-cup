import { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

export const ADMIN_PASSPHRASE = 'manager2026';

export function PassphraseGate() {
  const { setIsAdmin } = useTournament();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  return (
    <section className="panel admin-gate">
      <div>
        <p className="eyebrow">Manager mode</p>
        <h2>Admin Access</h2>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (value === ADMIN_PASSPHRASE) {
            setIsAdmin(true);
            setError('');
          } else {
            setError('Passphrase did not match.');
          }
        }}
      >
        <label>
          Passphrase
          <input
            autoComplete="off"
            onChange={(event) => setValue(event.target.value)}
            type="password"
            value={value}
          />
        </label>
        <button type="submit">Enter</button>
      </form>
      {error && <p className="form-error">{error}</p>}
    </section>
  );
}
