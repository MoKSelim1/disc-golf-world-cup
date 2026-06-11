import { useEffect, useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { publishTournamentBundle } from '../../lib/github';
import {
  publicPathToRepoPath,
  repoPathToPublicPath,
  summarizeTournament,
  TOURNAMENT_INDEX_PUBLIC_PATH,
  updateIndexSummary,
} from '../../lib/tournamentCatalog';

const TOKEN_KEY = 'disc_golf_world_cup_gh_pat';

export function PublishPanel() {
  const {
    activeTournament,
    data,
    dispatch,
    hasUnpublishedChanges,
    markPublished,
    replaceTournamentIndex,
    tournamentIndex,
  } = useTournament();
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('MoKSelim1');
  const [repo, setRepo] = useState('disc-golf-world-cup');
  const [branch, setBranch] = useState('main');
  const [path, setPath] = useState(publicPathToRepoPath(activeTournament.dataPath));
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const groupMatches = data.groups.flatMap((group) => group.matches);
  const completedGroupMatches = groupMatches.filter((match) => match.winnerId).length;
  const completedKnockoutMatches = data.knockoutMatches.filter((match) => match.winnerId).length;
  const completedFinalMatches = data.finalStageMatches.filter((match) => match.winnerId).length;

  useEffect(() => {
    setToken(sessionStorage.getItem(TOKEN_KEY) ?? '');
  }, []);

  useEffect(() => {
    setPath(publicPathToRepoPath(activeTournament.dataPath));
  }, [activeTournament.dataPath]);

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
    const publicDataPath = repoPathToPublicPath(path);
    if (!publicDataPath) {
      setStatus('Data path must stay under disc-golf-tournament/public/.');
      return;
    }

    setBusy(true);
    setStatus('Publishing...');
    try {
      const publishedAt = new Date().toISOString();
      const updatedData = { ...data, lastUpdated: publishedAt };
      const updatedSummary = summarizeTournament(updatedData, publicDataPath, activeTournament.status);
      const updatedIndex = updateIndexSummary(tournamentIndex, updatedSummary, publishedAt);
      const result = await publishTournamentBundle({
        owner,
        repo,
        branch,
        tournamentPath: path,
        indexPath: publicPathToRepoPath(TOURNAMENT_INDEX_PUBLIC_PATH),
        token,
        data: updatedData,
        index: updatedIndex,
        commitMessage: `Update ${data.tournamentName} data`,
      });
      replaceTournamentIndex(updatedIndex, updatedSummary);
      dispatch({ type: 'SET_INITIAL_DATA', data: updatedData });
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
        Token is stored only for this browser session. Publish updates this tournament JSON and the tournament index on the selected branch.
      </p>
      <div className="readiness-grid">
        <span>Groups: {completedGroupMatches}/{groupMatches.length}</span>
        <span>Knockout: {completedKnockoutMatches}/{data.knockoutMatches.length}</span>
        <span>Finals: {completedFinalMatches}/{data.finalStageMatches.length}</span>
      </div>
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
