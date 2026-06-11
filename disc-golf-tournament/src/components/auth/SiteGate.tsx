import { useEffect, useState, type ReactNode } from 'react';

const SITE_ACCESS_KEY = 'disc_golf_world_cup_site_access';
export const SITE_PASSPHRASE = 'worldcup2026';

export function SiteGate({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setIsUnlocked(sessionStorage.getItem(SITE_ACCESS_KEY) === 'granted');
  }, []);

  if (isUnlocked) return <>{children}</>;

  return (
    <main className="access-page">
      <section className="access-panel">
        <p className="eyebrow">Private tournament</p>
        <h1>Disc Golf World Cup</h1>
        <p>Enter the tournament access passphrase to view standings, schedules, brackets, and manager tools.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (value === SITE_PASSPHRASE) {
              sessionStorage.setItem(SITE_ACCESS_KEY, 'granted');
              setIsUnlocked(true);
              setError('');
            } else {
              setError('Passphrase did not match.');
            }
          }}
        >
          <label>
            Access passphrase
            <input
              autoComplete="off"
              onChange={(event) => setValue(event.target.value)}
              type="password"
              value={value}
            />
          </label>
          <button type="submit">View Tournament</button>
        </form>
        {error && <p className="form-error">{error}</p>}
      </section>
    </main>
  );
}
