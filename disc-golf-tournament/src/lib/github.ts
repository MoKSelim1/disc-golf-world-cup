import type { TournamentData, TournamentIndex } from '../types/tournament';

const API_BASE = 'https://api.github.com';
const TOKEN_PERMISSION_HINT =
  'Check that your fine-grained token is for MoKSelim1/disc-golf-world-cup and has Contents: Read and write permission.';

function encodeBase64Utf8(value: string): string {
  return btoa(unescape(encodeURIComponent(value)));
}

export async function publishTournamentData(opts: {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  token: string;
  data: TournamentData;
  commitMessage: string;
}): Promise<{ commitUrl: string }> {
  return publishJsonFile({ ...opts, json: { ...opts.data, lastUpdated: new Date().toISOString() } });
}

export async function publishTournamentBundle(opts: {
  owner: string;
  repo: string;
  tournamentPath: string;
  indexPath: string;
  branch: string;
  token: string;
  data: TournamentData;
  index: TournamentIndex;
  commitMessage: string;
}): Promise<{ commitUrl: string }> {
  const tournamentResult = await publishJsonFile({
    owner: opts.owner,
    repo: opts.repo,
    path: opts.tournamentPath,
    branch: opts.branch,
    token: opts.token,
    json: opts.data,
    commitMessage: opts.commitMessage,
  });

  const indexResult = await publishJsonFile({
    owner: opts.owner,
    repo: opts.repo,
    path: opts.indexPath,
    branch: opts.branch,
    token: opts.token,
    json: opts.index,
    commitMessage: `Update tournament index`,
  });

  return { commitUrl: indexResult.commitUrl || tournamentResult.commitUrl };
}

async function publishJsonFile(opts: {
  owner: string;
  repo: string;
  path: string;
  branch: string;
  token: string;
  json: unknown;
  commitMessage: string;
}): Promise<{ commitUrl: string }> {
  const headers = {
    Authorization: `Bearer ${opts.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const getRes = await fetch(
    `${API_BASE}/repos/${opts.owner}/${opts.repo}/contents/${opts.path}?ref=${opts.branch}`,
    { headers },
  );
  let sha: string | undefined;
  if (getRes.ok) {
    const currentFile = await getRes.json();
    sha = currentFile.sha;
  } else if (getRes.status !== 404) {
    const body = await getRes.json().catch(() => ({}));
    const hint = getRes.status === 403 ? ` ${TOKEN_PERMISSION_HINT}` : '';
    throw new Error(`Failed to fetch current file (${getRes.status}): ${body.message ?? 'unknown error'}.${hint}`);
  }

  const content = encodeBase64Utf8(JSON.stringify(opts.json, null, 2));

  const putRes = await fetch(`${API_BASE}/repos/${opts.owner}/${opts.repo}/contents/${opts.path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: opts.commitMessage,
      content,
      ...(sha ? { sha } : {}),
      branch: opts.branch,
    }),
  });

  if (!putRes.ok) {
    const body = await putRes.json().catch(() => ({}));
    const hint = putRes.status === 403 ? ` ${TOKEN_PERMISSION_HINT}` : '';
    throw new Error(`Publish failed (${putRes.status}): ${body.message ?? 'unknown error'}.${hint}`);
  }

  const result = await putRes.json();
  return { commitUrl: result.commit?.html_url ?? '' };
}
