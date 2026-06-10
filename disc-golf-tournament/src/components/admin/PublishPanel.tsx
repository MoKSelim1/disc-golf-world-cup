import { useEffect, useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { publishTournamentData } from '../../lib/github';

const TOKEN_KEY = 'disc_golf_world_cup_gh_pat';

export function PublishPanel() {
  const { data, hasUnpublishedChanges, markPublished } = useTournament();
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('MoKSelim1');
  const [repo, setRepo] = useState('AI-Playground');
  const [branch, setBranch] = useState('main');
  const [path, setPath] = useState('disc-golf-tournament/public/data/tournament.json');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setToken(sessionStorage.getItem(TOKEN_KEY) ?? '');
  }, []);

  function updateToken(value: string) {
    setToken(value);
    if (value) sessionStorage.setItem(TOKEN_KEY, value);
    else sessionStorage.removeItem(TOKEN_KEY);
  }

  async function publish() {
    if (!token.trim()) {
      setStatus('Enter a GitHub token before publishing.');
      return;
    }
    if (!owner.trim() || !repo.trim() || !branch.trim() || !path.trim()) {
      setStatus('Owner, repo, branch, and data path are required.');
      return;
    }

    setBusy(true);
    setStatus('Publishing...');
    try {
      const result = await publishTournamentData({
        owner,
        repo,
        branch,
        path,
        token,
        data,
        commitMessage: 'Update tournament data',
      });
      markPublished();
      setStatus(result.commitUrl ? `Published: ${result.commitUrl}` : 'Published. Pages will redeploy soon.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Publish failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Publish</h2>
        <span>{hasUnpublishedChanges ? 'Unpublished changes' : 'No unpublished changes'}</span>
      </div>
      <p className="panel-note">
        Token is stored only for this browser session. Publish updates the JSON file on the selected branch.
      </p>
      <div className="publish-grid">
        <label>
          GitHub token
          <input
            onChange={(event) => updateToken(event.target.value)}
            type="password"
            value={token}
          />
        </label>
        <label>
          Owner
          <input onChange={(event) => setOwner(event.target.value)} value={owner} />
        </label>
        <label>
          Repo
          <input onChange={(event) => setRepo(event.target.value)} value={repo} />
        </label>
        <label>
          Branch
          <input onChange={(event) => setBranch(event.target.value)} value={branch} />
        </label>
        <label className="publish-grid__wide">
          Data path
          <input onChange={(event) => setPath(event.target.value)} value={path} />
        </label>
      </div>
      <button disabled={busy} onClick={publish} type="button">
        {busy ? 'Publishing...' : 'Publish Tournament Data'}
      </button>
      {status && <p className="publish-status">{status}</p>}
    </section>
  );
}
