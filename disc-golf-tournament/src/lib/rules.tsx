import type { ReactNode } from 'react';
import type { TournamentData } from '../types/tournament';
import { hasTenPlayerPlayIn } from './tournament';

export const DEFAULT_RULES_MARKDOWN = `### Entry
$30 buy-in. Contact the tournament manager for payment and event details.

Each player represents a selected country or team name.

### Group Stage
Groups play a round robin at North Park from short pads.

Week labels identify the planned matchups only; group-stage matches may be played in any order.

Standings are ordered by match wins, then lower aggregate score.

Group winners receive a bye into Knockout Round 2. Second and third place advance to Knockout Round 1.

### Knockout Stage
Second-place finishers face third-place finishers from paired groups. Round 1 winners meet group winners in Round 2.

### Final Four
The final stage uses long tee positions with semifinals, a third-place match, and the championship final.`;

export const TEN_PLAYER_RULES_MARKDOWN = `### Entry
$30 buy-in. Contact the tournament manager for payment and event details.

Each player represents a selected country or team name.

### Group Stage
Two groups of five play a round robin at North Park from short pads.

Week labels identify the planned matchups only; group-stage matches may be played in any order.

Standings are ordered by match wins, then lower aggregate score.

The top three players in each group advance.

### Knockout Stage
The Group A winner and Group B winner receive byes. Second place in Group A plays third place in Group B, and second place in Group B plays third place in Group A.

Round 1 winners meet a group winner in Round 2.

### Final
The two Round 2 winners meet for the championship.`;

export const GROUP_TOP_TWO_RULES_MARKDOWN = `### Entry
$30 buy-in. Contact the tournament manager for payment and event details.

Each player represents a selected country or team name.

### Group Stage
Groups play a round robin at North Park from short pads.

Week labels identify the planned matchups only; group-stage matches may be played in any order.

Standings are ordered by match wins, then lower aggregate score.

The top two players in each group advance directly to the final bracket.

### Final Bracket
Final-stage matchups are seeded from the qualifying group finishers.`;

export function rulesMarkdownForTournament(data: TournamentData): string {
  if (data.rulesMarkdown?.trim()) return data.rulesMarkdown;
  if (hasTenPlayerPlayIn(data)) return TEN_PLAYER_RULES_MARKDOWN;
  if ((data.format ?? 'worldCupTopThree') === 'groupTopTwoFinal') return GROUP_TOP_TWO_RULES_MARKDOWN;
  return DEFAULT_RULES_MARKDOWN;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const content = token.startsWith('**') ? token.slice(2, -2) : token.slice(1, -1);
    nodes.push(
      token.startsWith('**') ? <strong key={`${match.index}-strong`}>{content}</strong> : <em key={`${match.index}-em`}>{content}</em>,
    );
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export function renderRulesMarkdown(markdown: string): ReactNode[] {
  const blocks: ReactNode[] = [];
  const lines = markdown.split(/\r?\n/);
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length === 0) return;
    const items = listItems;
    listItems = [];
    blocks.push(
      <ul key={`list-${blocks.length}`}>
        {items.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();

    if (trimmed.startsWith('### ')) {
      blocks.push(<h3 key={`h3-${blocks.length}`}>{renderInline(trimmed.slice(4))}</h3>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(<h2 key={`h2-${blocks.length}`}>{renderInline(trimmed.slice(3))}</h2>);
      return;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(<h1 key={`h1-${blocks.length}`}>{renderInline(trimmed.slice(2))}</h1>);
      return;
    }

    blocks.push(<p key={`p-${blocks.length}`}>{renderInline(trimmed)}</p>);
  });

  flushList();
  return blocks;
}
