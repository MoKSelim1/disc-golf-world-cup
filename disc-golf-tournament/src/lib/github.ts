import type { TournamentData } from '../types/tournament';

const API_BASE = 'https://api.github.com';

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
  const headers = {
    Authorization: `Bearer ${opts.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const getRes = await fetch(
    `${API_BASE}/repos/${opts.owner}/${opts.repo}/contents/${opts.path}?ref=${opts.branch}`,
    { headers },
  );
  if (!getRes.ok) throw new Error(`Failed to fetch current file (${getRes.status})`);
  const { sha } = await getRes.json();

  const content = encodeBase64Utf8(
    JSON.stringify({ ...opts.data, lastUpdated: new Date().toISOString() }, null, 2),
  );

  const putRes = await fetch(`${API_BASE}/repos/${opts.owner}/${opts.repo}/contents/${opts.path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: opts.commitMessage,
      content,
      sha,
      branch: opts.branch,
    }),
  });

  if (!putRes.ok) {
    const body = await putRes.json().catch(() => ({}));
    throw new Error(`Publish failed (${putRes.status}): ${body.message ?? 'unknown error'}`);
  }

  const result = await putRes.json();
  return { commitUrl: result.commit?.html_url ?? '' };
}
