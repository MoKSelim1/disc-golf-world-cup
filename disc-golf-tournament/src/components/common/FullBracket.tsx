import type { CSSProperties } from 'react';
import type { FinalStageMatch, FinalRoundName, KnockoutMatch, ParticipantRef, Player, PlayerId, TournamentData } from '../../types/tournament';
import { useTournament } from '../../context/TournamentContext';
import { computeGroupStandings } from '../../lib/groupStandings';
import {
  finalMatchTitle,
  finalRoundTitle,
  knockoutMatchTitle,
  knockoutSort,
  participantLabel,
  scoreText,
} from '../../lib/display';

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

type BracketConnection = {
  fromColumn: string;
  fromMatchId: string;
  toColumn: string;
  toMatchId: string;
};

const finalRoundOrder: FinalRoundName[] = ['roundOf16', 'quarterfinal', 'semifinal', 'final'];
const matchWidth = 300;
const matchHeight = 74;
const rowHeight = 102;
const columnGap = 96;
const topPad = 54;
const bottomPad = 24;

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

function buildColumns(data: TournamentData): BracketColumn[] {
  const columns: BracketColumn[] = [];
  const knockoutRoundOne = data.knockoutMatches.filter((match) => match.round === 1).sort(knockoutSort);
  const knockoutRoundTwo = data.knockoutMatches.filter((match) => match.round === 2).sort(knockoutSort);

  if (knockoutRoundOne.length > 0) {
    columns.push({
      id: 'knockout-1',
      title: 'Knockout R1',
      matches: knockoutRoundOne.map((match) => ({
        id: match.id,
        label: knockoutMatchTitle(match),
        match,
      })),
    });
  }

  if (knockoutRoundTwo.length > 0) {
    columns.push({
      id: 'knockout-2',
      title: 'Knockout R2',
      matches: knockoutRoundTwo.map((match) => ({
        id: match.id,
        label: knockoutMatchTitle(match),
        match,
      })),
    });
  }

  finalRoundOrder.forEach((roundName) => {
    const matches = data.finalStageMatches
      .filter((match) => match.roundName === roundName)
      .sort((a, b) => a.roundOrder - b.roundOrder);

    if (matches.length === 0) return;

    columns.push({
      id: `final-${roundName}`,
      title: finalRoundTitle(roundName),
      matches: matches.map((match) => ({
        id: match.id,
        label: finalMatchTitle(match.roundName, match.roundOrder),
        match,
      })),
    });
  });

  return columns;
}

function buildConnections(columns: BracketColumn[], data: TournamentData): BracketConnection[] {
  const connections: BracketConnection[] = [];
  const columnIds = columns.map((column) => column.id);
  const knockoutOne = columns.find((column) => column.id === 'knockout-1');
  const knockoutTwo = columns.find((column) => column.id === 'knockout-2');
  const firstFinal = columns.find((column) => column.id.startsWith('final-'));

  if (knockoutOne && knockoutTwo) {
    knockoutTwo.matches.forEach((displayMatch) => {
      const match = displayMatch.match as KnockoutMatch;
      const refs = [match.participant1, match.participant2];
      refs.forEach((ref) => {
        if (ref.type === 'matchWinner' && knockoutOne.matches.some((candidate) => candidate.id === ref.matchId)) {
          connections.push({
            fromColumn: knockoutOne.id,
            fromMatchId: ref.matchId,
            toColumn: knockoutTwo.id,
            toMatchId: displayMatch.id,
          });
        }
      });
    });
  }

  if (knockoutTwo && firstFinal) {
    knockoutTwo.matches.forEach((displayMatch, index) => {
      const target = firstFinal.matches[Math.floor(index / 2)];
      if (!target) return;
      connections.push({
        fromColumn: knockoutTwo.id,
        fromMatchId: displayMatch.id,
        toColumn: firstFinal.id,
        toMatchId: target.id,
      });
    });
  }

  for (let index = 0; index < columnIds.length - 1; index += 1) {
    const current = columns[index];
    const next = columns[index + 1];
    if (!current.id.startsWith('final-') || !next.id.startsWith('final-')) continue;

    current.matches.forEach((displayMatch, matchIndex) => {
      const target = next.matches[Math.floor(matchIndex / 2)];
      if (!target) return;
      connections.push({
        fromColumn: current.id,
        fromMatchId: displayMatch.id,
        toColumn: next.id,
        toMatchId: target.id,
      });
    });
  }

  return connections;
}

function matchTop(column: BracketColumn, index: number, maxMatches: number): number {
  const slotSpan = maxMatches / Math.max(1, column.matches.length);
  return topPad + ((index * slotSpan) + (slotSpan / 2)) * rowHeight - (matchHeight / 2);
}

function matchStyle(columnIndex: number, column: BracketColumn, matchIndex: number, maxMatches: number): CSSProperties {
  return {
    left: columnIndex * (matchWidth + columnGap),
    top: matchTop(column, matchIndex, maxMatches),
    width: matchWidth,
  };
}

function FullBracketMatch({ displayMatch, data }: { displayMatch: DisplayMatch; data: TournamentData }) {
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

export function FullBracket() {
  const { data } = useTournament();
  const columns = buildColumns(data);
  const thirdPlace = data.finalStageMatches.find((match) => match.roundName === 'thirdPlace');

  if (columns.length === 0) {
    return (
      <section className="panel">
        <p className="panel-note">No bracket matches have been generated yet.</p>
      </section>
    );
  }

  const maxMatches = Math.max(...columns.map((column) => column.matches.length), 1);
  const boardWidth = columns.length * matchWidth + Math.max(0, columns.length - 1) * columnGap;
  const boardHeight = topPad + maxMatches * rowHeight + bottomPad;
  const positions = new Map<string, { x: number; y: number }>();

  columns.forEach((column, columnIndex) => {
    column.matches.forEach((displayMatch, matchIndex) => {
      positions.set(`${column.id}:${displayMatch.id}`, {
        x: columnIndex * (matchWidth + columnGap),
        y: matchTop(column, matchIndex, maxMatches),
      });
    });
  });

  const connections = buildConnections(columns, data);

  return (
    <section className="full-bracket-shell" aria-label="Full tournament bracket">
      <div className="full-bracket-canvas" style={{ width: boardWidth, height: boardHeight }}>
        <svg className="full-bracket-lines" height={boardHeight} viewBox={`0 0 ${boardWidth} ${boardHeight}`} width={boardWidth}>
          {connections.map((connection) => {
            const from = positions.get(`${connection.fromColumn}:${connection.fromMatchId}`);
            const to = positions.get(`${connection.toColumn}:${connection.toMatchId}`);
            if (!from || !to) return null;

            const startX = from.x + matchWidth;
            const startY = from.y + matchHeight / 2;
            const endX = to.x;
            const endY = to.y + matchHeight / 2;
            const midX = startX + (endX - startX) / 2;

            return (
              <path
                d={`M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`}
                key={`${connection.fromMatchId}-${connection.toMatchId}`}
              />
            );
          })}
        </svg>
        {columns.map((column, columnIndex) => (
          <div
            className="full-bracket-column-title"
            key={column.id}
            style={{ left: columnIndex * (matchWidth + columnGap), width: matchWidth }}
          >
            {column.title}
          </div>
        ))}
        {columns.map((column, columnIndex) =>
          column.matches.map((displayMatch, matchIndex) => (
            <div
              className="full-bracket-node-wrap"
              key={displayMatch.id}
              style={matchStyle(columnIndex, column, matchIndex, maxMatches)}
            >
              <FullBracketMatch data={data} displayMatch={displayMatch} />
            </div>
          )),
        )}
      </div>
      {thirdPlace ? (
        <div className="full-bracket-consolation">
          <FullBracketMatch
            data={data}
            displayMatch={{
              id: thirdPlace.id,
              label: 'Third Place Match',
              match: thirdPlace,
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
