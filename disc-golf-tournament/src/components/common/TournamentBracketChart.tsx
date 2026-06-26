import { useState } from 'react';
import type {
  FinalRoundName,
  FinalStageMatch,
  Group,
  KnockoutMatch,
  ParticipantRef,
  Player,
  PlayerId,
  TournamentData,
} from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';
import { computeGroupStandings } from '../../lib/groupStandings';
import { generateKnockoutMatches, orderRoundTwoMatches } from '../../lib/knockoutBracket';
import { advancingPerGroup, isMensTournament } from '../../lib/tournament';
import {
  finalMatchTitle,
  finalRoundTitle,
  getPlayer,
  knockoutMatchTitle,
  knockoutSort,
  participantLabel,
  scoreText,
} from '../../lib/display';

// ---- Layout constants ----
const matchWidth = 300;
const matchHeight = 74;
const columnGap = 96;
const topPad = 80;
const bottomPad = 30;
const columnTitleTop = 30;

const groupHeaderH = 36;
const groupRowH = 40;
const groupBoxGap = 26;

// Vertical rhythm for the knockout/final nodes when spread across the full height.
const minMatchGap = 26;

// ---- Zoom ----
const zoomMin = 0.4;
const zoomMax = 1;
const zoomStep = 0.1;

const finalRoundSequence: FinalRoundName[] = ['roundOf16', 'quarterfinal', 'semifinal', 'final'];

type DisplayMatch = {
  id: string;
  label: string;
  match: KnockoutMatch | FinalStageMatch;
};

type MatchColumn = {
  id: string;
  title: string;
  matches: DisplayMatch[];
};

type Segment = { sx: number; sy: number; ex: number; ey: number };

// ---- Pure helpers (duplicated from FullBracket.tsx so that file stays untouched) ----
function groupCode(groupName: string): string {
  return groupName.replace(/^Group\s+/i, '').slice(0, 3);
}

function playerFromGroupSeed(data: TournamentData, groupId: string, seed: number): Player | null {
  const group = data.groups.find((candidate) => candidate.id === groupId);
  if (!group) return null;
  const standing = computeGroupStandings(group).find((row) => row.rank === seed);
  return data.players.find((player) => player.id === standing?.playerId) ?? null;
}

function resolvePlayerId(ref: ParticipantRef, data: TournamentData): PlayerId | null {
  if (ref.type === 'player') return ref.playerId;
  if (ref.type === 'groupWinner') return playerFromGroupSeed(data, ref.groupId, 1)?.id ?? null;
  if (ref.type === 'groupSeed') return playerFromGroupSeed(data, ref.groupId, ref.seed)?.id ?? null;
  if (ref.type === 'matchWinner') {
    return (
      data.knockoutMatches.find((match) => match.id === ref.matchId)?.winnerId
      ?? data.finalStageMatches.find((match) => match.id === ref.matchId)?.winnerId
      ?? null
    );
  }
  return null;
}

function participantName(ref: ParticipantRef, data: TournamentData): string {
  const playerId = resolvePlayerId(ref, data);
  const player = data.players.find((candidate) => candidate.id === playerId);
  return player?.name ?? participantLabel(ref, data);
}

function participantSeed(ref: ParticipantRef, data: TournamentData): string {
  if (ref.type === 'groupWinner' || ref.type === 'groupSeed') {
    const group = data.groups.find((candidate) => candidate.id === ref.groupId);
    const seed = ref.type === 'groupWinner' ? 1 : ref.seed;
    return group ? `${groupCode(group.name)}${seed}` : `${seed}`;
  }

  if (ref.type === 'player') {
    for (const group of data.groups) {
      if (!group.playerIds.includes(ref.playerId)) continue;
      const standing = computeGroupStandings(group).find((row) => row.playerId === ref.playerId);
      return standing ? `${groupCode(group.name)}${standing.rank}` : groupCode(group.name);
    }
  }

  if (ref.type === 'matchWinner') {
    const knockout = data.knockoutMatches.find((match) => match.id === ref.matchId);
    if (knockout) return knockout.round === 1 ? `Q${knockout.podIndex + 1}${knockout.label}` : `K${knockout.podIndex + 1}`;
    const final = data.finalStageMatches.find((match) => match.id === ref.matchId);
    if (final) return `F${final.roundOrder + 1}`;
  }

  return '-';
}

function matchRows(match: KnockoutMatch | FinalStageMatch, data: TournamentData) {
  return [
    { ref: match.participant1, score: match.player1Score },
    { ref: match.participant2, score: match.player2Score },
  ].map((row) => {
    const playerId = resolvePlayerId(row.ref, data);
    return { ...row, playerId, isWinner: Boolean(playerId && match.winnerId === playerId) };
  });
}

// ---- Group ordering ----
// For play-in formats the two groups that feed a knockout pod sit at opposite
// ends of the natural order (A & D, B & C). Interleaving them clusters each
// pod's source groups together so the play-in lines stay short and local.
function groupDisplayOrder(groups: Group[], hasPlayIn: boolean): Group[] {
  if (!hasPlayIn || groups.length < 4 || groups.length % 2 !== 0) return groups;
  const ordered: Group[] = [];
  for (let pod = 0; pod < groups.length / 2; pod += 1) {
    ordered.push(groups[pod]);
    ordered.push(groups[groups.length - 1 - pod]);
  }
  return ordered;
}

// ---- Column model ----
function buildMatchColumns(data: TournamentData, hasPlayIn: boolean): MatchColumn[] {
  const columns: MatchColumn[] = [];

  if (hasPlayIn) {
    const roundOne = data.knockoutMatches.filter((match) => match.round === 1).sort(knockoutSort);
    const roundTwo = orderRoundTwoMatches(data.knockoutMatches, { crossPodSemis: isMensTournament(data) });
    if (roundOne.length > 0) {
      columns.push({
        id: 'knockout-1',
        title: 'Knockout · Week 1',
        matches: roundOne.map((match) => ({ id: match.id, label: knockoutMatchTitle(match), match })),
      });
    }
    if (roundTwo.length > 0) {
      columns.push({
        id: 'knockout-2',
        title: 'Knockout · Week 2',
        matches: roundTwo.map((match) => ({ id: match.id, label: knockoutMatchTitle(match), match })),
      });
    }
  }

  // One column per final-stage round that exists (quarterfinal, semifinal, ...).
  finalRoundSequence
    .filter((roundName) => roundName !== 'final')
    .forEach((roundName) => {
      const matches = data.finalStageMatches
        .filter((match) => match.roundName === roundName)
        .sort((a, b) => a.roundOrder - b.roundOrder);
      if (matches.length === 0) return;
      columns.push({
        id: `final-${roundName}`,
        title: finalRoundTitle(roundName),
        matches: matches.map((match) => ({ id: match.id, label: finalMatchTitle(match.roundName, match.roundOrder), match })),
      });
    });

  // Final + third-place share the last column.
  const finalMatch = data.finalStageMatches.find((match) => match.roundName === 'final');
  const thirdPlace = data.finalStageMatches.find((match) => match.roundName === 'thirdPlace');
  const lastMatches: FinalStageMatch[] = [];
  if (finalMatch) lastMatches.push(finalMatch);
  if (thirdPlace) lastMatches.push(thirdPlace);
  if (lastMatches.length > 0) {
    columns.push({
      id: 'final-final',
      title: 'Final',
      matches: lastMatches.map((match) => ({ id: match.id, label: finalMatchTitle(match.roundName, match.roundOrder), match })),
    });
  }

  return columns;
}

function BracketMatchNode({ displayMatch, data }: { displayMatch: DisplayMatch; data: TournamentData }) {
  const rows = matchRows(displayMatch.match, data);
  return (
    <article className="full-bracket-node" aria-label={displayMatch.label}>
      <span className="full-bracket-node__label">{displayMatch.label}</span>
      {rows.map((row, index) => (
        <div className={row.isWinner ? 'full-bracket-row full-bracket-row--winner' : 'full-bracket-row'} key={index}>
          <span className="full-bracket-seed">{participantSeed(row.ref, data)}</span>
          <span className="full-bracket-name">{participantName(row.ref, data)}</span>
          <span className="full-bracket-score">{scoreText(row.score)}</span>
        </div>
      ))}
    </article>
  );
}

export function TournamentBracketChart() {
  const { data } = useTournament();
  const [zoom, setZoom] = useState(1);
  const hasPlayIn = data.knockoutMatches.length > 0;
  const advancing = advancingPerGroup(data);
  const columns = buildMatchColumns(data, hasPlayIn);

  // ---- Group column layout (drives the overall height) ----
  const displayGroups = groupDisplayOrder(data.groups, hasPlayIn);
  let cursor = topPad;
  const groupBoxes = displayGroups.map((group) => {
    const rows = computeGroupStandings(group).map((row) => ({ rank: row.rank, player: getPlayer(data.players, row.playerId) }));
    const height = groupHeaderH + rows.length * groupRowH;
    const top = cursor;
    cursor += height + groupBoxGap;
    return { group, rows, top, height };
  });
  const groupSpanTop = topPad;
  const groupSpanBottom = groupBoxes.length > 0 ? cursor - groupBoxGap : topPad;

  const groupRowCenter = (groupId: string, rank: number): number | null => {
    const box = groupBoxes.find((candidate) => candidate.group.id === groupId);
    if (!box) return null;
    return box.top + groupHeaderH + (rank - 1) * groupRowH + groupRowH / 2;
  };

  // ---- Vertical position of every match node (node top), column by column ----
  const nodeTop = new Map<string, number>();
  const setCenter = (id: string, centerY: number) => nodeTop.set(id, centerY - matchHeight / 2);
  const centerOf = (id: string): number => (nodeTop.get(id) ?? topPad) + matchHeight / 2;

  const roundOne = data.knockoutMatches.filter((match) => match.round === 1).sort(knockoutSort);
  const playInBlueprint = generateKnockoutMatches(data.groups).filter((match) => match.round === 1);
  const minNodeGap = matchHeight + minMatchGap;

  // Each Round-1 match's primary (rank-2) feeder always lands at that group's
  // row, so snapping the node to that row's centre makes the group -> Round-1
  // line exactly horizontal. The clamp keeps nodes from overlapping when two
  // rows land close together.
  const r1PrimaryRowY = new Map<string, number>();
  playInBlueprint.forEach((match) => {
    const ref = match.participant1;
    if (ref.type !== 'groupSeed') return;
    const y = groupRowCenter(ref.groupId, ref.seed);
    if (y !== null) r1PrimaryRowY.set(match.id, y);
  });

  const knockoutSpan = Math.max(0, groupSpanBottom - groupSpanTop);
  if (hasPlayIn && roundOne.length > 0) {
    let previousCenter = -Infinity;
    roundOne.forEach((match, index) => {
      const evenSpread = groupSpanTop + (knockoutSpan * (index + 0.5)) / roundOne.length;
      const primaryRowY = r1PrimaryRowY.get(match.id);
      const center = Math.max(primaryRowY ?? evenSpread, previousCenter + minNodeGap);
      setCenter(match.id, center);
      previousCenter = center;
    });
  }

  const finalColumns = columns.filter((column) => column.id.startsWith('final-'));
  // Entrant order feeding the first final round (bracket order); shared with the
  // column display order so the chart and the real final-stage pairing match.
  const roundTwoUnordered = data.knockoutMatches.filter((match) => match.round === 2);
  const r2EntrantOrder = orderRoundTwoMatches(roundTwoUnordered, { crossPodSemis: isMensTournament(data) });
  const groupSeedEntrants: Array<{ groupId: string; rank: number }> = data.groups.flatMap((group) =>
    [1, 2].map((rank) => ({ groupId: group.id, rank })),
  );

  // Knockout Round 2: snap each node to its own Round-1 feeder's centre so the
  // Round 1 -> Round 2 line is exactly horizontal, falling back to an even
  // spread for matches with no single-match feeder. The clamp preserves
  // bracket display order when feeders land close together.
  if (hasPlayIn && r2EntrantOrder.length > 0) {
    const span = Math.max(0, groupSpanBottom - groupSpanTop);
    let previousCenter = -Infinity;
    r2EntrantOrder.forEach((match, index) => {
      const evenSpread = groupSpanTop + (span * (index + 0.5)) / r2EntrantOrder.length;
      const feeder = [match.participant1, match.participant2].find((ref) => ref.type === 'matchWinner');
      const feederCenter = feeder && feeder.type === 'matchWinner' ? centerOf(feeder.matchId) : undefined;
      const center = Math.max(feederCenter ?? evenSpread, previousCenter + minNodeGap);
      setCenter(match.id, center);
      previousCenter = center;
    });
  }

  // Final-stage rounds: each match centers between the two matches feeding it.

  finalColumns.forEach((column, columnIndex) => {
    column.matches.forEach((displayMatch, matchIndex) => {
      const final = displayMatch.match as FinalStageMatch;
      if (final.roundName === 'thirdPlace') return; // positioned relative to the final below
      let center: number | null = null;
      if (columnIndex === 0) {
        // First final round is fed by the play-in winners or directly by group seeds.
        if (hasPlayIn) {
          const a = r2EntrantOrder[matchIndex * 2];
          const b = r2EntrantOrder[matchIndex * 2 + 1];
          const ys = [a, b].filter(Boolean).map((m) => centerOf(m!.id));
          if (ys.length) center = ys.reduce((sum, y) => sum + y, 0) / ys.length;
        } else {
          const a = groupSeedEntrants[matchIndex * 2];
          const b = groupSeedEntrants[matchIndex * 2 + 1];
          const ys = [a, b]
            .filter(Boolean)
            .map((seed) => groupRowCenter(seed!.groupId, seed!.rank))
            .filter((y): y is number => y !== null);
          if (ys.length) center = ys.reduce((sum, y) => sum + y, 0) / ys.length;
        }
      } else {
        const prev = finalColumns[columnIndex - 1];
        const childA = prev.matches[matchIndex * 2];
        const childB = prev.matches[matchIndex * 2 + 1];
        const ys = [childA, childB].filter(Boolean).map((child) => centerOf(child!.id));
        if (ys.length) center = ys.reduce((sum, y) => sum + y, 0) / ys.length;
      }
      if (center !== null) setCenter(displayMatch.id, center);
    });
  });

  // Third-place match: tuck it just beneath the final.
  const finalColumn = finalColumns[finalColumns.length - 1];
  if (finalColumn) {
    const finalNode = finalColumn.matches.find((m) => (m.match as FinalStageMatch).roundName === 'final');
    const thirdNode = finalColumn.matches.find((m) => (m.match as FinalStageMatch).roundName === 'thirdPlace');
    if (thirdNode) {
      const base = finalNode ? nodeTop.get(finalNode.id) ?? topPad : topPad;
      nodeTop.set(thirdNode.id, base + matchHeight + minMatchGap + 18);
    }
  }

  // ---- Node x positions ----
  const slotLeft = (slot: number) => slot * (matchWidth + columnGap);
  const nodeX = new Map<string, number>();
  columns.forEach((column, columnIndex) => {
    column.matches.forEach((displayMatch) => nodeX.set(displayMatch.id, slotLeft(columnIndex + 1)));
  });

  // ---- Connectors ----
  // Every connector runs centre-to-centre, so a connection between two
  // vertically aligned cells is a perfectly horizontal line, while the
  // unavoidable cross-seedings read as clean Xs.
  const segments: Segment[] = [];
  const centerYOf = (id: string): number | null => {
    const top = nodeTop.get(id);
    return top === undefined ? null : top + matchHeight / 2;
  };
  const pushMatchToMatch = (fromId: string, toId: string) => {
    const fx = nodeX.get(fromId);
    const tx = nodeX.get(toId);
    const fy = centerYOf(fromId);
    const ty = centerYOf(toId);
    if (fx === undefined || tx === undefined || fy === null || ty === null) return;
    segments.push({ sx: fx + matchWidth, sy: fy, ex: tx, ey: ty });
  };
  const pushGroupToMatch = (groupId: string, rank: number, toId: string) => {
    const sy = groupRowCenter(groupId, rank);
    const tx = nodeX.get(toId);
    const ty = centerYOf(toId);
    if (sy === null || tx === undefined || ty === null) return;
    segments.push({ sx: matchWidth, sy, ex: tx, ey: ty });
  };

  if (hasPlayIn) {
    // Group play-in seeds -> Round 1 (mapped from the stable blueprint so the
    // lines survive once Round-1 refs freeze to concrete players).
    const seedToR1 = new Map<string, string>();
    playInBlueprint.forEach((match) => {
      [match.participant1, match.participant2].forEach((ref) => {
        if (ref.type === 'groupSeed') seedToR1.set(`${ref.groupId}:${ref.seed}`, match.id);
      });
    });
    data.groups.forEach((group) => {
      for (let rank = 2; rank <= advancing; rank += 1) {
        const target = seedToR1.get(`${group.id}:${rank}`);
        if (target) pushGroupToMatch(group.id, rank, target);
      }
    });

    // Round 1 -> Round 2
    r2EntrantOrder.forEach((match) => {
      const feeder = [match.participant1, match.participant2].find((ref) => ref.type === 'matchWinner');
      if (feeder && feeder.type === 'matchWinner') pushMatchToMatch(feeder.matchId, match.id);
    });

    // Round 2 -> first final round
    const firstFinal = finalColumns[0];
    if (firstFinal) {
      r2EntrantOrder.forEach((match, entrantIndex) => {
        const target = firstFinal.matches[Math.floor(entrantIndex / 2)];
        if (target) pushMatchToMatch(match.id, target.id);
      });
    }
  } else {
    // No play-in: group seeds feed the first final round directly (no byes).
    const firstFinal = finalColumns[0];
    if (firstFinal) {
      groupSeedEntrants.forEach((seed, entrantIndex) => {
        if (seed.rank > advancing) return;
        const target = firstFinal.matches[Math.floor(entrantIndex / 2)];
        if (target) pushGroupToMatch(seed.groupId, seed.rank, target.id);
      });
    }
  }

  // Final round -> next final round
  for (let index = 0; index < finalColumns.length - 1; index += 1) {
    const current = finalColumns[index];
    const next = finalColumns[index + 1];
    current.matches.forEach((displayMatch, matchIndex) => {
      if ((displayMatch.match as FinalStageMatch).roundName === 'thirdPlace') return;
      const target = next.matches[Math.floor(matchIndex / 2)];
      if (target && (target.match as FinalStageMatch).roundName !== 'thirdPlace') {
        pushMatchToMatch(displayMatch.id, target.id);
      }
    });
  }

  // Straight diagonal connectors: overlaps read as clean Xs rather than
  // stacked right-angle channels.
  const paths = segments.map((segment) => `M ${segment.sx} ${segment.sy} L ${segment.ex} ${segment.ey}`);

  // ---- Board dimensions ----
  const totalSlots = 1 + columns.length;
  const boardWidth = totalSlots * matchWidth + Math.max(0, totalSlots - 1) * columnGap;
  const matchBottom = nodeTop.size > 0 ? Math.max(...nodeTop.values()) + matchHeight : topPad;
  const boardHeight = Math.max(groupSpanBottom, matchBottom) + bottomPad;

  // ---- Phase headers ----
  const knockoutCols = columns.filter((column) => column.id.startsWith('knockout-')).length;
  const finalCols = finalColumns.length;
  const hasQuarters = data.finalStageMatches.some((match) => match.roundName === 'quarterfinal');
  const hasSemis = data.finalStageMatches.some((match) => match.roundName === 'semifinal');
  const finalPhaseLabel = hasQuarters ? 'Finals' : hasSemis ? 'Final Four' : 'Final';
  const phaseHeaders: Array<{ label: string; startSlot: number; span: number }> = [
    { label: 'Group Stage', startSlot: 0, span: 1 },
  ];
  if (knockoutCols > 0) phaseHeaders.push({ label: 'Knockout Stage', startSlot: 1, span: knockoutCols });
  if (finalCols > 0) phaseHeaders.push({ label: finalPhaseLabel, startSlot: 1 + knockoutCols, span: finalCols });

  const zoomOut = () => setZoom((value) => Math.max(zoomMin, Math.round((value - zoomStep) * 100) / 100));
  const zoomIn = () => setZoom((value) => Math.min(zoomMax, Math.round((value + zoomStep) * 100) / 100));

  return (
    <section className="full-bracket-shell" aria-label="Tournament bracket">
      <div className="full-bracket-zoom-controls">
        <button disabled={zoom <= zoomMin} onClick={zoomOut} type="button">
          Zoom out
        </button>
        <span className="full-bracket-zoom-level">{Math.round(zoom * 100)}%</span>
        <button disabled={zoom >= zoomMax} onClick={zoomIn} type="button">
          Zoom in
        </button>
        <button disabled={zoom === 1} onClick={() => setZoom(1)} type="button">
          Reset
        </button>
      </div>
      <div className="full-bracket-zoom-frame" style={{ width: boardWidth * zoom, height: boardHeight * zoom }}>
        <div
          className="full-bracket-canvas"
          style={{ width: boardWidth, height: boardHeight, transform: `scale(${zoom})` }}
        >
          <svg
            className="full-bracket-lines bracket-chart-lines"
            height={boardHeight}
            viewBox={`0 0 ${boardWidth} ${boardHeight}`}
            width={boardWidth}
          >
            {paths.map((d, index) => (
              <path d={d} key={index} />
            ))}
          </svg>

          {phaseHeaders.map((header) => (
            <div
              className="tournament-bracket-phase-header"
              key={header.label}
              style={{ left: slotLeft(header.startSlot), width: header.span * matchWidth + Math.max(0, header.span - 1) * columnGap }}
            >
              {header.label}
            </div>
          ))}

          {columns.map((column, columnIndex) => (
            <div
              className="full-bracket-column-title"
              key={column.id}
              style={{ left: slotLeft(columnIndex + 1), top: columnTitleTop, width: matchWidth }}
            >
              {column.title}
            </div>
          ))}

          {groupBoxes.map((box) => (
            <div className="group-stage-box" key={box.group.id} style={{ left: 0, top: box.top, width: matchWidth }}>
              <div className="group-stage-box__header">{box.group.name}</div>
              {box.rows.map((row) => {
                const showBye = hasPlayIn && row.rank === 1;
                const isEliminated = row.rank > advancing;
                return (
                  <div className="group-stage-row" key={row.rank}>
                    <span className="group-stage-rank">{row.rank}</span>
                    <span className="group-stage-name">{row.player?.name ?? 'TBD'}</span>
                    {showBye ? <span className="group-stage-bye-badge">Bye</span> : null}
                    {isEliminated ? <span className="group-stage-eliminated-tag">Eliminated</span> : null}
                  </div>
                );
              })}
            </div>
          ))}

          {columns.map((column, columnIndex) =>
            column.matches.map((displayMatch) => (
              <div
                className="full-bracket-node-wrap"
                key={displayMatch.id}
                style={{ left: slotLeft(columnIndex + 1), top: nodeTop.get(displayMatch.id) ?? topPad, width: matchWidth }}
              >
                <BracketMatchNode data={data} displayMatch={displayMatch} />
              </div>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
