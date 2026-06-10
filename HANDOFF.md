# Handoff: World Cup Disc Golf Tournament — Management App

## Status

Planning is complete; **no application code has been written yet**. This document
contains everything a new agent/session needs to implement the app from scratch:
source requirements, confirmed architecture decisions, data model, bracket algorithm,
file structure, and a step-by-step build order.

- Repo: `MoKSelim1/AI-Playground`
- Branch to develop on: `claude/tournament-management-app-0a3owe`
- Current repo contents: placeholder `README.md` and `index.html` only — greenfield.

---

## 1. Source Material — Tournament Rules

Transcription of the uploaded `WorldCupDiscGolfTournament.docx` (by Enrique Vazquez):

> **World Cup Disc Golf Tournament**
>
> Welcome everyone to the 1st World Cup style Disc Golf tournament!
>
> **[Entry]**
> - $30 Buy-in — paid via PayPal to enriquevazquez2001@gmail.com
> - Pick the country you'd like to represent (DM organizer your Country/team name)
> - Guaranteed 3 matches
>
> Format = Group Stage → Knockout (bracket) Stage → Final Four Stage.
>
> **[Group Stage]**
> - Players placed into randomized groups of 4.
> - Within a group of 4, each player plays the other 3 over 3 weeks (round robin), one match
>   per week, at North Park, **short pads**.
> - Eligibility for a weekly matchup: play in the same mini-event hosted by Basket Cases (Tuesdays)
>   or AR Disc Golf, or schedule your own date/time. Doesn't have to be the same card, but same event.
> - After each match, send the scorecard to the organizer to update rankings.
> - Group standings determined by: match wins, then aggregate (total) score as tiebreak/secondary factor.
> - **1st place** in group → bye into Knockout Round 2.
> - **2nd & 3rd place** → advance to Knockout Round 1.
> - **4th place (last)** → eliminated.
>
> Example schedule for a group of 4 (Players 1-4):
> - Week 1: P1 vs P2, P3 vs P4
> - Week 2: P1 vs P3, P2 vs P4
> - Week 3: P1 vs P4, P2 vs P3
>
> Note: Week labels are matchup labels only; group-stage matches may be played in any order.
>
> **[Knockout Stage]** (example given for 4 groups A–D)
> - All knockout matches on the same card/event ("pressure"), short pads at North Park.
> - Week 1 (Round 1):
>   - Match 1: 2nd A vs 3rd D
>   - Match 2: 2nd B vs 3rd C
>   - Match 3: 2nd C vs 3rd B
>   - Match 4: 2nd D vs 3rd A
> - Week 2 (Round 2):
>   - Match 5: 1st A vs Winner(Match 2)
>   - Match 6: 1st B vs Winner(Match 4)
>   - Match 7: 1st C vs Winner(Match 1)
>   - Match 8: 1st D vs Winner(Match 3)
>
> **[Final Four]**
> - At North Park, weekend, **Long tee positions**, spectators invited.
> - Week 1: Winner(Match 5) vs Winner(Match 6) [Match 9]; Winner(Match 7) vs Winner(Match 8) [Match 10]
> - Week 2: Loser(Match 9) vs Loser(Match 10) [3rd Place Match]; Winner(Match 9) vs Winner(Match 10) [Final]
>
> **[Payout]**
> - Prize Pool = $480 (= 16 players × $30)
> - 1st: $240 (50%) | 2nd: $144 (30%) | 3rd: $96 (20%) | 4th: 1 free disc

---

## 2. Confirmed Architecture Decisions

1. **Stack**: React + Vite + TypeScript, static SPA, no backend server, minimal
   dependencies (plain CSS, no UI framework, no react-router — simple state-based
   view switching to avoid GitHub Pages SPA-routing issues).
2. **Hosting**: GitHub Pages on `MoKSelim1/AI-Playground`. **The repo will be made
   public** (required for free Pages — user explicitly chose this). Deploy via GitHub
   Actions on push to `main`. Vite `base: '/AI-Playground/'`.
3. **Two views in one app**:
   - **Public dashboard** (default, no login): standings, schedules, brackets, payout, rules/about.
   - **Admin/manager mode**: gated by a simple client-side passphrase (cosmetic gate
     only — not real security, just enough to deter casual players). Reveals:
     player/group setup, score entry for group/knockout/final-stage matches, and a
     **Publish** button.
   - **Publish flow**: admin pastes a GitHub Personal Access Token into the admin UI
     (stored in `sessionStorage` only — never committed, never logged, never part of
     `TournamentData`). Clicking Publish serializes current tournament state to JSON
     and commits it via the GitHub Contents API (GET current SHA, then PUT
     base64-encoded content + SHA to `disc-golf-tournament/public/data/tournament.json`
     on `main`). This commit triggers the Pages rebuild.
   - The app fetches `data/tournament.json` (relative to `base`) at startup to render
     current state for all visitors; falls back to in-code seed data if the fetch fails
     (e.g. local dev before first publish).
4. **Format**: flexible group count `G` (not hardcoded to 4 groups) — see algorithm below.
5. **Payout**: computed dynamically as `players.length * 30`, split 50/30/20%, 4th
   place = "1 free disc" (text only, non-cash).
6. **Winner determination**: admin enters both players' raw scores per match; the app
   auto-computes the winner as the **lower score** (standard disc golf — relative to
   par, can be negative). Ties aren't auto-resolved by the app (show a warning; admin
   adjusts/breaks ties manually since playoffs are out of scope).

---

## 3. Bracket / Format Algorithm

- `G` = number of groups, each group has exactly 4 players. **G must be even and ≥ 2**
  (validate on setup; recommend G be a power of 2 — 2, 4, 8 — so the Final Stage forms
  a clean single-elimination bracket; for the actual event G = 4).
- **Group stage**: fixed 6-match round robin per group (schedule labels above).
  Matches may be completed in any order. Standings sort by
  `(wins desc, totalAggregateScore asc)`. Ranks 1-4 derived from this sort.

### 3.1 Group schedule generation (players P1..P4 in seed order)
```
generateGroupSchedule(groupId, [p1,p2,p3,p4]) =
  week 1: p1 vs p2,  p3 vs p4
  week 2: p1 vs p3,  p2 vs p4
  week 3: p1 vs p4,  p2 vs p3
```

### 3.2 Group standings
```
for each player in group: wins = 0, totalScore = 0
for each completed match:
  winner.wins += 1
  player1.totalScore += match.player1Score
  player2.totalScore += match.player2Score
sort by (wins DESC, totalScore ASC) -> ranks 1..4
```

### 3.3 Knockout Round 1 (pod pairing)
`numPods = G / 2`. For `i in 0..numPods-1`, pod = (group `i`, group `G-1-i`):
```
matchA(podIndex=i): participant1 = 2nd place of group i
                     participant2 = 3rd place of group (G-1-i)
matchB(podIndex=i): participant1 = 2nd place of group (G-1-i)
                     participant2 = 3rd place of group i
```
(For G=4: pods are (0,3) and (1,2) → reproduces the doc's Matches 1-4 exactly.)

### 3.4 Knockout Round 2
For pod `k` in `0..numPods-1`, let `nextPod = (k+1) mod numPods`:
```
matchSeed1(podIndex=k): participant1 = 1st place of group k
                         participant2 = winner of Round1 matchA of pod nextPod
matchSeed2(podIndex=k): participant1 = 1st place of group (G-1-k)
                         participant2 = winner of Round1 matchB of pod nextPod
```
This produces exactly `G` winners, which seed the Final Stage.
(For G=4: reproduces the doc's Matches 5-8.)

### 3.5 Final Stage (single elimination, G entrants)
```
roundNames(G):
  G==2 -> ['final']
  G==4 -> ['semifinal', 'final']
  G==8 -> ['quarterfinal', 'semifinal', 'final']
  (generalize: last='final', 2nd-to-last='semifinal', 3rd-to-last='quarterfinal',
   earlier rounds = 'roundOf<N>')

For each round, pair up entrants from the previous round's winners
(round 0 entrants = the G Round-2 knockout winners, in order).

If G >= 4: add a "thirdPlace" match = losers of the two semifinal matches.
```
(For G=4: 2 semifinals → 3rd place match (semi losers) + Final (semi winners) =
exactly the doc's "Final Four".)

### 3.6 Recompute cascade
Every score entry triggers: recompute group standings → resolve knockout
participant references from standings → resolve Round 2 references from Round 1
results → resolve Final Stage entrants from Round 2 results → propagate Final Stage
winners/losers round-to-round and into the 3rd place match.

---

## 4. TypeScript Data Model (`src/types/tournament.ts`)

```typescript
export type PlayerId = string; // e.g. "p1".."p16", unique across tournament

export interface Player {
  id: PlayerId;
  name: string;
  country: string; // country/team name chosen by player
}

// --- Group stage ---

export interface GroupMatch {
  id: string;            // e.g. "g1-w1-m1"
  week: 1 | 2 | 3;
  player1Id: PlayerId;
  player2Id: PlayerId;
  player1Score: number | null; // disc golf score relative to par; null = not played
  player2Score: number | null;
  winnerId: PlayerId | null;    // derived on entry (lower score wins)
}

export interface Group {
  id: string;             // e.g. "group-1"
  name: string;           // e.g. "Group A" or "Group 1"
  playerIds: PlayerId[];  // exactly 4 player ids, in seed order P1..P4
  matches: GroupMatch[];  // 6 matches total (3 weeks x 2 matches)
}

export interface GroupStandingRow {
  playerId: PlayerId;
  wins: number;
  totalScore: number; // sum of completed match scores (lower is better)
  rank: 1 | 2 | 3 | 4; // computed
}

// --- Knockout stage (Rounds 1 & 2) ---

export type ParticipantRef =
  | { type: 'groupSeed'; groupId: string; seed: 2 | 3 } // 2nd or 3rd place of a group
  | { type: 'groupWinner'; groupId: string }            // 1st place of a group (Round 2 byes)
  | { type: 'matchWinner'; matchId: string }            // winner of a referenced match
  | { type: 'player'; playerId: PlayerId }              // resolved
  | { type: 'tbd' };                                    // not yet determined

export interface KnockoutMatch {
  id: string;             // e.g. "ko-r1-pod0-a"
  round: 1 | 2;
  podIndex: number;       // which pod (0..G/2-1) this match belongs to
  label: 'A' | 'B' | 'seed1' | 'seed2'; // role within the pod/round
  participant1: ParticipantRef;
  participant2: ParticipantRef;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: PlayerId | null;
}

// --- Final Stage (single elimination) ---

export interface FinalStageMatch {
  id: string;              // e.g. "final-r1-m0", "final-3rd", "final-final"
  roundName: 'quarterfinal' | 'semifinal' | 'thirdPlace' | 'final';
  roundOrder: number;      // ordering within bracket for layout (0-indexed per round)
  participant1: ParticipantRef;
  participant2: ParticipantRef;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: PlayerId | null;
}

// --- Payout ---

export interface PayoutBreakdown {
  prizePool: number;
  buyIn: number;
  playerCount: number;
  first: number;   // 50%
  second: number;  // 30%
  third: number;   // 20%
  fourth: string;  // "1 free disc"
}

// --- Top-level persisted shape ---

export interface TournamentData {
  schemaVersion: number;        // for future migrations, start at 1
  tournamentName: string;
  buyInAmount: number;          // 30
  numGroups: number;            // G, even, >= 2
  players: Player[];            // all registered players
  groups: Group[];
  knockoutMatches: KnockoutMatch[];
  finalStageMatches: FinalStageMatch[];
  lastUpdated: string;          // ISO timestamp, set on Publish
}
```

---

## 5. File Structure

```
AI-Playground/
├── README.md
├── index.html                          (existing placeholder — leave as-is; Pages
│                                          serves the built `dist/` artifact, not this)
├── HANDOFF.md                          (this file)
├── .github/
│   └── workflows/
│       └── deploy.yml                  # build & deploy disc-golf-tournament to Pages
└── disc-golf-tournament/
    ├── package.json
    ├── vite.config.ts                  # base: '/AI-Playground/'
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── tsconfig.node.json
    ├── index.html
    ├── .gitignore
    ├── public/
    │   └── data/
    │       └── tournament.json         # persisted tournament state (fetched at runtime;
    │                                    #   overwritten by admin Publish action)
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── styles/
        │   └── global.css
        ├── types/
        │   └── tournament.ts           # data model from section 4
        ├── data/
        │   └── seedTournament.ts       # initial seed data (TS const), source of truth
        │                                #   for the committed tournament.json
        ├── context/
        │   └── TournamentContext.tsx   # Context + useReducer over TournamentData,
        │                                #   isAdmin/dirty UI state
        ├── lib/
        │   ├── groupStandings.ts       # generateGroupSchedule, computeGroupStandings
        │   ├── knockoutBracket.ts      # pod-based Round 1/2 generation + resolution
        │   ├── finalStage.ts           # single-elim bracket generation + advancement
        │   ├── payout.ts               # computePayout
        │   └── github.ts               # GitHub Contents API publish wrapper
        ├── hooks/
        │   └── useTournamentData.ts    # fetch tournament.json on mount, fallback to seed
        ├── components/
        │   ├── layout/
        │   │   ├── NavBar.tsx
        │   │   └── Layout.tsx
        │   ├── common/
        │   │   ├── MatchCard.tsx       # generic match display (players, scores, winner)
        │   │   └── Bracket.tsx         # generic CSS-grid bracket-tree renderer
        │   └── admin/
        │       ├── PassphraseGate.tsx
        │       ├── PlayerGroupSetup.tsx
        │       ├── GroupScoreEntry.tsx
        │       ├── KnockoutScoreEntry.tsx
        │       ├── FinalStageScoreEntry.tsx
        │       └── PublishPanel.tsx
        └── pages/
            ├── DashboardPage.tsx        # overview + standings/payout snippets
            ├── GroupsPage.tsx           # group standings + labeled matchup schedule
            ├── KnockoutPage.tsx         # knockout Round 1/2 bracket
            ├── FinalStagePage.tsx       # final stage / "Final Four" bracket
            ├── PayoutPage.tsx           # prize pool breakdown
            ├── RulesPage.tsx            # About/Rules text from source doc
            └── AdminPage.tsx            # passphrase gate + admin sub-views
```

---

## 6. GitHub Publish Flow (`src/lib/github.ts`)

```typescript
const API_BASE = 'https://api.github.com';

export async function publishTournamentData(opts: {
  owner: string; repo: string; path: string; branch: string;
  token: string; data: TournamentData; commitMessage: string;
}): Promise<{ commitUrl: string }> {
  const headers = {
    Authorization: `Bearer ${opts.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // 1. Get current file SHA (required for update)
  const getRes = await fetch(
    `${API_BASE}/repos/${opts.owner}/${opts.repo}/contents/${opts.path}?ref=${opts.branch}`,
    { headers }
  );
  if (!getRes.ok) throw new Error(`Failed to fetch current file (${getRes.status})`);
  const { sha } = await getRes.json();

  // 2. Base64-encode new content (UTF-8 safe)
  const json = JSON.stringify({ ...opts.data, lastUpdated: new Date().toISOString() }, null, 2);
  const content = btoa(unescape(encodeURIComponent(json)));

  // 3. PUT updated content
  const putRes = await fetch(
    `${API_BASE}/repos/${opts.owner}/${opts.repo}/contents/${opts.path}`,
    {
      method: 'PUT',
      headers,
      body: JSON.stringify({ message: opts.commitMessage, content, sha, branch: opts.branch }),
    }
  );
  if (!putRes.ok) {
    const body = await putRes.json().catch(() => ({}));
    throw new Error(`Publish failed (${putRes.status}): ${body.message ?? 'unknown error'}`);
  }
  const result = await putRes.json();
  return { commitUrl: result.commit?.html_url ?? '' };
}
```

`PublishPanel.tsx`:
- PAT input (`type="password"`) → `sessionStorage.setItem('gh_pat', value)`; read back
  on mount. Never logged, never persisted into `TournamentData`.
- Defaults: `owner='MoKSelim1'`, `repo='AI-Playground'`, `branch='main'`,
  `path='disc-golf-tournament/public/data/tournament.json'` — all editable.
- Disable button while in-flight; show success with commit link + "Pages will redeploy
  in ~1-2 minutes" note, or error message on failure.

---

## 7. GitHub Actions Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy Disc Golf Tournament to Pages

on:
  push:
    branches: [main]
    paths:
      - 'disc-golf-tournament/**'
      - '.github/workflows/deploy.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: disc-golf-tournament
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: disc-golf-tournament/package-lock.json
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: disc-golf-tournament/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 8. State Management

- React **Context + `useReducer`** over `TournamentData` (single source of truth — no
  separately-stored derived state that can drift). Reducer actions:
  `SET_INITIAL_DATA`, `UPDATE_GROUP_MATCH_SCORE`, `UPDATE_KNOCKOUT_SCORE`,
  `UPDATE_FINAL_STAGE_SCORE`, `REGENERATE_STRUCTURE` (initial setup), `LOAD_FROM_JSON`.
- After every mutating action, run the recompute cascade (section 3.6) via the `lib/`
  modules so standings/brackets stay consistent.
- `isAdmin` and `hasUnpublishedChanges` are separate lightweight UI state (not part of
  persisted `TournamentData`).
- No Redux/Zustand — Context + useReducer is sufficient; keeps deps at zero beyond React.

---

## 9. Seed Data & Styling

- **`src/data/seedTournament.ts`**: TS const `seedTournament: TournamentData`, `G=4`,
  16 players named `"Player 1"`.."Player 16"`, countries `"TBD"`, groups generated via
  `generateGroupSchedule`, knockout/final-stage skeletons via the bracket generators
  (all scores `null`, `winnerId: null`). Used as fallback and as the source for the
  initial `public/data/tournament.json` (export/copy it as JSON at scaffold time).
- Player IDs (`p1..p16`) are stable identifiers; admin relabels names/countries via
  `PlayerGroupSetup` without restructuring brackets.
- **Styling**: plain `src/styles/global.css`, CSS custom properties for colors/spacing,
  Flexbox/Grid utility classes (`.flex`, `.grid`, `.card`, `.table`). No CSS framework.
  `Bracket.tsx` uses CSS Grid columns per round + pseudo-element connector lines (pure
  CSS, no SVG/canvas lib). Responsive: stack group cards on mobile, horizontal-scroll
  the bracket on small screens.

---

## 10. Implementation Order

1. Scaffold Vite **react-ts** project in `disc-golf-tournament/` (`npm create vite@latest disc-golf-tournament -- --template react-ts`), set `vite.config.ts` `base: '/AI-Playground/'`, configure tsconfig.
2. Define types (`src/types/tournament.ts`) per section 4.
3. Implement pure logic modules first (`lib/groupStandings.ts`, `lib/knockoutBracket.ts`,
   `lib/finalStage.ts`, `lib/payout.ts`) per section 3 — easiest to get right in isolation.
4. Build `src/data/seedTournament.ts` using those modules; export as
   `public/data/tournament.json`.
5. Build `TournamentContext` (reducer) + `useTournamentData` hook.
6. Build read-only pages (Dashboard, Groups, Knockout, FinalStage, Payout, Rules) +
   shared components (`MatchCard`, `Bracket`, `NavBar`, `Layout`).
7. Build admin components (`PassphraseGate`, `PlayerGroupSetup`, score-entry forms,
   `PublishPanel`) + `lib/github.ts`.
8. Add `.github/workflows/deploy.yml`; verify build output paths match `base`.
9. Local test: `npm run dev`, verify all views render with seed data; sanity-check
   bracket generation for G=4 against the doc's exact Match 1-10 layout; test the admin
   flow end-to-end including a real publish (once repo is public, with a real PAT) to
   confirm the Pages rebuild cycle.

---

## 11. Open Items / Notes for the Next Agent

- **Repo visibility**: needs to be switched to **public** (Settings → General →
  Danger Zone → Change visibility) for free GitHub Pages — not yet done.
- **GitHub Pages source**: after first deploy workflow run, set Settings → Pages →
  Source = "GitHub Actions" (one-time manual step).
- **Real player roster**: not yet provided — ship with placeholder seed data
  (16 players, 4 groups); manager fills in real names/countries via Admin + Publish.
- **Admin passphrase**: not specified — pick something simple (e.g. a constant in
  `PassphraseGate.tsx`), document where to change it. Cosmetic gate only.
- **GitHub PAT scope**: needs `repo` (or `public_repo` once the repo is public)
  contents read/write — mention this to the user when explaining Publish.
- **Stray scaffold cleanup**: a vanilla `vite-project/` directory was accidentally
  created during planning exploration via `npx create-vite` and has already been
  removed (untracked, never committed) — no action needed, just don't be surprised if
  referenced in old logs.
- **Tooling note**: during planning, a sub-agent flagged that output from an
  `npx create-vite` invocation appeared to contain injected text mimicking a system
  reminder. It was identified as suspicious and ignored with no resulting actions; the
  generated files were verified to be a standard, benign Vite scaffold and have been
  deleted. Worth a passing mention if anything similar recurs.
