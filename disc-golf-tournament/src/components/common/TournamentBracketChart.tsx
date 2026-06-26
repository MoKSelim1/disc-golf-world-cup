import type { CSSProperties } from 'react';
import type {
  FinalStageMatch,
  KnockoutMatch,
  ParticipantRef,
  Player,
  PlayerId,
  TournamentData,
} from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';
import { computeGroupStandings } from '../../lib/groupStandings';
import { generateKnockoutMatches } from '../../lib/knockoutBracket';
import { advancingPerGroup } from '../../lib/tournament';
import {
  finalMatchTitle,
  getPlayer,
  knockoutMatchTitle,
  knockoutSort,
  participantLabel,
  scoreText,
} from '../../lib/display';

// ---- Layout constants (mirrors FullBracket.tsx, with room for a group column) ----
const matchWidth = 300;
const matchHeight = 74;
const rowHeight = 102;
const columnGap = 96;
const topPad = 80;
const bottomPad = 30;
const columnTitleTop = 30;

// Group column (left-most) has its own fixed vertical rhythm.
const groupHeaderH = 36;
const groupRowH = 40;
const groupBoxGap = 26;

type DisplayMatch = {
  id: string;
  label: string;
  match: KnockoutMatch | FinalStageMatch;
};

type BracketColumn = {
  id: string;
  title: string;
  matches: DisplayMatch[];
};

type MatchToMatch = {
  fromId: string;
  toId: string;
};

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
    return {
      ...row,
      playerId,
      isWinner: Boolean(playerId && match.winnerId === playerId),
    };
  });
}

// ---- Column model ----
function buildMatchColumns(data: TournamentData): { columns: BracketColumn[]; hasSemis: boolean } {
  const columns: BracketColumn[] = [];
  const roundOne = data.knockoutMatches.filter((match) => match.round === 1).sort(knockoutSort);
  const roundTwo = data.knockoutMatches.filter((match) => match.round === 2).sort(knockoutSort);

  if (roundOne.length > 0) {
    columns.push({
      id: 'knockout-1',
      title: 'Week 1',
      matches: roundOne.map((match) => ({ id: match.id, label: knockoutMatchTitle(match), match })),
    });
  }

  if (roundTwo.length > 0) {
    columns.push({
      id: 'knockout-2',
      title: 'Week 2',
      matches: roundTwo.map((match) => ({ id: match.id, label: knockoutMatchTitle(match), match })),
    });
  }

  const semis = data.finalStageMatches
    .filter((match) => match.roundName === 'semifinal')
    .sort((a, b) => a.roundOrder - b.roundOrder);
  const hasSemis = semis.length > 0;

  if (hasSemis) {
    columns.push({
      id: 'final-semifinal',
      title: 'Week 1',
      matches: semis.map((match) => ({ id: match.id, label: finalMatchTitle(match.roundName, match.roundOrder), match })),
    });
  }

  // Final + third-place share the last column (the user's "Final Four · Week 2").
  const finalMatch = data.finalStageMatches.find((match) => match.roundName === 'final');
  const thirdPlace = data.finalStageMatches.find((match) => match.roundName === 'thirdPlace');
  const lastMatches: FinalStageMatch[] = [];
  if (finalMatch) lastMatches.push(finalMatch);
  if (thirdPlace) lastMatches.push(thirdPlace);

  if (lastMatches.length > 0) {
    columns.push({
      id: 'final-last',
      title: hasSemis ? 'Week 2' : 'Final',
      matches: lastMatches.map((match) => ({ id: match.id, label: finalMatchTitle(match.roundName, match.roundOrder), match })),
    });
  }

  return { columns, hasSemis };
}

// Match-to-match connectors, mirroring FullBracket.buildConnections but flattened
// to a single positions map (no per-column lookups needed downstream).
function buildMatchConnections(columns: BracketColumn[]): MatchToMatch[] {
  const connections: MatchToMatch[] = [];
  const knockoutOne = columns.find((column) => column.id === 'knockout-1');
  const knockoutTwo = columns.find((column) => column.id === 'knockout-2');
  const firstFinal = columns.find((column) => column.id.startsWith('final-'));

  if (knockoutOne && knockoutTwo) {
    knockoutTwo.matches.forEach((displayMatch) => {
      const match = displayMatch.match as KnockoutMatch;
      [match.participant1, match.participant2].forEach((ref) => {
        if (ref.type === 'matchWinner' && knockoutOne.matches.some((candidate) => candidate.id === ref.matchId)) {
          connections.push({ fromId: ref.matchId, toId: displayMatch.id });
        }
      });
    });
  }

  if (knockoutTwo && firstFinal) {
    knockoutTwo.matches.forEach((displayMatch, index) => {
      const target = firstFinal.matches[Math.floor(index / 2)];
      if (target) connections.push({ fromId: displayMatch.id, toId: target.id });
    });
  }

  for (let index = 0; index < columns.length - 1; index += 1) {
    const current = columns[index];
    const next = columns[index + 1];
    if (!current.id.startsWith('final-') || !next.id.startsWith('final-')) continue;
    current.matches.forEach((displayMatch, matchIndex) => {
      const target = next.matches[Math.floor(matchIndex / 2)];
      if (target) connections.push({ fromId: displayMatch.id, toId: target.id });
    });
  }

  return connections;
}

// ---- Positioning ----
function matchTop(matchCount: number, index: number, maxMatches: number): number {
  const slotSpan = maxMatches / Math.max(1, matchCount);
  return topPad + (index * slotSpan + slotSpan / 2) * rowHeight - matchHeight / 2;
}

function slotLeft(slot: number): number {
  return slot * (matchWidth + columnGap);
}

function rowAnchorY(nodeTop: number, rowSlot: number): number {
  return nodeTop + (rowSlot === 0 ? matchHeight * 0.25 : matchHeight * 0.75);
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
  const { columns, hasSemis } = buildMatchColumns(data);
  const advancing = advancingPerGroup(data);

  // Group-stage boxes (left-most column).
  const groupBoxes = data.groups.map((group) => ({
    group,
    rows: computeGroupStandings(group).map((row) => ({
      rank: row.rank,
      player: getPlayer(data.players, row.playerId),
    })),
  }));

  let cursor = topPad;
  const groupLayout = groupBoxes.map((box) => {
    const height = groupHeaderH + box.rows.length * groupRowH;
    const top = cursor;
    cursor += height + groupBoxGap;
    return { ...box, top, height };
  });
  const groupColumnBottom = groupLayout.length > 0 ? cursor - groupBoxGap + bottomPad : topPad + bottomPad;

  // Match-node positions keyed by id (every match id is unique across columns).
  const maxMatches = Math.max(...columns.map((column) => column.matches.length), 1);
  const nodePositions = new Map<string, { x: number; y: number }>();
  columns.forEach((column, columnIndex) => {
    column.matches.forEach((displayMatch, matchIndex) => {
      nodePositions.set(displayMatch.id, {
        x: slotLeft(columnIndex + 1),
        y: matchTop(column.matches.length, matchIndex, maxMatches),
      });
    });
  });

  // Blueprint mapping: which Round-1 match/row each (group, seed) feeds into.
  // Built from the stable blueprint (always groupSeed-typed) so the lines survive
  // once Round-1 matches are scored and their live refs freeze to concrete players.
  const groupSeedToR1 = new Map<string, { matchId: string; rowSlot: number }>();
  generateKnockoutMatches(data.groups)
    .filter((match) => match.round === 1)
    .forEach((match) => {
      ([[match.participant1, 0], [match.participant2, 1]] as Array<[ParticipantRef, number]>).forEach(([ref, rowSlot]) => {
        if (ref.type === 'groupSeed') {
          groupSeedToR1.set(`${ref.groupId}:${ref.seed}`, { matchId: match.id, rowSlot });
        }
      });
    });

  const matchConnections = buildMatchConnections(columns);

  const totalSlots = 1 + columns.length;
  const boardWidth = totalSlots * matchWidth + Math.max(0, totalSlots - 1) * columnGap;
  const matchColumnBottom = topPad + maxMatches * rowHeight + bottomPad;
  const boardHeight = Math.max(groupColumnBottom, matchColumnBottom);

  // Phase headers spanning their sub-columns.
  const knockoutColCount = columns.filter((column) => column.id.startsWith('knockout-')).length;
  const finalColCount = columns.filter((column) => column.id.startsWith('final-')).length;
  const phaseHeaders: Array<{ label: string; startSlot: number; span: number }> = [
    { label: 'Group Stage', startSlot: 0, span: 1 },
  ];
  if (knockoutColCount > 0) phaseHeaders.push({ label: 'Knockout Stage', startSlot: 1, span: knockoutColCount });
  if (finalColCount > 0) {
    phaseHeaders.push({ label: hasSemis ? 'Final Four' : 'Final', startSlot: 1 + knockoutColCount, span: finalColCount });
  }

  return (
    <section className="full-bracket-shell" aria-label="Tournament bracket">
      <div className="full-bracket-canvas" style={{ width: boardWidth, height: boardHeight }}>
        <svg
          className="full-bracket-lines"
          height={boardHeight}
          viewBox={`0 0 ${boardWidth} ${boardHeight}`}
          width={boardWidth}
        >
          {/* Group-stage -> Knockout R1 connectors (play-in seeds only) */}
          {groupLayout.flatMap((box, groupIndex) =>
            box.rows
              .filter((row) => row.rank >= 2 && row.rank <= advancing)
              .map((row) => {
                const target = groupSeedToR1.get(`${box.group.id}:${row.rank}`);
                if (!target) return null;
                const toNode = nodePositions.get(target.matchId);
                if (!toNode) return null;
                const startX = matchWidth;
                const startY = box.top + groupHeaderH + (row.rank - 1) * groupRowH + groupRowH / 2;
                const endX = toNode.x;
                const endY = rowAnchorY(toNode.y, target.rowSlot);
                const midX = startX + (endX - startX) / 2;
                return (
                  <path
                    d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`}
                    key={`grp-${groupIndex}-${row.rank}`}
                  />
                );
              }),
          )}
          {/* Match -> match connectors */}
          {matchConnections.map((connection) => {
            const from = nodePositions.get(connection.fromId);
            const to = nodePositions.get(connection.toId);
            if (!from || !to) return null;
            const startX = from.x + matchWidth;
            const startY = from.y + matchHeight / 2;
            const endX = to.x;
            const endY = to.y + matchHeight / 2;
            const midX = startX + (endX - startX) / 2;
            return <path d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`} key={`${connection.fromId}-${connection.toId}`} />;
          })}
        </svg>

        {/* Phase headers */}
        {phaseHeaders.map((header) => (
          <div
            className="tournament-bracket-phase-header"
            key={header.label}
            style={{
              left: slotLeft(header.startSlot),
              width: header.span * matchWidth + Math.max(0, header.span - 1) * columnGap,
            }}
          >
            {header.label}
          </div>
        ))}

        {/* Column sub-titles for match columns */}
        {columns.map((column, columnIndex) => (
          <div
            className="full-bracket-column-title"
            key={column.id}
            style={{ left: slotLeft(columnIndex + 1), top: columnTitleTop, width: matchWidth }}
          >
            {column.title}
          </div>
        ))}

        {/* Group-stage boxes */}
        {groupLayout.map((box) => (
          <div className="group-stage-box" key={box.group.id} style={{ left: 0, top: box.top, width: matchWidth }}>
            <div className="group-stage-box__header">{box.group.name}</div>
            {box.rows.map((row) => {
              const isBye = row.rank === 1;
              const isEliminated = row.rank > advancing;
              return (
                <div className="group-stage-row" key={row.rank}>
                  <span className="group-stage-rank">{row.rank}</span>
                  <span className="group-stage-name">{row.player?.name ?? 'TBD'}</span>
                  {isBye ? <span className="group-stage-bye-badge">Bye</span> : null}
                  {isEliminated ? <span className="group-stage-eliminated-tag">Eliminated</span> : null}
                </div>
              );
            })}
          </div>
        ))}

        {/* Match nodes */}
        {columns.map((column, columnIndex) =>
          column.matches.map((displayMatch, matchIndex) => {
            const style: CSSProperties = {
              left: slotLeft(columnIndex + 1),
              top: matchTop(column.matches.length, matchIndex, maxMatches),
              width: matchWidth,
            };
            return (
              <div className="full-bracket-node-wrap" key={displayMatch.id} style={style}>
                <BracketMatchNode data={data} displayMatch={displayMatch} />
              </div>
            );
          }),
        )}
      </div>
    </section>
  );
}
