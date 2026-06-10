import { scoreText } from '../../lib/display';

interface ScoreEditorProps {
  player1: string;
  player2: string;
  player1Score: number | null;
  player2Score: number | null;
  onChange: (player1Score: number | null, player2Score: number | null) => void;
}

function parseScore(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ScoreEditor({
  player1,
  player2,
  player1Score,
  player2Score,
  onChange,
}: ScoreEditorProps) {
  const tied = player1Score !== null && player2Score !== null && player1Score === player2Score;

  return (
    <div className="score-editor">
      <label>
        <span>{player1}</span>
        <input
          inputMode="numeric"
          onChange={(event) => onChange(parseScore(event.target.value), player2Score)}
          placeholder="-"
          type="number"
          value={player1Score ?? ''}
        />
      </label>
      <label>
        <span>{player2}</span>
        <input
          inputMode="numeric"
          onChange={(event) => onChange(player1Score, parseScore(event.target.value))}
          placeholder="-"
          type="number"
          value={player2Score ?? ''}
        />
      </label>
      <div className={tied ? 'score-editor__status score-editor__status--warning' : 'score-editor__status'}>
        {tied ? 'Tie needs organizer decision' : `${scoreText(player1Score)} / ${scoreText(player2Score)}`}
      </div>
    </div>
  );
}
